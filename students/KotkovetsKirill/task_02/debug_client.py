from app import create_app
app = create_app()
client = app.test_client()
r = client.post('/register', data={'username':'bob','email':'bob@example.com','password':'pw'}, follow_redirects=False)
print('status', r.status_code)
print('location', r.headers.get('Location'))
print('data start', r.data[:400])
