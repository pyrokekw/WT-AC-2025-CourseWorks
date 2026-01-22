def test_register_and_login(client):
    rv = client.post('/register', data={'username': 'bob', 'email': 'bob@example.com', 'password': 'pw'}, follow_redirects=True)
    assert b'Registered' in rv.data

    rv = client.post('/login', data={'username': 'bob', 'password': 'pw'}, follow_redirects=True)
    assert b'Logged in' in rv.data

    # logout
    rv = client.get('/logout', follow_redirects=True)
    assert b'Logged out' in rv.data
