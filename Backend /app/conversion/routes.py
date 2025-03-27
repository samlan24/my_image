from . import convert
from flask import Flask, request, send_file
from PIL import Image
import io

ALLOWED_FORMATS = {"png", "jpg", "jpeg", "webp", "gif"}
QUALITY_PARAMS = {
    "jpg": {"quality": 95, "subsampling": 0},
    "jpeg": {"quality": 95, "subsampling": 0},
    "webp": {"quality": 100, "method": 6},
    "png": {"compress_level": 6},
    "gif": {}
}

@convert.route("/", methods=["POST"])
def convert_image():
    if "file" not in request.files:
        return {"error": "No file uploaded"}, 400

    file = request.files["file"]
    target_format = request.form.get("format", "").lower()

    if target_format not in ALLOWED_FORMATS:
        return {"error": f"Invalid format. Allowed: {', '.join(ALLOWED_FORMATS)}"}, 400

    try:

        image = Image.open(file.stream)


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
            save_params.update({
                "optimize": True
            })

        image.save(img_io, **save_params)
        img_io.seek(0)

        return send_file(img_io, mimetype=f"image/{target_format}")

    except Exception as e:
        return {"error": str(e)}, 500

