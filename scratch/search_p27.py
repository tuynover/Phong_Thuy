import re

with open('T:/Phongthuy/scratch/data_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
p27 = paragraphs[26] # 0-indexed index 26 is Paragraph 27

# Search for keywords
keywords = ["vượng", "suy", "điểm", "phần trăm", "dụng thần", "hỷ thần", "cộng", "trừ", "nhân", "chia", "phép tính", "quy tắc", "tổng số"]

# Let's split p27 by sentences or subheadings and write sections containing these keywords
sentences = re.split(r'(?<=[\.\!\?])\s+', p27)

with open('T:/Phongthuy/scratch/p27_extracted.txt', 'w', encoding='utf-8') as out:
    out.write(f"Searching in Paragraph 27 (Total sentences: {len(sentences)}):\n\n")
    for s in sentences:
        if any(kw in s.lower() for kw in keywords):
            out.write(s + "\n\n")

print("Done! Extracted keyword sentences from p27 to scratch/p27_extracted.txt")
