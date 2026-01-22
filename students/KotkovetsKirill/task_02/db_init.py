from app import create_app
from app.extensions import db
from app.models import User, Course, Lesson

app = create_app()

with app.app_context():
    db.create_all()

    if not User.query.filter_by(username='alice').first():
        u = User(username='alice', email='alice@example.com')
        u.set_password('password')
        db.session.add(u)

    # sample courses and lessons
    if not Course.query.first():
        c1 = Course(title='Python Basics', description='Intro to Python')
        c2 = Course(title='Flask Mini‑courses', description='Build web apps')
        db.session.add_all([c1, c2])
        db.session.flush()
        l1 = Lesson(course_id=c1.id, title='Variables and Types', video_url='https://example.com/video1', content='Basics')
        l2 = Lesson(course_id=c1.id, title='Control Flow', video_url='https://example.com/video2', content='If, loops')
        l3 = Lesson(course_id=c2.id, title='Flask Setup', video_url='https://example.com/video3', content='App structure')
        db.session.add_all([l1, l2, l3])

        # add a test for Python Basics
        t = Test(course_id=c1.id, title='Python Basics Test', description='Short test for Python Basics')
        db.session.add(t)
        db.session.flush()
        q1 = Question(test_id=t.id, text='What is the keyword to define a function in Python?')
        q2 = Question(test_id=t.id, text='Which of these is a mutable built-in type?')
        db.session.add_all([q1, q2])
        db.session.flush()
        o11 = Option(question_id=q1.id, text='func', is_correct=False)
        o12 = Option(question_id=q1.id, text='def', is_correct=True)
        o13 = Option(question_id=q1.id, text='function', is_correct=False)
        o21 = Option(question_id=q2.id, text='tuple', is_correct=False)
        o22 = Option(question_id=q2.id, text='list', is_correct=True)
        o23 = Option(question_id=q2.id, text='str', is_correct=False)
        db.session.add_all([o11, o12, o13, o21, o22, o23])

    db.session.commit()
    print('Database initialized and seeded')
