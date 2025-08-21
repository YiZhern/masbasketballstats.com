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
        logging.info(f"Received file: {file.filename}")

        # Save to a temporary file
        pdf_path = f"/tmp/{file.filename}"
        file.save(pdf_path)

         # Call your existing parse_boxscore
        from extract_boxscore import parse_boxscore
        game_id = "TEST"  # you can extract real ID later
        stats = parse_boxscore(pdf_path, game_id)

        return jsonify({"status": "success", "stats": stats})
        
    except Exception as e:
        logging.exception("Error in /scan")
        return jsonify({"status": "error", "message": str(e)}), 500


