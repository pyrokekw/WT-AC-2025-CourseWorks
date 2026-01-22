from app.models import User, MoodTag, Playlist
from app import db


def test_user_password_hashing(app):
    u = User(username='testuser', email='t@example.com')
    u.set_password('secret')
    assert u.check_password('secret')
    assert not u.check_password('wrong')


def test_playlist_mood_relation(app):
    m = MoodTag(name='happy')
    p = Playlist(title='My Playlist')
    p.moods.append(m)
    db.session.add_all([m, p])
    db.session.commit()
    assert m in p.moods
