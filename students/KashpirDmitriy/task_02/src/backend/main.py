from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import sqlite3
import logging

from Models import (
    UserCreate, UserResponse, 
    UsernameWorkerCreate, UsernameWorkerResponse,
    CompanyCreate, CompanyResponse,
    JobCreate, JobResponse,
    ApplicationCreate, ApplicationResponse,
    LoginRequest, Token, MessageResponse, Message, ChatCreate, ChatResponse, BusinessAreasEnum
)
from sqliteDB import get_db_connection, init_db, list_to_json, json_to_list
from Utilities import hash_password, verify_password, create_access_token, verify_token

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Job Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT аутентификация
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Получение текущего пользователя из JWT токена"""
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email: str = payload.get("sub")
    user_id: int = payload.get("user_id")
    if email is None or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Получаем пользователя из базы данных
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, email, name, surname, age, role FROM Users WHERE id = ? AND email = ?",
            (user_id, email)
        )
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return UserResponse(
            id=user[0],
            email=user[1],
            name=user[2],
            surname=user[3],
            age=user[4],
            role=user[5]
        )
    finally:
        connection.close()

# Инициализация базы данных при запуске
@app.on_event("startup")
async def startup_event():
    init_db()

# Вспомогательные функции
def validate_user_data(user: UserCreate):
    """Валидация данных пользователя"""
    if user.age < 14 or user.age > 100:
        raise HTTPException(status_code=400, detail="Age must be between 14 and 100")
    
    if user.role not in ['worker', 'employer']:
        raise HTTPException(status_code=400, detail="Role must be 'worker' or 'employer'")
    
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    if not user.name or not user.surname:
        raise HTTPException(status_code=400, detail="Name and surname are required")
    
    if len(user.name) > 50 or len(user.surname) > 50:
        raise HTTPException(status_code=400, detail="Name and surname must be less than 50 characters")

def user_exists(cursor, user: UserCreate) -> bool:
    """Проверка существования пользователя по email"""
    cursor.execute(
        "SELECT id FROM Users WHERE email = ?", 
        (user.email,)
    )
    return cursor.fetchone() is not None

# Публичные эндпоинты (не требуют авторизации)
@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Регистрация нового пользователя"""
    # Валидация входных данных
    validate_user_data(user)
    
    connection = get_db_connection()
    if not connection:
        logger.error("Database connection failed")
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        if user_exists(cursor, user):
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        hashed_password = hash_password(user.password)
        
        cursor.execute(
            "INSERT INTO Users (email, name, surname, age, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
            (user.email, user.name, user.surname, user.age, user.role, hashed_password)
        )
        user_id = cursor.lastrowid
        
        connection.commit()
        
        logger.info(f"User {user.email} registered successfully with ID {user_id}")
        
        return UserResponse(
            id=user_id,
            email=user.email,
            name=user.name,
            surname=user.surname,
            age=user.age,
            role=user.role
        )
        
    except HTTPException:
        raise
    except sqlite3.IntegrityError as e:
        connection.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(status_code=400, detail="User registration failed due to database constraints")
    except Exception as e:
        connection.rollback()
        logger.error(f"Unexpected error during registration: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed due to internal error")
    finally:
        connection.close()

@app.post("/login", response_model=Token)
async def login(credentials: LoginRequest):
    """Аутентификация пользователя и выдача JWT токена"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        # Ищем пользователя по email
        cursor.execute(
            "SELECT id, email, name, surname, age, role, password_hash FROM Users WHERE email = ?",
            (credentials.email,)
        )
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        user_id, email, name, surname, age, role, password_hash = user
        
        if not verify_password(credentials.password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        access_token = create_access_token(
            data={"sub": email, "user_id": user_id}
        )
        
        logger.info(f"User {email} logged in successfully")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                email=email,
                name=name,
                surname=surname,
                age=age,
                role=role
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")
    finally:
        connection.close()

@app.get("/users", response_model=List[UserResponse])
async def get_users(limit: int = 100, offset: int = 0):
    """Получение списка пользователей с пагинацией"""
    if limit > 1000 or limit < 1:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 1000")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset must be non-negative")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, email, name, surname, age, role FROM Users LIMIT ? OFFSET ?", 
            (limit, offset)
        )
        users = cursor.fetchall()
        
        result = []
        for user in users:
            result.append(UserResponse(
                id=user[0],
                email=user[1],
                name=user[2],
                surname=user[3],
                age=user[4],
                role=user[5]
            ))
        return result
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")
    finally:
        connection.close()

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """Получение пользователя по ID"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, email, name, surname, age, role FROM Users WHERE id = ?", 
            (user_id,)
        )
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=user[0],
            email=user[1],
            name=user[2],
            surname=user[3],
            age=user[4],
            role=user[5]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user")
    finally:
        connection.close()

@app.post("/jobs", response_model=JobResponse)
async def create_job(
    job: JobCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Создание вакансии (требует авторизации)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()

        cursor.execute("SELECT userid FROM Company WHERE id = ?", (job.companyId,))
        company = cursor.fetchone()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        if company[0] != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot create job for another user's company")
        
        skills_json = list_to_json(job.skills)
        language_json = list_to_json(job.language)
        
        cursor.execute(
            """INSERT INTO Job 
            (companyId, salary, name, workExperience, workSchedule, workShift, workHours, skills, language, remote, hybrid) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (job.companyId, job.salary, job.name, job.workExperience, job.workSchedule, 
             job.workShift, job.workHours, skills_json, language_json, job.remote, job.hybrid)  # Добавили job.workShift
        )
        
        job_id = cursor.lastrowid
        connection.commit()
        
        logger.info(f"Job {job.name} created successfully for company {job.companyId}")
        
        cursor.execute("SELECT * FROM Job WHERE id = ?", (job_id,))
        created_job = cursor.fetchone()
        
        skills = json_to_list(created_job['skills'])
        language = json_to_list(created_job['language'])
        
        return JobResponse(
            id=created_job['id'],
            companyId=created_job['companyId'],
            salary=created_job['salary'],
            name=created_job['name'],
            workExperience=created_job['workExperience'],
            workSchedule=created_job['workSchedule'],
            workShift=created_job['workShift'],  
            workHours=created_job['workHours'],
            skills=skills,
            language=language,
            remote=bool(created_job['remote']),
            hybrid=bool(created_job['hybrid']),
            created_at=created_job['created_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        logger.error(f"Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create job")
    finally:
        connection.close()

@app.get("/jobs", response_model=List[JobResponse])
async def get_jobs(limit: int = 100, offset: int = 0):
    """Получение списка вакансий"""
    if limit > 1000 or limit < 1:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 1000")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset must be non-negative")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT * FROM Job ORDER BY created_at DESC LIMIT ? OFFSET ?", 
            (limit, offset)
        )
        jobs = cursor.fetchall()
        
        result = []
        for job in jobs:
            skills = json_to_list(job['skills'])
            language = json_to_list(job['language'])
            result.append(JobResponse(
                id=job['id'],
                companyId=job['companyId'],
                salary=job['salary'],
                name=job['name'],
                workExperience=job['workExperience'],
                workSchedule=job['workSchedule'],
                workHours=job['workHours'],
                skills=skills,
                language=language,
                workShift=job['workShift'],
                remote=bool(job['remote']),
                hybrid=bool(job['hybrid']),
                created_at=job['created_at']
            ))
        return result
    except Exception as e:
        logger.error(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")
    finally:
        connection.close()

@app.get("/employer/jobs", response_model=List[JobResponse])
async def get_employer_jobs(
    current_user: UserResponse = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0
):
    """Получение вакансий текущего работодателя (требует авторизации работодателя)"""
    if current_user.role != 'employer':
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    if limit > 1000 or limit < 1:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 1000")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset must be non-negative")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
    
        cursor.execute(
            "SELECT id FROM Company WHERE userid = ?", 
            (current_user.id,)
        )
        companies = cursor.fetchall()
        
        if not companies:
            return []
        
        company_ids = [company['id'] for company in companies]
    
        placeholders = ','.join(['?'] * len(company_ids))
        query = f"""
            SELECT * FROM Job 
            WHERE companyId IN ({placeholders}) 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        """
        
        params = company_ids + [limit, offset]
        cursor.execute(query, params)
        jobs = cursor.fetchall()
        
        result = []
        for job in jobs:
            skills = json_to_list(job['skills'])
            language = json_to_list(job['language'])
            result.append(JobResponse(
                id=job['id'],
                companyId=job['companyId'],
                salary=job['salary'],
                name=job['name'],
                workExperience=job['workExperience'],
                workSchedule=job['workSchedule'],
                workShift=job['workShift'],
                workHours=job['workHours'],
                skills=skills,
                language=language,
                remote=bool(job['remote']),
                hybrid=bool(job['hybrid']),
                created_at=job['created_at']
            ))
        return result
    except Exception as e:
        logger.error(f"Error fetching employer jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")
    finally:
        connection.close()

from typing import Dict, Any

@app.get("/employer/jobs/applied", response_model=List[Dict[str, Any]])
async def get_employer_jobs_with_applications(
    current_user: UserResponse = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0
):
    if current_user.role != 'employer':
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")

    if limit > 1000 or limit < 1:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 1000")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset must be non-negative")

    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        cursor = connection.cursor()

        cursor.execute("SELECT id FROM Company WHERE userid = ?", (current_user.id,))
        companies = cursor.fetchall()
        if not companies:
            return []

        company_ids = [c['id'] for c in companies]
        placeholders = ','.join(['?'] * len(company_ids))

        # 1) Берём вакансии работодателя + кол-во откликов
        query_jobs = f"""
            SELECT j.*, COUNT(a.ApplicationId) as application_count
            FROM Job j
            LEFT JOIN Applications a ON j.id = a.jobId
            WHERE j.companyId IN ({placeholders})
            GROUP BY j.id
            HAVING application_count > 0
            ORDER BY j.created_at DESC
            LIMIT ? OFFSET ?
        """
        params = company_ids + [limit, offset]
        cursor.execute(query_jobs, params)
        jobs_with_apps = cursor.fetchall()

        result = []

        for job in jobs_with_apps:
            skills = json_to_list(job['skills'])
            language = json_to_list(job['language'])

            # 2) Берём все отклики по этой вакансии + данные юзера + резюме (если есть)
            cursor.execute(
            """
                SELECT
                    a.ApplicationId as application_id,
                    a.resumeId      as resume_row_id,
                    r.userid        as worker_id,
                    a.message       as message,
                    a.creationTime  as creation_time,
                    u.name          as name,
                    u.surname       as surname,
                    u.email         as email,
                    r.title         as resume_title,
                    r.language      as resume_language,
                    r.skills        as resume_skills,
                    r.description   as resume_description,
                    r.workExperience as resume_work_experience
                FROM Applications a
                JOIN UsernameWorker r ON r.id = a.resumeId
                JOIN Users u ON u.id = r.userid
                WHERE a.jobId = ?
                ORDER BY a.creationTime DESC
                """,
                (job['id'],)
            )

            apps = cursor.fetchall()

            applications_info = []
            for row in apps:
                resume_obj = None
                if row['resume_row_id'] is not None:
                    resume_obj = {
                        "id": row['resume_row_id'],
                        "userid": row['applicant_id'],
                        "title": row['resume_title'],
                        "language": json_to_list(row['resume_language']),
                        "skills": json_to_list(row['resume_skills']),
                        "description": row['resume_description'],
                        "workExperience": row['resume_work_experience'],
                    }

                applications_info.append({
                    "workerId": row["worker_id"],
                    "resume_id": row["resume_row_id"],
                    "application_id": row['application_id'],
                    "applicant_id": row['applicant_id'],
                    "applicant_name": f"{row['name']} {row['surname']}",
                    "applicant_email": row['email'],
                    "message": row['message'],
                    "creation_time": row['creation_time'],
                    "resume": resume_obj,
                })


            job_data = {
                "employmentId": job['id'],
                "job": JobResponse(
                    id=job['id'],
                    companyId=job['companyId'],
                    salary=job['salary'],
                    name=job['name'],
                    workExperience=job['workExperience'],
                    workSchedule=job['workSchedule'],
                    workShift=job['workShift'],
                    workHours=job['workHours'],
                    skills=skills,
                    language=language,
                    remote=bool(job['remote']),
                    hybrid=bool(job['hybrid']),
                    created_at=job['created_at'],
                ).dict(),
                "application_count": job['application_count'],
                "applications": applications_info,
            }

            result.append(job_data)

        return result

    except Exception as e:
        logger.error(f"Error fetching employer jobs with applications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs with applications")
    finally:
        connection.close()

@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: int):
    """Получение вакансии по ID"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM Job WHERE id = ?", (job_id,))
        job = cursor.fetchone()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        skills = json_to_list(job['skills'])
        language = json_to_list(job['language'])
        
        return JobResponse(
            id=job['id'],
            companyId=job['companyId'],
            salary=job['salary'],
            name=job['name'],
            workExperience=job['workExperience'],
            workSchedule=job['workSchedule'],
            workHours=job['workHours'],
            skills=skills,
            language=language,
            workShift=job['workShift'],
            remote=bool(job['remote']),
            hybrid=bool(job['hybrid']),
            created_at=job['created_at']
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch job")
    finally:
        connection.close()

@app.post("/resumes", response_model=UsernameWorkerResponse)
async def create_resume(
    resume: UsernameWorkerCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Создание резюме для работника (требует авторизации)"""
    # Проверяем, что пользователь создает резюме для себя
    if resume.userid != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot create resume for another user")
    
    if current_user.role != 'worker':
        raise HTTPException(status_code=400, detail="Only workers can create resumes")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("SELECT id FROM UsernameWorker WHERE userid = ?", (resume.userid,))
        existing_resume = cursor.fetchone()
        
        if existing_resume:
            raise HTTPException(status_code=400, detail="Resume already exists for this user")
        
        skills_json = list_to_json(resume.skills)
        language_json = list_to_json(resume.language)
        
        cursor.execute(
            """INSERT INTO UsernameWorker 
            (userid, title, language, skills, description, workExperience) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (resume.userid, resume.title, language_json, skills_json, resume.description, resume.workExperience)
        )
        
        resume_id = cursor.lastrowid
        connection.commit()
        
        logger.info(f"Resume created successfully for user {resume.userid}")
        
        return UsernameWorkerResponse(
            id=resume_id,
            userid=resume.userid,
            title=resume.title,
            language=resume.language,
            skills=resume.skills,
            description=resume.description,
            workExperience=resume.workExperience
        )
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        logger.error(f"Error creating resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create resume")
    finally:
        connection.close()

@app.get("/resumes/{user_id}", response_model=UsernameWorkerResponse)
async def get_resume(user_id: int, current_user: UserResponse = Depends(get_current_user)):
    """Получение резюме по ID пользователя (требует авторизации)"""
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot access another user's resume")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM UsernameWorker WHERE userid = ?", (user_id,))
        resume = cursor.fetchone()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        skills = json_to_list(resume['skills'])
        language = json_to_list(resume['language'])
        
        return UsernameWorkerResponse(
            id=resume['id'],
            userid=resume['userid'],
            title=resume['title'],
            language=language,
            skills=skills,
            description=resume['description'],
            workExperience=resume['workExperience']
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch resume")
    finally:
        connection.close()


@app.post("/companies", response_model=CompanyResponse)
async def create_company(
    company: CompanyCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Создание компании для работодателя (требует авторизации)"""
    if current_user.role != 'employer':
        raise HTTPException(status_code=400, detail="Only employers can create companies")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        cursor.execute(
            "SELECT id FROM Company WHERE title = ? AND userid = ?", 
            (company.title, current_user.id)
        )
        existing_company = cursor.fetchone()
        
        if existing_company:
            raise HTTPException(
                status_code=400, 
                detail="Company with this name already exists for your account"
            )
        
        business_areas_json = list_to_json([area.value for area in company.businessAreas])
        
        cursor.execute(
            """INSERT INTO Company 
            (userid, title, city, businessAreas) 
            VALUES (?, ?, ?, ?)""",
            (current_user.id, company.title, company.city, business_areas_json)
        )
        
        company_id = cursor.lastrowid
        connection.commit()
        
        logger.info(f"Company {company.title} created successfully for user {current_user.id} with areas: {company.businessAreas}")
        
        return CompanyResponse(
            id=company_id,
            userid=current_user.id,
            title=company.title,
            city=company.city,
            businessAreas=company.businessAreas
        )
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        logger.error(f"Error creating company: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create company")
    finally:
        connection.close()

@app.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: int):
    """Получение информации о компании"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("SELECT * FROM Company WHERE id = ?", (company_id,))
        company = cursor.fetchone()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        business_areas_str = json_to_list(company['businessAreas'])
        business_areas_enum = [BusinessAreasEnum(area) for area in business_areas_str]
        
        return CompanyResponse(
            id=company['id'],
            userid=company['userid'],
            title=company['title'],
            city=company['city'],
            businessAreas=business_areas_enum
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch company")
    finally:
        connection.close()

@app.post("/companies", response_model=CompanyResponse)
async def create_company(
    company: CompanyCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Создание компании для работодателя (требует авторизации)"""
    if current_user.role != 'employer':
        raise HTTPException(status_code=400, detail="Only employers can create companies")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        cursor.execute(
            "SELECT id FROM Company WHERE title = ? AND userid = ?", 
            (company.title, current_user.id)
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=400, 
                detail="Company with this name already exists for your account"
            )
        

        business_areas_json = list_to_json([area.value for area in company.businessAreas])
        
        cursor.execute(
            """INSERT INTO Company 
            (userid, title, city, businessAreas) 
            VALUES (?, ?, ?, ?)""",
            (current_user.id, company.title, company.city, business_areas_json)
        )
        
        company_id = cursor.lastrowid
        connection.commit()
        
        logger.info(f"Company {company.title} created successfully")
        
        return CompanyResponse(
            id=company_id,
            userid=current_user.id,
            title=company.title,
            city=company.city,
            businessAreas=company.businessAreas
        )
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        logger.error(f"Error creating company: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create company")
    finally:
        connection.close()

@app.get("/companies", response_model=List[CompanyResponse])
async def get_all_companies():
    """Получение списка всех компаний"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("SELECT * FROM Company ORDER BY id")
        companies = cursor.fetchall()
        
        result = []
        for company in companies:
            business_areas_str = json_to_list(company['businessAreas'])
            business_areas_enum = [BusinessAreasEnum(area) for area in business_areas_str]
            
            result.append(CompanyResponse(
                id=company['id'],
                userid=company['userid'],
                title=company['title'],
                city=company['city'],
                businessAreas=business_areas_enum
            ))
        
        return result
    
    
        
    except Exception as e:
        logger.error(f"Error fetching companies: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch companies")
    finally:
        connection.close()

@app.get("/users/{user_id}/companies", response_model=List[CompanyResponse])
async def get_companies_by_user_id(
    user_id: int,
    current_user: UserResponse = Depends(get_current_user)
):
    """Получение всех компаний указанного пользователя (требует авторизации)"""
    # Можно добавить проверки прав доступа если нужно
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Проверяем, существует ли пользователь
        cursor = connection.cursor()
        cursor.execute("SELECT role FROM Users WHERE id = ?", (user_id,))
        target_user = cursor.fetchone()
        
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if target_user[0] != 'employer':
            # Если пользователь не работодатель, возвращаем пустой список
            return []
        
        # Получаем компании пользователя
        cursor.execute(
            "SELECT * FROM Company WHERE userid = ? ORDER BY id", 
            (user_id,)
        )
        companies = cursor.fetchall()
        
        result = []
        for company in companies:
            business_areas_str = json_to_list(company['businessAreas'])
            business_areas_enum = [BusinessAreasEnum(area) for area in business_areas_str]
            
            result.append(CompanyResponse(
                id=company['id'],
                userid=company['userid'],
                title=company['title'],
                city=company['city'],
                businessAreas=business_areas_enum
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching companies for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to fetch companies"
        )
    finally:
        connection.close()

@app.post("/message", response_model=MessageResponse)
async def send_message(
    message: Message,
    current_user: UserResponse = Depends(get_current_user)
):
    """Отправка сообщения (требует авторизации)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
     
        cursor.execute("SELECT * FROM Chat WHERE id = ?", (message.chatId,))
        chat = cursor.fetchone()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
     
        if message.senderId != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot send message as another user")

        if message.senderId != chat['workerId'] and message.senderId != chat['employmentId']:
            raise HTTPException(status_code=403, detail="You are not a participant of this chat")

        cursor.execute(
            """INSERT INTO Message (senderId, chatId, text) 
            VALUES (?, ?, ?)""",
            (message.senderId, message.chatId, message.text)
        )
        
        message_id = cursor.lastrowid
        connection.commit()

        cursor.execute("SELECT * FROM Message WHERE id = ?", (message_id,))
        created_message = cursor.fetchone()
        
        logger.info(f"Message {message_id} sent successfully in chat {message.chatId}")
        
        return MessageResponse(
            id=created_message['id'],
            senderId=created_message['senderId'],
            chatId=created_message['chatId'],
            text=created_message['text'],
            created=created_message['created']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")
    finally:
        connection.close()

@app.post("/chats", response_model=ChatResponse)
async def create_chat(
    chat: ChatCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Создание нового чата (требует авторизации)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM Users WHERE id IN (?, ?)", 
                      (chat.employmentId, chat.workerId))
        users = cursor.fetchall()
        
        if len(users) != 2:
            raise HTTPException(status_code=404, detail="One or more users not found")
        cursor.execute(
            "SELECT id FROM Chat WHERE employmentId = ? AND workerId = ?",
            (chat.employmentId, chat.workerId)
        )
        existing_chat = cursor.fetchone()
        
        if existing_chat:
            raise HTTPException(status_code=400, detail="Chat already exists")

        cursor.execute(
            """INSERT INTO Chat (employmentId, workerId) 
            VALUES (?, ?)""",
            (chat.employmentId, chat.workerId)
        )
        
        chat_id = cursor.lastrowid
        connection.commit()
        
        logger.info(f"Chat {chat_id} created between {chat.employmentId} and {chat.workerId}")
        
        return ChatResponse(
            id=chat_id,
            employmentId=chat.employmentId,
            workerId=chat.workerId
        )
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        logger.error(f"Error creating chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create chat")
    finally:
        connection.close()

@app.get("/chats/{chat_id}/messages", response_model=list[MessageResponse])
async def get_chat_messages(
    chat_id: int,
    current_user: UserResponse = Depends(get_current_user)
):
    """Получение сообщений чата (требует авторизации)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("SELECT * FROM Chat WHERE id = ?", (chat_id,))
        chat = cursor.fetchone()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        if current_user.id != chat['workerId'] and current_user.id != chat['employmentId']:
            raise HTTPException(status_code=403, detail="Access denied to this chat")

        cursor.execute(
            "SELECT * FROM Message WHERE chatId = ? ORDER BY created ASC",
            (chat_id,)
        )
        messages = cursor.fetchall()
        
        return [
            MessageResponse(
                id=msg['id'],
                senderId=msg['senderId'],
                chatId=msg['chatId'],
                text=msg['text'],
                created=msg['created']
            ) for msg in messages
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")
    finally:
        connection.close()

@app.get("/chats", response_model=list[ChatResponse])
async def get_user_chats(current_user: UserResponse = Depends(get_current_user)):
    """Получение списка чатов пользователя (требует авторизации)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        # Получаем все чаты, где пользователь является workerId или employmentId
        cursor.execute(
            "SELECT * FROM Chat WHERE workerId = ? OR employmentId = ? ORDER BY id DESC",
            (current_user.id, current_user.id)
        )
        chats = cursor.fetchall()
        
        return [
            ChatResponse(
                id=chat['id'],
                employmentId=chat['employmentId'],
                workerId=chat['workerId']
            ) for chat in chats
        ]
        
    except Exception as e:
        logger.error(f"Error fetching chats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch chats")
    finally:
        connection.close()

@app.get("/chats/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: int,
    current_user: UserResponse = Depends(get_current_user)
):
    """Получение информации о чате (требует авторизации)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("SELECT * FROM Chat WHERE id = ?", (chat_id,))
        chat = cursor.fetchone()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Проверяем, что пользователь является участником чата
        if current_user.id != chat['workerId'] and current_user.id != chat['employmentId']:
            raise HTTPException(status_code=403, detail="Access denied to this chat")
        
        return ChatResponse(
            id=chat['id'],
            employmentId=chat['employmentId'],
            workerId=chat['workerId']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat")
    finally:
        connection.close()

@app.post("/applications", response_model=ApplicationResponse)
async def create_application(
    application: ApplicationCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Подача заявки на вакансию (требует авторизации)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT userid FROM UsernameWorker WHERE userid = ?", (application.resumeId,))
        resume = cursor.fetchone()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        if resume[0] != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot apply with another user's resume")
        
        cursor.execute("SELECT id FROM Job WHERE id = ?", (application.jobId,))
        job = cursor.fetchone()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        cursor.execute(
            "SELECT ApplicationId FROM Applications WHERE resumeId = ? AND jobId = ?", 
            (application.resumeId, application.jobId)
        )
        existing_application = cursor.fetchone()
        
        if existing_application:
            raise HTTPException(status_code=400, detail="Application already exists")
        
        cursor.execute(
            """INSERT INTO Applications 
            (resumeId, jobId, message) 
            VALUES (?, ?, ?)""",
            (application.resumeId, application.jobId, application.message)
        )
        
        application_id = cursor.lastrowid
        connection.commit()
        
        cursor.execute("SELECT * FROM Applications WHERE ApplicationId = ?", (application_id,))
        created_application = cursor.fetchone()
        
        logger.info(f"Application {application_id} created successfully")
        
        return ApplicationResponse(
            ApplicationId=created_application['ApplicationId'],
            resumeId=created_application['resumeId'],
            jobId=created_application['jobId'],
            message=created_application['message'],
            creationTime=created_application['creationTime']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        logger.error(f"Error creating application: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create application")
    finally:
        connection.close()

@app.get("/applications/user", response_model=List[ApplicationResponse])
async def get_user_applications(current_user: UserResponse = Depends(get_current_user)):
    """Получение всех заявок пользователя (требует авторизации)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT * FROM Applications WHERE resumeId = ? ORDER BY creationTime DESC", 
            (current_user.id,)
        )
        applications = cursor.fetchall()
        
        result = []
        for application in applications:
            result.append(ApplicationResponse(
                ApplicationId=application['ApplicationId'],
                resumeId=application['resumeId'],
                jobId=application['jobId'],
                message=application['message'],
                creationTime=application['creationTime']
            ))
        
        return result
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch applications")
    finally:
        connection.close()

@app.get("/health")
async def health_check():
    """Проверка статуса API"""
    return {"status": "healthy", "message": "Job Platform API is running"}

@app.get("/verify-token")
async def verify_token_endpoint(current_user: UserResponse = Depends(get_current_user)):
    """Проверка валидности JWT токена"""
    return {"valid": True, "user": current_user}

@app.get("/profile", response_model=UserResponse)
async def get_profile(current_user: UserResponse = Depends(get_current_user)):
    """Получение профиля текущего пользователя"""
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)