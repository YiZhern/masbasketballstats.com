from extract_boxscore import parse_boxscore
from update_gsheet import upload_to_sheet
import time

start_time = time.time()

pdf_path = "pdfs/G37Q4.pdf"
game_id = "G37"

stats = parse_boxscore(pdf_path, game_id)
upload_to_sheet(stats)

end_time = time.time()
print(f"Elapsed Time: {end_time - start_time:.2f} sec")