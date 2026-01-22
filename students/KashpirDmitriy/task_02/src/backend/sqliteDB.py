import sqlite3
import json
from typing import List

def get_db_connection():
    """
    Подключение к дб
    """
    try:
        connection= sqlite3.connect('job_platform.db')
        connection.row_factory= sqlite3.Row
        print('Podkluchenie yspeshno')
        return connection
    except Exception as e:
        print("Error", e)
        return []

def list_to_json(data: List) -> str:
    return json.dumps(data, ensure_ascii=False)

def json_to_list(data:str) -> List:
    if data:
        return json.loads(data)
    return []

def init_db():
    connection = get_db_connection()
    if not connection:
        print("Ne ydalos podklychitsa")
        return
    
    cursor = connection.cursor()

    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                surname TEXT NOT NULL,
                age INTEGER NOT NULL,
                role TEXT CHECK(role IN ('employer', 'worker')) NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS Company (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userid INTEGER NOT NULL,
                title TEXT NOT NULL,
                city TEXT,
                businessAreas TEXT,
                FOREIGN KEY (userid) REFERENCES Users(id)
            )
        ''')
            
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS UsernameWorker (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userid INTEGER NOT NULL,
                title TEXT,
                language TEXT,
                skills TEXT,
                description TEXT,
                workExperience TEXT,
                FOREIGN KEY (userid) REFERENCES Users(id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS Job (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                companyId INTEGER NOT NULL,
                salary REAL,
                name TEXT NOT NULL,
                workExperience TEXT,
                workSchedule TEXT CHECK(workSchedule IN ('полная занятость', 'частичная занятость', 'гибкий график', 'сменный график', 'удаленно', 'гибрид')),
                workShift TEXT CHECK(workShift IN ('5/2', '2/2', '3/2', '1/1')),
                workHours INTEGER,
                skills TEXT,
                language TEXT,
                remote BOOLEAN DEFAULT FALSE,
                hybrid BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (companyId) REFERENCES Company(id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS Applications (
                ApplicationId INTEGER PRIMARY KEY AUTOINCREMENT,
                resumeId INTEGER NOT NULL,
                jobId INTEGER NOT NULL,
                message TEXT,
                creationTime DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (resumeId) REFERENCES Users(id),
                FOREIGN KEY (jobId) REFERENCES Job(id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS Chat (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employmentId INTEGER NOT NULL,
                workerId INTEGER NOT NULL,
                FOREIGN KEY (employmentId) REFERENCES Users(id),
                FOREIGN KEY (workerId) REFERENCES Users(id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS Message (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                senderId INTEGER NOT NULL,
                chatId INTEGER NOT NULL,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                text TEXT,
                FOREIGN KEY (senderId) REFERENCES Users(id),
                FOREIGN KEY (chatId) REFERENCES Chat(id)
            )
        ''')
        
        connection.commit()
        print("Database initialized successfully")
        
    except Exception as e:
        print("Creation error ", e)
    finally:
        cursor.close()
        connection.close()