import pytest
import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from app.extensions import db


@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        # ensure clean DB for tests (remove possible leftovers)
        from app.models import User, Course, Lesson
        User.query.delete()
        Course.query.delete()
        Lesson.query.delete()
        db.session.commit()

        # seed minimal data
        u = User(username='testuser', email='t@example.com')
        u.set_password('secret')
        db.session.add(u)
        c = Course(title='Test Course', description='Desc')
        db.session.add(c)
        db.session.flush()
        l = Lesson(course_id=c.id, title='L1', content='c1')
        db.session.add(l)
        # add a simple test for this course
        from app.models import Test, Question, Option
        t = Test(course_id=c.id, title='Sample Test', description='A short sample')
        db.session.add(t)
        db.session.flush()
        q1 = Question(test_id=t.id, text='Which keyword defines a function?')
        q2 = Question(test_id=t.id, text='Which is mutable?')
        db.session.add_all([q1, q2])
        db.session.flush()
        db.session.add_all([
            Option(question_id=q1.id, text='def', is_correct=True),
            Option(question_id=q1.id, text='func', is_correct=False),
            Option(question_id=q2.id, text='list', is_correct=True),
            Option(question_id=q2.id, text='tuple', is_correct=False),
        ])
        db.session.commit()

    yield app


@pytest.fixture
def client(app):
    return app.test_client()
