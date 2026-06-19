import urllib.request, json
try:
    req = urllib.request.Request("http://127.0.0.1:8000/api/attendance/admin/all/")
    req.add_header("Cookie", "sessionid=YOUR_SESSION_ID") # Wait, I don't know the session ID.
    with urllib.request.urlopen(req) as response:
        print(json.loads(response.read().decode())['data'][0])
except Exception as e:
    print(e)
