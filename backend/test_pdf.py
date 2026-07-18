import fitz

pdf_path = r"C:\Users\KIIT0001\Downloads\RENTAL_AGREEMENT.pdf"

doc = fitz.open(pdf_path)

text = ""
for page in doc:
    text += page.get_text()

print(text)
