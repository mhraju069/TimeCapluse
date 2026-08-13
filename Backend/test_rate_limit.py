import time
import requests

API_URL = "http://localhost:8000/api/faq/"
MAX_REQUESTS = 70

print("=" * 60)
print("Starting Rate Limit Verification Script...")
print(f"Target URL: {API_URL}")
print(f"Sending up to {MAX_REQUESTS} concurrent/rapid requests...")
print("=" * 60)

rate_limited = False

for i in range(1, MAX_REQUESTS + 1):
    try:
        response = requests.get(API_URL)
        status = response.status_code
        print(f"Request {i:02d}: Status Code = {status}")
        
        if status == 429:
            print("\n[SUCCESS] Rate limiting is working correctly!")
            print(f"Received 429 Too Many Requests on request #{i}.")
            print("Response detail:", response.json())
            rate_limited = True
            break
    except requests.exceptions.RequestException as e:
        print(f"Request {i:02d} failed: {e}")
        break

if not rate_limited:
    print("\n[WARNING] Completed all requests without getting rate limited (Status 429).")
    print("Please check that the server is running on http://localhost:8000 and that the rate limit configuration is active.")
print("=" * 60)
