from flask import Blueprint

resize = Blueprint('resize', __name__, url_prefix='/resize')

from . import routes


