from app import create_app, db
from app.models import MoodTag, Track, User, Playlist, PlaylistTrack, Like


def run_seed():
    app = create_app()
    with app.app_context():
        print('Creating database tables...')
        db.create_all()

        # Moods
        mood_names = ['happy', 'sad', 'energetic', 'chill', 'focus', 'party', 'romantic', 'angry']
        moods = []
        for name in mood_names:
            m = MoodTag.query.filter_by(name=name).first()
            if not m:
                m = MoodTag(name=name)
                db.session.add(m)
            moods.append(m)

        # Sample tracks
        sample_tracks = [
            {'title': 'Sunny Day', 'artist': 'The Brights', 'album': 'Sunshine', 'duration_sec': 180},
            {'title': 'Midnight Blue', 'artist': 'Night Owls', 'album': 'After Hours', 'duration_sec': 210},
            {'title': 'Focus Mode', 'artist': 'LoFi Beats', 'album': 'Concentration', 'duration_sec': 240},
            {'title': 'Dancefloor', 'artist': 'Club Mix', 'album': 'Party Time', 'duration_sec': 200},
        ]
        tracks = []
        for s in sample_tracks:
            t = Track.query.filter_by(title=s['title'], artist=s['artist']).first()
            if not t:
                t = Track(title=s['title'], artist=s['artist'], album=s.get('album'), duration_sec=s.get('duration_sec'))
                db.session.add(t)
            tracks.append(t)

        # Demo user
        demo = User.query.filter_by(username='demo').first()
        if not demo:
            demo = User(username='demo', email='demo@example.com')
            demo.set_password('demo')
            db.session.add(demo)

        db.session.commit()

        # Demo playlists (multiple)
        demo_playlists = [
            {'title': 'Chill Vibes', 'desc': 'Relax and unwind', 'moods': ['chill']},
            {'title': 'Party Hits', 'desc': 'Upbeat tracks to get you moving', 'moods': ['party', 'energetic']},
            {'title': 'Focus Flow', 'desc': 'Instrumental and lo-fi for concentration', 'moods': ['focus']},
            {'title': 'Romantic Evenings', 'desc': 'Soft songs for two', 'moods': ['romantic', 'chill']},
            {'title': 'Morning Energy', 'desc': 'Start your day right', 'moods': ['energetic', 'happy']},
            {'title': 'Sad Piano', 'desc': 'Melancholic piano pieces', 'moods': ['sad']},
            {'title': 'Late Night Drive', 'desc': 'Moody beats for the road', 'moods': ['chill', 'focus']},
            {'title': 'Study Beats', 'desc': 'Background beats for studying', 'moods': ['focus', 'chill']},
        ]

        for pl_data in demo_playlists:
            p = Playlist.query.filter_by(title=pl_data['title']).first()
            if not p:
                p = Playlist(title=pl_data['title'], description=pl_data.get('desc'), user_id=demo.id, is_public=True)
                p.cover_url = ''
                # attach moods
                for mn in pl_data.get('moods', []):
                    mtag = MoodTag.query.filter_by(name=mn).first()
                    if mtag:
                        p.moods.append(mtag)
                db.session.add(p)
                db.session.commit()
                # add a few tracks (cycle through existing sample tracks)
                for idx, t in enumerate(tracks[:4]):
                    pt = PlaylistTrack(playlist_id=p.id, track_id=t.id, position=idx)
                    db.session.add(pt)
        db.session.commit()

        # Like first track by demo (if exists)
        first_track = Track.query.first()
        if first_track and not Like.query.get((demo.id, first_track.id)):
            l = Like(user_id=demo.id, track_id=first_track.id)
            db.session.add(l)
        db.session.commit()

        print('Seeding complete: moods={}, tracks={}, playlists={}, user=demo'.format(len(mood_names), len(tracks), len(demo_playlists)))


if __name__ == '__main__':
    run_seed()
