from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from extract_boxscore import parse_boxscore

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://yizhern.github.io"}})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/scan", methods=["POST"])
def scan():
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "No file uploaded"}), 400

        file = request.files["file"]
        game_id = request.form.get("game_id", "UNKNOWN")

        if file.filename == "":
            return jsonify({"status": "error", "message": "Empty filename"}), 400

        # Save uploaded PDF
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        # Run your parser
        stats = parse_boxscore(file_path, game_id)

        return jsonify({"status": "success", "game_id": game_id, "stats": stats})

    except Exception as e:
        import traceback
        return jsonify({
            "status": "error",
            "message": str(e),
            "trace": traceback.format_exc()
        }), 500
