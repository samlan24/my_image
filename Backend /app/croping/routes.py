from . import crop
from flask import Flask, request, send_file
from PIL import Image, UnidentifiedImageError
import io
import imghdr

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
    return format is not None

@crop.route("/", methods=["POST"])
def crop_image():

    if "file" not in request.files:
        return {"error": "No file uploaded"}, 400

    file = request.files["file"]
    if file.filename == '':
        return {"error": "No selected file"}, 400

    if not is_allowed_file(file.filename):
        return {"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_FORMATS)}"}, 400

    if not is_valid_image(file.stream):
        return {"error": "Uploaded file is not a valid image"}, 400

    try:

        crop_data = request.form.get("crop", "")
        if not crop_data:
            return {"error": "No crop data provided"}, 400


        try:
            x, y, w, h = map(float, crop_data.split(','))
        except ValueError:
            return {"error": "Invalid crop format. Expected x,y,width,height"}, 400


        file.stream.seek(0)
        image = Image.open(file.stream)
        image.verify()
        file.stream.seek(0)
        image = Image.open(file.stream)


        cropped_image = image.crop((x, y, x + w, y + h))


        img_io = io.BytesIO()
        format = file.filename.rsplit('.', 1)[1].lower()
        if format == 'jpg':
            format = 'jpeg'

        save_params = {
            "format": format,
            **QUALITY_PARAMS.get(format, {})
        }

        if format == "png":
            save_params.update({"optimize": True})

        cropped_image.save(img_io, **save_params)
        img_io.seek(0)

        return send_file(img_io, mimetype=f"image/{format}")

    except UnidentifiedImageError:
        return {"error": "Cannot identify image file"}, 400
    except Exception as e:
        return {"error": str(e)}, 500