import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

prompt = "What is in this image?"

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key
)

response = client.chat.completions.create(
    model="google/gemini-2.0-flash-lite-preview-02-05:free",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wis-cabbage.jpg/1200px-Gfp-wis-cabbage.jpg"
                    },
                },
            ],
        }
    ],
    temperature=0.1,
)

print(response.choices[0].message.content)
