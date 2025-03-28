from flask import Flask, request, send_file, jsonify
from PIL import Image, UnidentifiedImageError
import io
import imghdr
import os
from . import rotate

ALLOWED_FORMATS = {"png", "jpg", "jpeg", "webp"}
QUALITY_PARAMS = {
    "jpg": {"quality": 95, "subsampling": 0},
    "jpeg": {"quality": 95, "subsampling": 0},
    "webp": {"quality": 100, "method": 6},
    "png": {"compress_level": 6},
}


def is_allowed_file(filename):
    """Check if the file has an allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_FORMATS

def is_valid_image(stream):
    """Verify that the file is actually an image"""
    header = stream.read(1024)
    stream.seek(0)
    format = imghdr.what(None, header)
    return format is not None and format.lower() in ALLOWED_FORMATS

@rotate.route('/', methods=['POST'])
def rotate_img():
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    # Check if file has a name
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Check if file is allowed
    if not is_allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    # Verify the file is actually an image
    if not is_valid_image(file.stream):
        return jsonify({'error': 'Invalid image file'}), 400

    # Get rotation angle
    try:
        angle = int(request.form.get('angle', 0))
    except ValueError:
        return jsonify({'error': 'Invalid rotation angle'}), 400

    try:
        # Open the image
        file.stream.seek(0)
        img = Image.open(file.stream)

        # Rotate the image
        rotated_img = img.rotate(-angle, expand=True)

        # Determine output format
        output_format = img.format if img.format in ALLOWED_FORMATS else 'png'
        if output_format.lower() == 'jpg':
            output_format = 'jpeg'  # Pillow uses 'jpeg' not 'jpg'

        # Save to memory buffer
        buffer = io.BytesIO()
        rotated_img.save(buffer, format=output_format, **QUALITY_PARAMS.get(output_format.lower(), {}))
        buffer.seek(0)

        # Prepare response
        mimetype = f'image/{output_format.lower()}'
        filename = f'rotated_{angle}_{file.filename.rsplit(".", 1)[0]}.{output_format.lower()}'

        return send_file(
            buffer,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )

    except UnidentifiedImageError:
        return jsonify({'error': 'Invalid image file'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rotate.route('/preview', methods=['POST'])
def preview_img():
    """Endpoint for preview with lower quality"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not is_allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    if not is_valid_image(file.stream):
        return jsonify({'error': 'Invalid image file'}), 400

    try:
        angle = int(request.form.get('angle', 0))
    except ValueError:
        return jsonify({'error': 'Invalid rotation angle'}), 400

    try:
        file.stream.seek(0)
        img = Image.open(file.stream)
        rotated_img = img.rotate(-angle, expand=True)

        # Lower quality for preview
        buffer = io.BytesIO()
        rotated_img.save(buffer, format='jpeg', quality=70)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype='image/jpeg'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

