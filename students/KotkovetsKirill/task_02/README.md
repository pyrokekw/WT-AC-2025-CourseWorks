# Вариант 30 — Мини‑курсы «Учусь быстро" (Kotkovets)

Мини‑проекты для курса: Python + Flask + SQLite

MVP реализовано в этой папке: Courses, Lessons (video URL), Progress, Tests (model skeleton), Comments, Users (register/login).

Run:

- python -m venv .venv
- .\.venv\Scripts\activate
- pip install -r requirements.txt
- Set FLASK_APP=run.py (Windows: `set FLASK_APP=run.py`)
- python db_init.py  # creates SQLite DB and seeds demo data
- flask run

Tests:

- pytest
