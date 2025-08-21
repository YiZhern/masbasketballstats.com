from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from extract_boxscore import parse_boxscore
import tempfile

app = Flask(__name__)

@app.route("/")
CORS(app, resources={r"/*": {"origins": "https://yizhern.github.io"}})
def home():
    return "🏀 PDF Boxscore Scanner API is running!"

@app.route("/scan", methods=["POST"])
def scan_pdf():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        pdf_path = f"/tmp/{file.filename}"
        file.save(pdf_path)

        from extract_boxscore import parse_boxscore

        try:
            game_id = "TEST"
            stats = parse_boxscore(pdf_path, game_id)
        except Exception as e:
            logging.exception("Error parsing PDF")
            return jsonify({"error": "PDF parsing failed", "details": str(e)}), 500

        return jsonify({"status": "success", "stats": stats})

    except Exception as e:
        logging.exception("General error in /scan")
        return jsonify({"status": "error", "message": str(e)}), 500



