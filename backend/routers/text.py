from groq import Groq
import os

client = Groq(api_key="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")

models = client.models.list()
for m in models.data:
    print(m.id)