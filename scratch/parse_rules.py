import re

with open('T:/Phongthuy/scratch/data_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

paragraphs = [p.strip() for p in text.split('\n') if p.strip()]

with open('T:/Phongthuy/scratch/data_structure.txt', 'w', encoding='utf-8') as out:
    out.write(f"Total Paragraphs: {len(paragraphs)}\n\n")
    for i, p in enumerate(paragraphs):
        # Write first 300 characters of each paragraph to see what's in there
        out.write(f"--- Paragraph {i+1} (Length: {len(p)}) ---\n")
        out.write(p[:400] + "...\n\n")

print("Done! Structure written to scratch/data_structure.txt")
