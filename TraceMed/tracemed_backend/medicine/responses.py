from rest_framework.response import Response


def success_response(data=None, message=None, count=None, status_code=200):
    payload = {"status": "success"}
    if message is not None:
        payload["message"] = message
    if count is not None:
        payload["count"] = count
    if data is not None:
        payload["data"] = data
    return Response(payload, status=status_code)


def error_response(message, errors=None, status_code=400):
    payload = {
        "status": "error",
        "message": message,
    }
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)
