from flask import Flask, request, send_file, jsonify
from PIL import Image
import io
import math
from . import resize

PRESETS = {
    'instagram_post': (1080, 1080),
    'instagram_story': (1080, 1920),
    'twitter_post': (1600, 900),
    'linkedin_post': (1200, 627),
    'facebook_post': (1200, 630),
    'youtube_thumbnail': (1280, 720)
}

def resize_with_aspect_ratio(img, target_width, target_height):
    original_width, original_height = img.size
    ratio = min(target_width/original_width, target_height/original_height)

    new_width = int(original_width * ratio)
    new_height = int(original_height * ratio)

    # Resize with high-quality downsampling
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Create a new image with target dimensions and paste the resized image
    new_img = Image.new("RGB", (target_width, target_height), (255, 255, 255))
    new_img.paste(img, ((target_width - new_width) // 2, (target_height - new_height) // 2))

    return new_img

@resize.route('/', methods=['POST'])
def resize_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Get target dimensions
        if 'preset' in request.form and request.form['preset'] in PRESETS:
            width, height = PRESETS[request.form['preset']]
        else:
            width = int(request.form.get('width', 0))
            height = int(request.form.get('height', 0))
            if width <= 0 or height <= 0:
                return jsonify({'error': 'Invalid dimensions'}), 400

        # Open and resize image
        img = Image.open(file.stream)
        img = resize_with_aspect_ratio(img, width, height)

        # Save to memory
        img_io = io.BytesIO()
        img_format = 'JPEG' if file.filename.lower().endswith(('jpg', 'jpeg')) else 'PNG'
        img.save(img_io, format=img_format, quality=95)
        img_io.seek(0)

        return send_file(
            img_io,
            mimetype=f'image/{img_format.lower()}',
            as_attachment=True,
            download_name=f'resized.{img_format.lower()}'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500
