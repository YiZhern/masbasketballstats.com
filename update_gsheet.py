import gspread
from oauth2client.service_account import ServiceAccountCredentials

def upload_to_sheet(data, sheet_name="Championship Stats"):
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name("credentials/service-account.json", scope)
    client = gspread.authorize(creds)
    sheet = client.open(sheet_name).sheet1

    # Clear old content before uploading new table
    sheet.clear()

    # Add headers + Manual Fix column
    headers = [
        "GameID", "No", "Name", "Min", "FG M/A", "FG %", 
        "2P M/A", "2P %", "3P M/A", "3P %", "FT M/A", "FT %", 
        "OR", "DR", "TOT", "AS", "TO", "ST", "BS", "PF", 
        "FD", "+/-", "EF", "PTS", "Needs Manual Fix?"
    ]

    # Build upload block
    upload_data = [headers]
    for row in data:
        needs_fix = "YES" if any(str(cell) == "!!!" for cell in row) else "NO"
        upload_data.append(row + [needs_fix])

    # Write everything at once (fast + table-like)
    sheet.update("A1", upload_data)
