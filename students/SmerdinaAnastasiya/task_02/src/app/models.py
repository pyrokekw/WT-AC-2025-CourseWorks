from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from sqlalchemy.ext.associationproxy import association_proxy
from app import db, login_manager


playlist_mood = db.Table(
    'playlist_mood',
    db.Column('playlist_id', db.Integer, db.ForeignKey('playlist.id'), primary_key=True),
    db.Column('moodtag_id', db.Integer, db.ForeignKey('mood_tag.id'), primary_key=True),
)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    playlists = db.relationship('Playlist', backref='owner', lazy='dynamic')
    likes = db.relationship('Like', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Track(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    album = db.Column(db.String(200))
    duration_sec = db.Column(db.Integer)
    spotify_id = db.Column(db.String(100))
    youtube_id = db.Column(db.String(100))
    cover_url = db.Column(db.String(300))
    likes = db.relationship('Like', backref='track', lazy='dynamic')
    playlists = db.relationship('PlaylistTrack', back_populates='track')


class MoodTag(db.Model):
    __tablename__ = 'mood_tag'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    playlists = db.relationship('Playlist', secondary=playlist_mood, back_populates='moods')


class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cover_url = db.Column(db.String(300))
    likes_count = db.Column(db.Integer, default=0)

    tracks = db.relationship('PlaylistTrack', back_populates='playlist', cascade='all, delete-orphan', order_by='PlaylistTrack.position')
    moods = db.relationship('MoodTag', secondary=playlist_mood, back_populates='playlists')
    collaborators = db.relationship('PlaylistCollaborator', back_populates='playlist', cascade='all, delete-orphan')


class PlaylistTrack(db.Model):
    __tablename__ = 'playlist_track'
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlist.id'), primary_key=True)
    track_id = db.Column(db.Integer, db.ForeignKey('track.id'), primary_key=True)
    position = db.Column(db.Integer, nullable=False, default=0)
    added_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    playlist = db.relationship('Playlist', back_populates='tracks')
    track = db.relationship('Track', back_populates='playlists')
    added_by = db.relationship('User')


class Like(db.Model):
    __tablename__ = 'like'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    track_id = db.Column(db.Integer, db.ForeignKey('track.id'), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PlaylistCollaborator(db.Model):
    __tablename__ = 'playlist_collaborator'
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlist.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    role = db.Column(db.String(16), nullable=False, default='viewer')
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    playlist = db.relationship('Playlist', back_populates='collaborators')
    user = db.relationship('User')


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
