from flask import Blueprint

convert = Blueprint('convert', __name__, url_prefix='/convert')

from . import routes


