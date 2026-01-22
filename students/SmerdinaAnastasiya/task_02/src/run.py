from app import create_app, db
from app.models import User, Track, Playlist, MoodTag

app = create_app()


@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Track': Track, 'Playlist': Playlist, 'MoodTag': MoodTag}

if __name__ == '__main__':
    app.run(debug=True)
