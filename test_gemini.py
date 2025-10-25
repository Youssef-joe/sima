import httpx
import json

API_KEY = "AIzaSyCiWY2aDmJti4YZxwj5zOYO8i9HcINh7dM"

def test_gemini():
    payload = {
        "contents": [{"parts": [{"text": "What are the Najdi architectural facade standards?"}]}],
        "generationConfig": {"maxOutputTokens": 200}
    }
    
    print(f"Request URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY[:10]}...")
    print(f"Request payload: {json.dumps(payload, ensure_ascii=False)}")
    
    with httpx.Client(timeout=60) as client:
        response = client.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}',
            json=payload
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Raw response: {response.text}")
        
        response.raise_for_status()
        data = response.json()
        print(f"Parsed JSON: {json.dumps(data, ensure_ascii=False, indent=2)}")
        
        text = data['candidates'][0]['content']['parts'][0]['text']
        print(f"\n=== FINAL AI RESPONSE ===")
        print(text)
        print(f"=== END RESPONSE ===")
        return text

if __name__ == "__main__":
    test_gemini()