import requests

def test_backend():
    url = "http://127.0.0.1:8000/api/metrics"
    payload = {
        "tickers": ["AAPL", "SAP"],
        "period": 12
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        for ticker, history in data.items():
            print(f"Ticker: {ticker}")
            print(f"Data Points: {len(history)}")
            if history:
                print(f"First Date: {history[0]['date']}")
                print(f"Sector: {history[0]['sector']}")
            print("-" * 20)
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_backend()