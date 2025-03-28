from flask import Blueprint

rotate = Blueprint('rotate', __name__, url_prefix='/rotate')

from . import routes


