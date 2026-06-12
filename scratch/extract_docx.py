import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            texts = []
            
            # Walk the tree in order to preserve spaces and structures
            for elem in root.iter():
                if elem.tag.endswith('}t'): # matches w:t regardless of namespace prefix
                    if elem.text:
                        texts.append(elem.text)
                elif elem.tag.endswith('}p'): # add paragraph breaks
                    texts.append('\n')
            return "".join(texts)
    except Exception as e:
        return f"Error: {str(e)}"

text = get_docx_text(r"T:\Phongthuy\data.docx")
with open(r"T:\Phongthuy\scratch\data_text.txt", "w", encoding="utf-8") as f:
    f.write(text)
print(f"Success! Length: {len(text)}")
