#!/usr/bin/env python3
import httpx
import json

API_KEY = "AIzaSyCiWY2aDmJti4YZxwj5zOYO8i9HcINh7dM"

def test_direct():
    payload = {
        "contents": [{"parts": [{"text": "What are Najdi facade standards?"}]}],
        "generationConfig": {"maxOutputTokens": 200}
    }
    
    with httpx.Client(timeout=30) as client:
        response = client.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}',
            json=payload
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            text = data['candidates'][0]['content']['parts'][0]['text']
            print(f"Response: {text}")
            return text
        else:
            print(f"Error: {response.text}")
            return None

if __name__ == "__main__":
    test_direct()