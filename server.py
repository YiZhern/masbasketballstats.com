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
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    # Save to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        file.save(tmp.name)
        pdf_path = tmp.name

    try:
        # Run your parser
        game_id = request.form.get("game_id", "UNKNOWN")
        stats = parse_boxscore(pdf_path, game_id)
        return jsonify({"game_id": game_id, "stats": stats})
    finally:
        os.remove(pdf_path)  # clean up temp file


