from flask import Flask
from .config import Config
from .extensions import db


def create_app():
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(Config)

    db.init_app(app)

    # register blueprints
    from .routes import bp as main_bp
    from .auth import bp as auth_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)

    return app
