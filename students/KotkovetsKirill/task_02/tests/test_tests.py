def test_take_test_flow(client):
    # login as test user
    client.post('/login', data={'username': 'testuser', 'password': 'secret'}, follow_redirects=True)

    # get course tests
    rv = client.get('/courses/1/tests')
    assert b'Sample Test' in rv.data

    # view the test
    rv = client.get('/tests/1')
    assert b'Which keyword defines a function' in rv.data

    # submit with correct answers (option ids are seeded in conftest)
    from app.models import Question, Option
    q1 = Question.query.filter(Question.text.like('%defines a function%')).first()
    q2 = Question.query.filter(Question.text.like('%Which is mutable%')).first()
    o1 = Option.query.filter_by(question_id=q1.id, is_correct=True).first()
    o2 = Option.query.filter_by(question_id=q2.id, is_correct=True).first()

    data = {f'q_{q1.id}': str(o1.id), f'q_{q2.id}': str(o2.id)}
    rv = client.post('/tests/1', data=data, follow_redirects=True)
    assert b'Your score' in rv.data
    assert b'2 / 2' in rv.data
