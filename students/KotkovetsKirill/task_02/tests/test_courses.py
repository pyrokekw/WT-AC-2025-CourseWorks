def test_courses_list_and_lesson_view(client):
    rv = client.get('/')
    assert b'Test Course' in rv.data

    # lesson page
    rv = client.get('/lessons/1')
    assert b'L1' in rv.data
    # comment requires login
    rv = client.post('/lessons/1/comment', data={'content': 'Hi'}, follow_redirects=True)
    assert b'Login required' in rv.data
