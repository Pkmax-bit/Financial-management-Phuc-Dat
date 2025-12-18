"""
Error Handler Middleware
Handles errors gracefully to prevent server crashes on Render free tier
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
import sys

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware to catch all exceptions and return proper error responses"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            # Log error but don't crash server
            error_type = type(e).__name__
            error_message = str(e)
            
            # Print to console for Render logs
            print(f"ERROR: {error_type}: {error_message}")
            print(f"Path: {request.url.path}")
            traceback.print_exc()
            
            # Return error response
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "Internal server error. Please try again later.",
                    "error_type": error_type,
                    "message": error_message if "development" in str(request.url).lower() else "An error occurred"
                }
            )

