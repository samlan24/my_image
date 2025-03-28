from flask import Blueprint

compress = Blueprint('compress', __name__, url_prefix='/compress')

from . import routes


