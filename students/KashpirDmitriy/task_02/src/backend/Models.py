from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import datetime
from enum import Enum
import re

class UserBase(BaseModel):
    email: str
    name: str
    surname: str
    age: int
    role: str  # "employer" or "worker"

    @validator('email')
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class UsernameWorker(BaseModel):
    userid: int
    title: str
    language: List[str]
    skills: List[str]
    description: str
    workExperience: float

class UsernameWorkerCreate(BaseModel):
    userid: int
    title: str
    language: List[str]
    skills: List[str]
    description: str
    workExperience: float

class UsernameWorkerResponse(BaseModel):
    id: int
    userid: int
    title: str
    language: List[str]
    skills: List[str]
    description: str
    workExperience: float

class BusinessAreasEnum(str, Enum):
    DEVOPS = 'DevOps'
    WEB_DEVELOPMENT = 'Web Development'
    MOBILE_DEVELOPMENT = 'Mobile Development'
    DATA_SCIENCE = 'Data Science'
    AI_ML = 'AI/ML'
    CYBERSECURITY = 'Cybersecurity'
    BLOCKCHAIN = 'Blockchain'
    GAME_DEVELOPMENT = 'Game Development'
    UI_UX_DESIGN = 'UI/UX Design'

class CompanyBase(BaseModel):
    title: str
    city: str
    businessAreas: List[BusinessAreasEnum]

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    userid: int

                        
class WorkScheduleEnum(str, Enum):
    FULL_TIME = "полная занятость"
    PART_TIME = "частичная занятость"
    FLEXIBLE = "гибкий график"
    SHIFT = "сменный график"
    REMOTE = "удаленно"
    HYBRID = "гибрид"

class WorkShiftEnum(str, Enum):
    FIVE_TWO = "5/2"
    TWO_TWO = "2/2"
    THREE_TWO = "3/2"
    ONE_ONE = "1/1"

class JobBase(BaseModel):
    companyId: int
    salary: Optional[float] = None
    name: str
    workExperience: Optional[str] = None
    workSchedule: Optional[WorkScheduleEnum] = None
    workShift: Optional[WorkShiftEnum] = None 
    workHours: Optional[int] = None
    skills: List[str]
    language: List[str]
    remote: bool = False
    hybrid: bool = False

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    created_at: datetime

class ApplicationBase(BaseModel):
    resumeId: int
    jobId: int
    message: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(ApplicationBase):
    ApplicationId: int
    creationTime: datetime

class Message(BaseModel):
    senderId: int
    chatId: int
    text: str
    created: Optional[datetime] = None

class MessageResponse(BaseModel):
    id: int
    senderId: int
    chatId: int
    text: str
    created: datetime

class ChatBase(BaseModel):
    employmentId: int
    workerId: int

class ChatCreate(ChatBase):
    pass

class ChatResponse(ChatBase):
    id: int

class LoginRequest(BaseModel):
    email: str
    password: str

    @validator('email')
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v