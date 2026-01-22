from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User, Track, Playlist, MoodTag
from sqlalchemy import func

web_bp = Blueprint('web', __name__)


@web_bp.route('/')
def index():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 12))
    playlists = Playlist.query.filter(Playlist.is_public == True).order_by(Playlist.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    moods = MoodTag.query.all()
    return render_template('index.html', playlists=playlists, moods=moods)


@web_bp.route('/mood/<mood_slug>')
def mood_page(mood_slug):
    mood = MoodTag.query.filter_by(name=mood_slug).first_or_404()
    # recommendations: popular, random, user's own
    popular = Playlist.query.join(Playlist.tracks).filter(Playlist.moods.any(name=mood_slug)).order_by(Playlist.likes_count.desc()).limit(5).all()
    randoms = Playlist.query.filter(Playlist.moods.any(name=mood_slug)).order_by(func.random()).limit(3).all()
    users_own = []
    if current_user.is_authenticated:
        users_own = Playlist.query.filter_by(user_id=current_user.id).filter(Playlist.moods.any(name=mood_slug)).limit(2).all()
    return render_template('mood.html', mood=mood, popular=popular, randoms=randoms, users_own=users_own)


@web_bp.route('/playlist/<int:playlist_id>')
def playlist_view(playlist_id):
    p = Playlist.query.get_or_404(playlist_id)
    return render_template('playlist.html', playlist=p)


@web_bp.route('/my/playlists')
@login_required
def my_playlists():
    playlists = Playlist.query.filter_by(user_id=current_user.id).order_by(Playlist.created_at.desc()).all()
    return render_template('my_playlists.html', playlists=playlists)


@web_bp.route('/search')
def search():
    q = request.args.get('q', '')
    mood = request.args.get('mood')
    tracks = []
    playlists = []
    if q:
        tracks = Track.query.filter((Track.title.ilike(f"%{q}%")) | (Track.artist.ilike(f"%{q}%"))).limit(50).all()
        playlists = Playlist.query.filter(Playlist.title.ilike(f"%{q}%")).limit(50).all()
    elif mood:
        # search by mood tag
        playlists = Playlist.query.filter(Playlist.moods.any(name=mood)).order_by(Playlist.created_at.desc()).limit(100).all()
    else:
        tracks = []
        playlists = []
    moods = MoodTag.query.all()
    return render_template('search.html', q=q, mood=mood, tracks=tracks, playlists=playlists, moods=moods)


@web_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        if User.query.filter((User.username == username) | (User.email == email)).first():
            flash('User exists')
            return redirect(url_for('web.register'))
        u = User(username=username, email=email)
        u.set_password(password)
        db.session.add(u)
        db.session.commit()
        login_user(u)
        return redirect(url_for('web.index'))
    return render_template('register.html')


@web_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        u = User.query.filter((User.username == username) | (User.email == username)).first()
        if u and u.check_password(password):
            login_user(u)
            return redirect(url_for('web.index'))
        flash('Invalid credentials')
        return redirect(url_for('web.login'))
    return render_template('login.html')


@web_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('web.index'))


@web_bp.route('/me')
@login_required
def profile():
    likes = [l.track for l in current_user.likes]
    playlists = current_user.playlists.order_by(Playlist.created_at.desc()).all()
    return render_template('me.html', likes=likes, playlists=playlists)
