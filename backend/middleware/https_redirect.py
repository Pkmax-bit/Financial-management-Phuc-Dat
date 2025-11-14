"""
HTTPS Redirect Middleware
Redirects HTTP requests to HTTPS in production environment
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse
import os


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Middleware to redirect HTTP to HTTPS in production"""
    
    def __init__(self, app, environment: str = "development"):
        super().__init__(app)
        self.environment = environment
    
    async def dispatch(self, request: Request, call_next):
        # Only redirect in production
        if self.environment != "production":
            return await call_next(request)
        
        # Check if request is HTTP (not HTTPS)
        url = request.url
        if url.scheme == "http":
            # Build HTTPS URL
            https_url = url.replace(scheme="https")
            
            # Return 301 Permanent Redirect
            return RedirectResponse(
                url=str(https_url),
                status_code=301
            )
        
        # HTTPS request - proceed normally
        return await call_next(request)

