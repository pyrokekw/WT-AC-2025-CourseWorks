def test_mark_complete_ajax_and_course_mark(client):
    # login
    client.post('/login', data={'username': 'testuser', 'password': 'secret'}, follow_redirects=True)

    # mark lesson 1 via AJAX endpoint
    rv = client.post('/lessons/1/complete')
    assert rv.status_code == 200
    data = rv.get_json()
    assert data.get('completed') is True

    # course page should show Completed for lesson
    rv = client.get('/courses/1')
    assert b'Completed' in rv.data


def test_swagger_pages(client):
    rv = client.get('/openapi.json')
    assert rv.status_code == 200
    assert b'openapi' in rv.data

    rv = client.get('/swagger')
    assert rv.status_code == 200
    assert b'Swagger UI' in rv.data
