from . import convert
from flask import Flask, request, send_file
from PIL import Image, UnidentifiedImageError
import io
import imghdr

ALLOWED_FORMATS = {"png", "jpg", "jpeg", "webp", "gif"}
QUALITY_PARAMS = {
    "jpg": {"quality": 95, "subsampling": 0},
    "jpeg": {"quality": 95, "subsampling": 0},
    "webp": {"quality": 100, "method": 6},
    "png": {"compress_level": 6},
    "gif": {}
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

@convert.route("/", methods=["POST"])
def convert_image():
    # Check if file was uploaded
    if "file" not in request.files:
        return {"error": "No file uploaded"}, 400

    file = request.files["file"]

    # Check if file has a filename
    if file.filename == '':
        return {"error": "No selected file"}, 400

    # Check file extension
    if not is_allowed_file(file.filename):
        return {"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_FORMATS)}"}, 400

    # Verify the file is actually an image
    if not is_valid_image(file.stream):
        return {"error": "Uploaded file is not a valid image"}, 400

    target_format = request.form.get("format", "").lower()

    if target_format not in ALLOWED_FORMATS:
        return {"error": f"Invalid format. Allowed: {', '.join(ALLOWED_FORMATS)}"}, 400

    try:
        # Verify the image can be opened by PIL
        file.stream.seek(0)
        image = Image.open(file.stream)

        # Verify the image is valid by attempting to load it
        image.verify()

        # Reopen the image since verify() closes it
        file.stream.seek(0)
        image = Image.open(file.stream)

        # Handle format-specific conversions
        if image.mode in ("RGBA", "P") and target_format in ["jpg", "jpeg"]:
            image = image.convert("RGB")
        elif image.mode == "P" and target_format != "gif":
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")

        img_io = io.BytesIO()
        save_params = {
            "format": target_format,
            **QUALITY_PARAMS.get(target_format, {})
        }

        if target_format == "png":
            save_params.update({"optimize": True})

        image.save(img_io, **save_params)
        img_io.seek(0)

        return send_file(img_io, mimetype=f"image/{target_format}")

    except UnidentifiedImageError:
        return {"error": "Cannot identify image file"}, 400
    except Exception as e:
        return {"error": str(e)}, 500