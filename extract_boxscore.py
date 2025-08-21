import pytesseract
import re
from pdf2image import convert_from_path
import fitz
from PIL import Image
import cv2
import numpy as np
from tabulate import tabulate
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # set to DEBUG for more detail
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("boxscore_debug.log"),
        logging.StreamHandler()
    ]
)

# Debug folder for visualization
DEBUG_DIR = "debug_outputs"
os.makedirs(DEBUG_DIR, exist_ok=True)

# Path to Tesseract (Windows example)
pytesseract.pytesseract.tesseract_cmd = r"C:\YZ\tesseract.exe"

# Column headers
HEADERS = [
    "GameID", "No"    , "Name", "Min"   , "FG M/A", 
    "FG %"  , "2P M/A", "2P %", "3P M/A", "3P %"  , 
    "FT M/A", "FT %"  , "OR"  , "DR"    , "TOT"   , 
    "AS"    , "TO"    , "ST"  , "BS"    , "PF"    , 
    "FD"    , "+/-"   , "EF"  , "PTS"
]

# Regex patterns for each column (except GameID)
PATTERNS = [
    r"^(\*\d{1,2}|\d{1,2})$",              # No (allow *)
    r"^[A-Za-z\s\(\)\-\'\.éÉáÁíÍóÓúÚçÇ]+$",# Name
    r"^(\d{1,2}:\d{2}|DNP)$",              # Min
    r"^\d{1,2}/\d{1,2}$",                  # FG M/A
    r"^\d{1,4}$",                          # FG %
    r"^\d{1,2}/\d{1,2}$",                  # 2P M/A
    r"^\d{1,4}$",                          # 2P %
    r"^\d{1,2}/\d{1,2}$",                  # 3P M/A
    r"^\d{1,4}$",                          # 3P %
    r"^\d{1,2}/\d{1,2}$",                  # FT M/A
    r"^\d{1,4}$",                          # FT %
    r"^\d{1,2}$",                          # OR
    r"^\d{1,2}$",                          # DR
    r"^\d{1,2}$",                          # TOT
    r"^\d{1,2}$",                          # AS
    r"^\d{1,2}$",                          # TO
    r"^\d{1,2}$",                          # ST
    r"^\d{1,2}$",                          # BS
    r"^\d{1,2}$",                          # PF (fixed to allow 2 digits)
    r"^\d{1,2}$",                          # FD
    r"^-?\d{1,2}$",                        # +/-
    r"^-?\d{1,2}$",                        # EF
    r"^\d{1,2}$"                           # PTS
]

# Column-specific whitelists
COL_WHITELISTS = {
    "No": "0123456789*",
    "Name": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .-'éÉáÁíÍóÓúÚçÇ",
    "Min": "0123456789:DNP",
    "FG M/A": "0123456789/",
    "FG %": "0123456789",
    "2P M/A": "0123456789/",
    "2P %": "0123456789",
    "3P M/A": "0123456789/",
    "3P %": "0123456789",
    "FT M/A": "0123456789/",
    "FT %": "0123456789",
    "OR": "0123456789",
    "DR": "0123456789",
    "TOT": "0123456789",
    "AS": "0123456789",
    "TO": "0123456789",
    "ST": "0123456789",
    "BS": "0123456789",
    "PF": "0123456789",
    "FD": "0123456789",
    "+/-": "-0123456789",
    "EF": "-0123456789",
    "PTS": "0123456789"
}

COL_OCR_CONFIG = {
    "No": "--psm 10",             # single char/number
    "Min": "--psm 7",             # single line
    "Name": "--psm 6",            # default line OCR
    "FG M/A": "--psm 7",
    "2P M/A": "--psm 7",
    "3P M/A": "--psm 7",
    "FT M/A": "--psm 7",
    "FG %": "--psm 10",
    "2P %": "--psm 10",
    "3P %": "--psm 10",
    "FT %": "--psm 10",
    "OR": "--psm 10",
    "DR": "--psm 10",
    "TOT": "--psm 10",
    "AS": "--psm 10",
    "TO": "--psm 10",
    "ST": "--psm 10",
    "BS": "--psm 10",
    "PF": "--psm 10",
    "FD": "--psm 10",
    "+/-": "--psm 7",             # can be -5 or 12
    "EF": "--psm 7",
    "PTS": "--psm 10"
}


# --- Helper conversions ---
def pil_to_cv(img):
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def cv_to_pil(img):
    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

def safe_int(val, default=0):
    """Convert to int safely, fallback if invalid."""
    try:
        return int(str(val).replace("!!!", "").strip())
    except:
        return default

# --- OCR Preprocessing ---
def pdf_to_images(pdf_path, dpi=300):
    """Convert PDF pages to PIL Images using PyMuPDF."""
    doc = fitz.open(pdf_path)
    pages = []
    for page in doc:
        zoom = dpi / 72.0  # 72 dpi is default resolution
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        pages.append(img)
    return pages

def preprocess_cv(img_pil):
    """Preprocess using OpenCV for better OCR."""
    img = pil_to_cv(img_pil)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Adaptive threshold
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 2
    )

    # Morphological cleanup
    kernel = np.ones((2, 2), np.uint8)
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    morph = cv2.dilate(morph, kernel, iterations=1)

    return cv_to_pil(morph)

def preprocess_variants(img):
    """Generate multiple preprocessing variants for OCR retries."""
    variants = []

    # Base OpenCV pipeline
    variants.append(preprocess_cv(img))

    # Strong binary threshold (OTSU)
    img_cv = pil_to_cv(img)
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    _, strong = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    strong = cv2.dilate(strong, np.ones((3, 3), np.uint8), iterations=2)
    variants.append(cv_to_pil(strong))

    # Erosion variant (thin characters)
    thin = cv2.erode(strong, np.ones((2, 2), np.uint8), iterations=2)
    variants.append(cv_to_pil(thin))

    return variants

# --- OCR ---
def normalize_text(header, text):
    """Fix common OCR confusions"""
    replacements = {
        "O": "0", "o": "0",
        "I": "1", "l": "1", "|": "1",
        "S": "5",
        "B": "8",
        " ": ""
    }
    # Handle digit vs letter issues
    if header == "Name":  
        return text
        
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

def upscale(img_pil, scale=2):
    cv_img = pil_to_cv(img_pil)
    h, w = cv_img.shape[:2]
    cv_img = cv2.resize(cv_img, (w*scale, h*scale), interpolation=cv2.INTER_CUBIC)
    return cv_to_pil(cv_img)

def scan_with_retries(img, pattern, col_name, fast_only=False):
    whitelist_chars = COL_WHITELISTS.get(col_name, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
    ocr_mode = COL_OCR_CONFIG.get(col_name, "--psm 6")
    custom_config = f'{ocr_mode} -c tessedit_char_whitelist="{whitelist_chars}"'

    # --- upscale first ---
    if col_name == "Name":
        img = upscale(img, 1)  # keep names smaller
    else:
        img = upscale(img, 2)  # numbers sharper

    # --- preprocessing choice ---
    if col_name == "Name":
        variants = [preprocess_cv(img)]  # adaptive
    else:
        variants = preprocess_variants(img)  # binary + erosion + etc.

    # --- try all variants ---
    for v in variants:
        text = pytesseract.image_to_string(v, config=custom_config).strip()
        text = normalize_text(col_name, text)

        if col_name == "Name":
            if text: 
                return text
        elif not pattern or re.match(pattern, text):
            return text

    logging.warning(f"OCR failed for {col_name}")
    return "!!!"


# --- Table Detection ---
def detect_table_cells(page_pil, page_idx):
    img = pil_to_cv(page_pil)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # vertical lines
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 50))
    vertical_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel, iterations=2)

    # horizontal lines
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 1))
    horizontal_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)

    grid = cv2.addWeighted(vertical_lines, 0.5, horizontal_lines, 0.5, 0.0)

    contours, _ = cv2.findContours(grid, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    boxes = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w > 30 and h > 20:  
            boxes.append((x, y, w, h))

    boxes = sorted(boxes, key=lambda b: (b[1], b[0]))

    logging.info(f"Page {page_idx}: Detected {len(boxes)} cell boxes")

    rows = []
    current_row = []
    last_y = -100
    for b in boxes:
        x, y, w, h = b
        if abs(y - last_y) > 15:  
            if current_row:
                rows.append(sorted(current_row, key=lambda b: b[0]))
            current_row = [b]
            last_y = y
        else:
            current_row.append(b)
            last_y = y
    if current_row:
        rows.append(sorted(current_row, key=lambda b: b[0]))

    logging.info(f"Page {page_idx}: Detected {len(rows)} rows")
    
    # ---- DEBUG IMAGE ----
    debug_img = img.copy()
    for (x, y, w, h) in boxes:
        cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 0, 255), 2)
    debug_path = os.path.join(DEBUG_DIR, f"debug_page_{page_idx}.png")
    cv2.imwrite(debug_path, debug_img)
    logging.info(f"Saved debug image: {debug_path}")

    # Crop to PIL
    cell_images = []
    for row in rows:
        row_imgs = []
        for (x, y, w, h) in row:
            crop = page_pil.crop((x, y, x + w, y + h))
            row_imgs.append(crop)
        cell_images.append(row_imgs)

    return cell_images

# --- OCR Fixing ---

def validate_and_fix_row(row, row_cells=None):
    fixed = row.copy()

    # --- Jersey No check ---
    if fixed.get("No") in ["!!!", None, ""] or not str(fixed["No"]).isdigit():
        if row_cells:  # try rescan
            fixed["No"] = rescan_cell(row_cells[0], "No")
        if fixed["No"] in ["!!!", None, ""]:
            fixed["No"] = "!!!"  # flag, don’t force 0

    # --- FG %, 2P %, 3P %, FT % sanity check ---
    for stat, ma_key, idx in [
        ("FG %", "FG M/A", 5),
        ("2P %", "2P M/A", 7),
        ("3P %", "3P M/A", 9),
        ("FT %", "FT M/A", 11),
    ]:
        made, att = parse_made_attempt(fixed[ma_key])
        if att > 0:
            calc_pct = round(100 * made / att)
            try:
                pct_val = int(fixed[stat])
            except:
                pct_val = -999
            if abs(calc_pct - pct_val) > 5:
                fixed[stat] = "!!!"  # flag mismatch
        else:
            fixed[stat] = 0

    # --- PTS sanity check ---
    fg2, _ = parse_made_attempt(fixed["2P M/A"])
    fg3, _ = parse_made_attempt(fixed["3P M/A"])
    ft, _ = parse_made_attempt(fixed["FT M/A"])
    calc_pts = fg2 * 2 + fg3 * 3 + ft
    pts_val = safe_int(fixed.get("PTS", 0))
    if abs(calc_pts - pts_val) > 3:
        fixed["PTS"] = "!!!"  # flag mismatch

    # --- TOT = OR + DR ---
    OR, DR, TOT = safe_int(fixed["OR"]), safe_int(fixed["DR"]), safe_int(fixed["TOT"])
    if OR + DR != TOT:
        fixed["TOT"] = "!!!"

    return fixed


def parse_made_attempt(s):
    """Parses '3/7' into (3,7)."""
    if not s or "/" not in s:
        return 0, 0
    try:
        m, a = s.split("/")
        return int(m), int(a)
    except:
        return 0, 0

def fix_made_attempt(s):
    """Converts OCR mistakes like '34' -> '3/4' or '07' -> '0/7'."""
    if len(s) == 2:
        return f"{s[0]}/{s[1]}"
    elif len(s) == 3:  # e.g. "101" -> "10/1"
        return f"{s[:-1]}/{s[-1]}"
    return "0/0"

def clean_time(s):
    """Ensures mm:ss format."""
    if len(s) == 4:  # e.g. "728" -> "7:28"
        return s[0] + ":" + s[1:]
    if len(s) == 3:  # e.g. "211" -> "2:11"
        return s[0] + ":" + s[1:]
    return s

def rescan_cell(cell_img, col_name):
    """Force rescan with stricter OCR settings."""
    whitelist_chars = COL_WHITELISTS.get(col_name, "0123456789")
    ocr_mode = COL_OCR_CONFIG.get(col_name, "--psm 6")
    custom_config = f'{ocr_mode} -c tessedit_char_whitelist="{whitelist_chars}"'
    
    # Always upscale more for rescans
    img = upscale(cell_img, 3)
    variants = preprocess_variants(img)

    for v in variants:
        text = pytesseract.image_to_string(v, config=custom_config).strip()
        text = normalize_text(col_name, text)
        if text:
            return text
    return "!!!"

# --- Main Parser ---
def parse_boxscore(pdf_path, game_id):
    pages = pdf_to_images(pdf_path, dpi=400)
    all_rows = []

    for page_idx, page in enumerate(pages):
        logging.info(f"Processing page {page_idx+1}")

        cell_grid = detect_table_cells(page, page_idx+1)

        for row_idx, row_cells in enumerate(cell_grid):
            if len(row_cells) < len(PATTERNS):
                logging.warning(f"Page {page_idx+1} Row {row_idx+1} has only {len(row_cells)} cells, skipping")
                continue

            row_data = [game_id]
            skip_rest = False

            for col_idx, cell_img in enumerate(row_cells[:len(PATTERNS)]):
                col_name = HEADERS[col_idx + 1]
                pattern = PATTERNS[col_idx]
                text = scan_with_retries(cell_img, pattern, col_name, fast_only=True)
                row_data.append(text)

                if col_idx == 2 and text.strip().upper().startswith("DNP"):
                    row_data.extend(["DNP"] * (len(PATTERNS) - col_idx - 1))
                    skip_rest = True
                    break

            # --- Validation rules ---
            row_dict = {HEADERS[i]: row_data[i] for i in range(len(row_data))}
            row_dict = validate_and_fix_row(row_dict)

            # Convert back to list (keeping GameID first)
            clean_row = [row_dict[h] for h in HEADERS]
            all_rows.append(clean_row)

    # --- After scanning all rows: check player No order ---
    def safe_int_no(val):
        try:
            return int(val.replace("*", ""))
        except:
            return None

    for team_start in [0, 12]:  # first team rows, then second team rows
        prev_no = -1
        for i in range(team_start, team_start+12):
            if i >= len(all_rows):
                break
            no_val = safe_int_no(all_rows[i][1])
            if no_val is None:
                logging.warning(f"Row {i+1} has invalid No: {all_rows[i][1]}")
                continue
            if no_val < prev_no:  # order violation
                logging.warning(f"Player order issue at row {i+1}, No={no_val}, retrying OCR")

                # Re-scan just the 'No' cell
                page_idx = i // len(cell_grid)
                row_idx = i % len(cell_grid)
                try:
                    # get the corresponding cell image again
                    cell_img = detect_table_cells(pages[page_idx], page_idx+1)[row_idx][0]
                    fixed_text = scan_with_retries(cell_img, PATTERNS[0], "No", fast_only=False)
                    if fixed_text != "!!!":
                        all_rows[i][1] = fixed_text
                        logging.info(f"Fixed No at row {i+1}: {fixed_text}")
                except Exception as e:
                    logging.error(f"Failed to retry OCR for row {i+1} No: {e}")

            prev_no = no_val if no_val is not None else prev_no
            
    # --- Team totals validation ---
    for team_start in [0, 12]:
        team_rows = all_rows[team_start:team_start+12]
        total_pts = sum(int(r[-1]) for r in team_rows if str(r[-1]).isdigit())
        # assume team total row is right after 12th player
        if team_start+12 < len(all_rows):
            reported_pts = int(all_rows[team_start+12][-1]) if str(all_rows[team_start+12][-1]).isdigit() else 0
            if abs(total_pts - reported_pts) > 5:
                logging.warning(f"Team {team_start//12+1} totals mismatch: sum={total_pts}, reported={reported_pts}")

    print(tabulate(all_rows, headers=HEADERS, tablefmt="grid"))
    return all_rows

if __name__ == "__main__":
    pdf_path = r"C:\YZ\老弟\MABA\Website\championship-backend\pdfs\G37Q4.pdf"
    game_id = "G37"
    parse_boxscore(pdf_path, game_id)


