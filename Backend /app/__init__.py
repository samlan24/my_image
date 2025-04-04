from flask import Flask
from flask_cors import CORS
from flask_session import Session


def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)


    #registering blueprints
    from .conversion import convert
    app.register_blueprint(convert)
    from .croping import crop
    app.register_blueprint(crop)
    from .rotating import rotate
    app.register_blueprint(rotate)
    from .resizing import resize
    app.register_blueprint(resize)

    return app