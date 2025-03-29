from . import convert
from flask import Flask, request, send_file, jsonify
from PIL import Image, UnidentifiedImageError
import io

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

@convert.route("/", methods=["POST"])
def convert_image():
    # Check if file was uploaded
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    # Check if file has a filename
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Check file extension
    if not is_allowed_file(file.filename):
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_FORMATS)}"}), 400

    target_format = request.form.get("format", "").lower()

    # Validate target format
    if target_format not in ALLOWED_FORMATS:
        return jsonify({"error": f"Invalid format. Allowed: {', '.join(ALLOWED_FORMATS)}"}), 400

    try:
        # Open the image directly from the uploaded stream
        file.stream.seek(0)  # Ensure the stream is at the beginning
        image = Image.open(file.stream)

        # Handle format-specific conversions
        if image.mode in ("RGBA", "P") and target_format in ["jpg", "jpeg"]:
            image = image.convert("RGB")
        elif image.mode == "P" and target_format != "gif":
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")

        # Save the converted image to an in-memory buffer
        img_io = io.BytesIO()
        save_params = {
            "format": target_format,
            **QUALITY_PARAMS.get(target_format, {})
        }

        if target_format == "png":
            save_params.update({"optimize": True})

        image.save(img_io, **save_params)
        img_io.seek(0)

        # Return the converted image as a response
        return send_file(
            img_io,
            mimetype=f"image/{target_format}",
            as_attachment=True,
            download_name=f"converted.{target_format}"
        )

    except UnidentifiedImageError:
        return jsonify({"error": "Cannot identify image file"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
