from app import db
from app.models import MoodTag, Track


def test_get_moods(client):
    with client.application.app_context():
        db.session.add(MoodTag(name='chill'))
        db.session.commit()
    rv = client.get('/api/moods')
    assert rv.status_code == 200
    data = rv.get_json()
    assert any(m['name'] == 'chill' for m in data)


def test_tracks_pagination(client):
    with client.application.app_context():
        for i in range(15):
            db.session.add(Track(title=f'T{i}', artist='Artist'))
        db.session.commit()
    rv = client.get('/api/tracks')
    assert rv.status_code == 200
    data = rv.get_json()
    assert 'items' in data and isinstance(data['items'], list)
    assert data['total'] >= 15


def test_create_playlist_via_api(client):
    # register and login via web routes
    rv = client.post('/register', data={'username':'u1','email':'u1@example.com','password':'pass'}, follow_redirects=True)
    assert rv.status_code == 200
    rv = client.post('/api/playlists', json={'title':'My List'})
    assert rv.status_code == 201
    data = rv.get_json()
    assert data.get('title') == 'My List'
