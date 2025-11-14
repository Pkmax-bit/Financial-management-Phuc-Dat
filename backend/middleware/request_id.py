"""
Request ID Middleware
Generates unique request ID for each request for tracking and debugging
"""

import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add X-Request-ID header to all requests"""
    
    async def dispatch(self, request: Request, call_next):
        # Get existing request ID from header or generate new one
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Store in request state for use in handlers
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add X-Request-ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response

