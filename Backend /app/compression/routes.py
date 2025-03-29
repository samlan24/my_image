import base64
from flask import Flask, request, jsonify
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from . import compress

# Constants
ALLOWED_FORMATS = {"png", "jpg", "jpeg", "webp"}
SUBSAMPLING_MAP = {"0": 0, "1": 1, "2": 2}  # 4:4:4, 4:2:2, 4:2:0

def validate_file(file):
    """Validate filename and content"""
    filename = file.filename
    if not ('.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_FORMATS):
        raise ValueError("Invalid file format")

@compress.route('/', methods=['POST'])
def compress_image():
    try:
        # Validate input
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        validate_file(file)

        # Process with user options
        result = process_image(file, {
            "quality": int(request.form.get("quality", 30)),
            "lossless": request.form.get("lossless") == "true",
            "optimize": request.form.get("optimize") != "true",
            "progressive": request.form.get("progressive") == "false",
            "subsampling": request.form.get("subsampling", "1")
        })

        compressed_bytes = result["image_data"].getvalue()
        if not compressed_bytes:
            raise ValueError("Compressed image data is empty")

        return jsonify({
            "success": True,
            "original_size": result["original_size"],
            "compressed_size": result["compressed_size"],
            "preview": result["preview"],
            "download_url": f"data:image/{file.filename.rsplit('.', 1)[1].lower()};base64," +
                           base64.b64encode(compressed_bytes).decode('utf-8')
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def process_image(file, options):
    """Core compression logic"""
    try:
        # Open image directly from the stream
        img = Image.open(file.stream)
        original_format = img.format.lower()

        # Calculate file size by reading the entire stream
        file.stream.seek(0, 2)  # Move to the end of the stream
        original_size = file.stream.tell()  # Get the current position (size)
        file.stream.seek(0)  # Reset the stream position

        if options.get("dither") and original_format == "png":
            img = img.convert("P", palette=Image.Palette.ADAPTIVE, dither=Image.Dither.FLOYDSTEINBERG)

        # Ensure compatibility with JPEG format
        if original_format in ("jpg", "jpeg") and img.mode != "RGB":
            img = img.convert("RGB")

        # Compression parameters
        output_buffer = BytesIO()
        save_params = {
            "format": original_format,
            "optimize": options.get("optimize", True),
            "quality": options.get("quality", 30)
        }

        # Format-specific settings
        if original_format == "webp":
            save_params.update({
                "method": 6 if options.get("optimize") else 4,
                "lossless": options.get("lossless", False)
            })
        elif original_format in ("jpg", "jpeg"):
            save_params.update({
                "progressive": options.get("progressive", False),
                "subsampling": SUBSAMPLING_MAP.get(options.get("subsampling", "1"))
            })
        elif original_format == "png":
            save_params["compress_level"] = 9 if options.get("optimize") else 6

        # Save to buffer
        img.save(output_buffer, **save_params)
        compressed_size = output_buffer.tell()
        output_buffer.seek(0)

        # Generate preview
        preview = generate_preview(img)

        return {
            "image_data": output_buffer,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "preview": preview
        }

    except UnidentifiedImageError as e:
        raise ValueError("Cannot process this image. It might be corrupted or use an unsupported format.") from e
    except Exception as e:
        raise ValueError(f"Image processing failed: {e}") from e
def generate_preview(img):
    """Generate base64 preview thumbnail (max 300px)"""
    preview = img.copy()
    preview.thumbnail((300, 300))
    buffer = BytesIO()
    preview.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def validate_file(file):
    """Validate filename and content"""
    filename = file.filename
    if not ('.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_FORMATS):
        raise ValueError("Invalid file format")

#
