from google import genai
from dotenv import load_dotenv
import os
import json
import fitz

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

pdf_path = r"C:\Users\KIIT0001\Downloads\RENTAL_AGREEMENT.pdf"

doc = fitz.open(pdf_path)

legal_text = ""
for page in doc:
    legal_text += page.get_text()

prompt = f"""
You are a legal document analyzer.
Analyze the following legal text and return a JSON array.
Each item must have exactly these fields:
- clause: the problematic clause from the text
- risk_level: either "high", "medium", or "low"
- explanation: plain English explanation of why it is risky

Return only a valid JSON array. No extra text. No markdown. No backticks.

Legal text: {legal_text}
"""
response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents=prompt
)

result = json.loads(response.text)
for item in result:
    print(f"Clause: {item['clause']}")
    print(f"Risk: {item['risk_level']}")
    print(f"Explanation: {item['explanation']}")
    print("---")