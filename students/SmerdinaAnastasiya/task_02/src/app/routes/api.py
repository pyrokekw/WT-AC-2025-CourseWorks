from flask import Blueprint, jsonify, request, current_app, abort
from flask_login import current_user, login_required
from app import db
from app.models import Track, MoodTag, Playlist, PlaylistTrack, Like, PlaylistCollaborator, User

api_bp = Blueprint('api', __name__)


def paginate_query(query):
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', current_app.config.get('PER_PAGE', 12)))
    items = query.paginate(page=page, per_page=per_page, error_out=False)
    return items


@api_bp.route('/tracks')
def get_tracks():
    q = Track.query
    items = paginate_query(q)
    data = {
        'items': [
            {'id': t.id, 'title': t.title, 'artist': t.artist, 'cover_url': t.cover_url} for t in items.items
        ],
        'page': items.page,
        'pages': items.pages,
        'total': items.total,
    }
    return jsonify(data)


@api_bp.route('/tracks/<int:track_id>')
def get_track(track_id):
    t = Track.query.get_or_404(track_id)
    return jsonify({'id': t.id, 'title': t.title, 'artist': t.artist, 'album': t.album, 'duration_sec': t.duration_sec, 'cover_url': t.cover_url})


@api_bp.route('/tracks/search')
def search_tracks():
    q = request.args.get('q', '')
    base = Track.query.filter((Track.title.ilike(f"%{q}%")) | (Track.artist.ilike(f"%{q}%")))
    items = paginate_query(base)
    return jsonify({'items': [{'id': t.id, 'title': t.title, 'artist': t.artist} for t in items.items], 'page': items.page, 'pages': items.pages})


@api_bp.route('/moods')
def get_moods():
    moods = MoodTag.query.all()
    return jsonify([{'id': m.id, 'name': m.name} for m in moods])


@api_bp.route('/playlists')
def get_playlists():
    mood = request.args.get('mood')
    q = Playlist.query.filter((Playlist.is_public == True) | (Playlist.user_id == current_user.get_id() if current_user.is_authenticated else False))
    if mood:
        mood_names = [m.strip() for m in mood.split(',')]
        q = q.join(Playlist.moods).filter(MoodTag.name.in_(mood_names))
    items = paginate_query(q.order_by(Playlist.created_at.desc()))
    return jsonify({'items': [{'id': p.id, 'title': p.title, 'description': p.description, 'cover_url': p.cover_url} for p in items.items], 'page': items.page, 'pages': items.pages})


@api_bp.route('/playlists/<int:playlist_id>')
def get_playlist(playlist_id):
    p = Playlist.query.get_or_404(playlist_id)
    tracks = [{'id': pt.track.id, 'title': pt.track.title, 'artist': pt.track.artist, 'position': pt.position} for pt in p.tracks]
    return jsonify({'id': p.id, 'title': p.title, 'description': p.description, 'tracks': tracks, 'cover_url': p.cover_url})


def user_can_edit(playlist, user):
    if not user or not user.is_authenticated:
        return False
    # owner
    if playlist.user_id == user.id:
        return True
    collab = PlaylistCollaborator.query.get((playlist.id, user.id))
    if collab and collab.role in ('owner', 'editor'):
        return True
    return False


@api_bp.route('/playlists', methods=['POST'])
@login_required
def create_playlist():
    # Accept JSON or form-encoded data (modal form posts)
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    title = data.get('title')
    if not title:
        return jsonify({'error': 'title required'}), 400
    # is_public may come as string from form
    is_public = data.get('is_public')
    if isinstance(is_public, str):
        is_public = is_public.lower() in ('1', 'true', 'yes', 'on')
    elif is_public is None:
        is_public = True

    p = Playlist(title=title, description=data.get('description'), user_id=current_user.id, is_public=is_public, cover_url=data.get('cover_url'))
    db.session.add(p)
    db.session.commit()
    return jsonify({'id': p.id, 'title': p.title}), 201


@api_bp.route('/playlists/<int:playlist_id>', methods=['PATCH'])
@login_required
def edit_playlist(playlist_id):
    p = Playlist.query.get_or_404(playlist_id)
    if p.user_id != current_user.id:
        return abort(403)
    data = request.json or {}
    for k in ('title', 'description', 'is_public', 'cover_url'):
        if k in data:
            setattr(p, k, data[k])
    db.session.commit()
    return jsonify({'id': p.id, 'title': p.title})


@api_bp.route('/playlists/<int:playlist_id>', methods=['DELETE'])
@login_required
def delete_playlist(playlist_id):
    p = Playlist.query.get_or_404(playlist_id)
    if p.user_id != current_user.id:
        return abort(403)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@api_bp.route('/playlists/<int:playlist_id>/tracks', methods=['POST'])
@login_required
def add_track_to_playlist(playlist_id):
    p = Playlist.query.get_or_404(playlist_id)
    if not user_can_edit(p, current_user):
        return abort(403)
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    track_id = data.get('track_id')
    # support import by url from modal: if url provided, create track
    url = data.get('url')
    if (not track_id or str(track_id).lower() in ('null','none','')) and url:
        t = create_track_from_url(url)
        track_id = t.id
    if not track_id:
        return jsonify({'error': 'track_id required'}), 400
    pos = (max([pt.position for pt in p.tracks]) + 1) if p.tracks else 0
    pt = PlaylistTrack(playlist_id=playlist_id, track_id=track_id, position=pos, added_by_user_id=current_user.id)
    db.session.add(pt)
    db.session.commit()
    return jsonify({'status': 'added'})


@api_bp.route('/playlists/<int:playlist_id>/tracks/<int:track_id>', methods=['DELETE'])
@login_required
def remove_track_from_playlist(playlist_id, track_id):
    p = Playlist.query.get_or_404(playlist_id)
    if not user_can_edit(p, current_user):
        return abort(403)
    pt = PlaylistTrack.query.get((playlist_id, track_id))
    if not pt:
        return abort(404)
    db.session.delete(pt)
    db.session.commit()
    return jsonify({'status': 'removed'})


@api_bp.route('/playlists/<int:playlist_id>/tracks/order', methods=['PATCH'])
@login_required
def reorder_playlist_tracks(playlist_id):
    p = Playlist.query.get_or_404(playlist_id)
    if not user_can_edit(p, current_user):
        return abort(403)
    data = request.get_json() or {}
    order = data.get('order')
    if not isinstance(order, list):
        return jsonify({'error': 'order must be list of track_ids'}), 400
    # order is list of track_ids in new order
    for idx, tid in enumerate(order):
        pt = PlaylistTrack.query.filter_by(playlist_id=playlist_id, track_id=tid).first()
        if pt:
            pt.position = idx
    db.session.commit()
    return jsonify({'status': 'reordered'})


@api_bp.route('/playlists/<int:playlist_id>/collaborators')
def list_collaborators(playlist_id):
    p = Playlist.query.get_or_404(playlist_id)
    items = []
    for c in p.collaborators:
        items.append({'user_id': c.user_id, 'username': c.user.username if c.user else None, 'role': c.role, 'added_at': c.added_at.isoformat()})
    return jsonify(items)


@api_bp.route('/playlists/<int:playlist_id>/collaborators', methods=['POST'])
@login_required
def add_collaborator(playlist_id):
    p = Playlist.query.get_or_404(playlist_id)
    # only owner can add
    if p.user_id != current_user.id:
        return abort(403)
    data = request.get_json() or request.form.to_dict()
    username = data.get('username')
    role = data.get('role', 'viewer')
    if not username:
        return jsonify({'error': 'username required'}), 400
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'user not found'}), 404
    # prevent adding owner as collaborator
    if user.id == p.user_id:
        return jsonify({'error': 'user is owner'}), 400
    existing = PlaylistCollaborator.query.get((playlist_id, user.id))
    if existing:
        existing.role = role
    else:
        pc = PlaylistCollaborator(playlist_id=playlist_id, user_id=user.id, role=role)
        db.session.add(pc)
    db.session.commit()
    return jsonify({'status': 'added', 'username': username, 'role': role})


@api_bp.route('/playlists/<int:playlist_id>/collaborators/<int:user_id>', methods=['DELETE'])
@login_required
def remove_collaborator(playlist_id, user_id):
    p = Playlist.query.get_or_404(playlist_id)
    if p.user_id != current_user.id:
        return abort(403)
    pc = PlaylistCollaborator.query.get((playlist_id, user_id))
    if not pc:
        return abort(404)
    db.session.delete(pc)
    db.session.commit()
    return jsonify({'status': 'removed'})


@api_bp.route('/me/likes')
@login_required
def my_likes():
    likes = Like.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'track_id': l.track_id, 'created_at': l.created_at.isoformat()} for l in likes])


@api_bp.route('/tracks/<int:track_id>/like', methods=['POST'])
@login_required
def like_track(track_id):
    t = Track.query.get_or_404(track_id)
    if Like.query.get((current_user.id, track_id)):
        return jsonify({'status': 'already'})
    l = Like(user_id=current_user.id, track_id=track_id)
    db.session.add(l)
    # update likes_count on playlists that contain this track
    pls = Playlist.query.join(Playlist.tracks).filter(PlaylistTrack.track_id == track_id).all()
    for p in pls:
        p.likes_count = (p.likes_count or 0) + 1
    db.session.commit()
    return jsonify({'status': 'liked'})


@api_bp.route('/tracks/<int:track_id>/like', methods=['DELETE'])
@login_required
def unlike_track(track_id):
    l = Like.query.get((current_user.id, track_id))
    if not l:
        return abort(404)
    # decrement likes_count on playlists that contain this track
    pls = Playlist.query.join(Playlist.tracks).filter(PlaylistTrack.track_id == track_id).all()
    for p in pls:
        p.likes_count = max((p.likes_count or 0) - 1, 0)
    db.session.delete(l)
    db.session.commit()
    return jsonify({'status': 'unliked'})



@api_bp.route('/tracks/import', methods=['POST'])
@login_required
def import_track():
    data = request.get_json() or {}
    url = data.get('url')
    if not url:
        return jsonify({'error': 'url required'}), 400
    # simple mock detection
    domain = None
    if 'spotify.com' in url:
        domain = 'spotify'
    elif 'youtube.com' in url or 'youtu.be' in url:
        domain = 'youtube'
    elif 'soundcloud.com' in url:
        domain = 'soundcloud'
    elif 'deezer.com' in url:
        domain = 'deezer'
    else:
        domain = 'generic'

    # create or mock a track object (not saved yet)
    mock = {
        'title': f"Imported track from {domain}",
        'artist': f"Unknown ({domain})",
        'album': None,
        'duration_sec': 200,
        'spotify_id': url if domain == 'spotify' else None,
        'youtube_id': url if domain == 'youtube' else None,
        'cover_url': None,
    }
    return jsonify({'track': mock, 'source': domain})


def create_track_from_url(url):
    # Create a Track from a URL (simple mock saver)
    domain = 'generic'
    if 'spotify.com' in url:
        domain = 'spotify'
    elif 'youtube.com' in url or 'youtu.be' in url:
        domain = 'youtube'
    elif 'soundcloud.com' in url:
        domain = 'soundcloud'
    elif 'deezer.com' in url:
        domain = 'deezer'

    title = f"Imported track from {domain}"
    artist = f"Unknown ({domain})"
    t = Track(title=title, artist=artist)
    if domain == 'spotify':
        t.spotify_id = url
    if domain == 'youtube':
        t.youtube_id = url
    t.cover_url = None
    db.session.add(t)
    db.session.commit()
    return t
