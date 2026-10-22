from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime, timezone

def format_timestamp():
    return datetime.now(timezone.utc).isoformat()

async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail,
                "details": []
            },
            "meta": {
                "timestamp": format_timestamp()
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err.get("loc", []))
        details.append({
            "field": field,
            "issue": err.get("msg", "Validation error")
        })
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input provided",
                "details": details
            },
            "meta": {
                "timestamp": format_timestamp()
            }
        }
    )
