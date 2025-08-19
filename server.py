from flask import Flask, request, jsonify
from extract_boxscore import parse_boxscore
from update_gsheet import upload_to_sheet
import tempfile
import os

app = Flask(__name__)

@app.route("/scan", methods=["POST"])
def scan_pdf():
    file = request.files["file"]
    game_id = request.form.get("game_id", "GAME")
    
    # Save to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        file.save(tmp.name)
        stats = parse_boxscore(tmp.name, game_id)
        os.unlink(tmp.name)
    
    return jsonify(stats)

@app.route("/upload", methods=["POST"])
def upload_pdf():
    data = request.json
    upload_to_sheet(data)
    return jsonify({"status": "uploaded to Google Sheets"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
