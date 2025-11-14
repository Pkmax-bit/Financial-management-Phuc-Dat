"""
Request Signing Middleware
Verifies request signatures to prevent request tampering and replay attacks
"""

import hmac
import hashlib
import time
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import os
from config import settings


class RequestSigningMiddleware(BaseHTTPMiddleware):
    """Middleware to verify request signatures"""
    
    def __init__(self, app, environment: str = "development"):
        super().__init__(app)
        self.environment = environment
        self.api_secret = settings.API_SECRET
        self.enabled = settings.REQUEST_SIGNING_ENABLED
        self.timestamp_window = settings.REQUEST_TIMESTAMP_WINDOW
    
    def verify_request_signature(
        self,
        method: str,
        path: str,
        timestamp: int,
        nonce: str,
        signature: str,
        body: bytes = None
    ) -> bool:
        """
        Verify request signature using HMAC-SHA256
        
        Args:
            method: HTTP method
            path: Request path
            timestamp: Request timestamp (Unix timestamp in seconds)
            nonce: Random nonce
            signature: Request signature
            body: Request body (optional)
        
        Returns:
            True if signature is valid, False otherwise
        """
        # Calculate body hash
        body_hash = hashlib.sha256(body).hexdigest() if body else ''
        
        # Create signature payload (same format as frontend)
        payload = f"{method.upper()}|{path}|{timestamp}|{nonce}|{body_hash}"
        
        # Generate expected signature
        expected_signature = hmac.new(
            self.api_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (use constant-time comparison to prevent timing attacks)
        return hmac.compare_digest(signature, expected_signature)
    
    def verify_timestamp(self, timestamp: int) -> bool:
        """
        Verify request timestamp is within acceptable window
        
        Args:
            timestamp: Request timestamp (Unix timestamp in seconds)
        
        Returns:
            True if timestamp is valid, False otherwise
        """
        current_time = int(time.time())
        time_diff = abs(current_time - timestamp)
        
        # Allow requests within timestamp window (default 5 minutes)
        return time_diff <= self.timestamp_window
    
    async def dispatch(self, request: Request, call_next):
        # Skip verification if disabled
        if not self.enabled:
            return await call_next(request)
        
        # Skip verification in development mode (unless explicitly enabled via env)
        # This allows testing without signing in development
        if self.environment == "development":
            # Check if signing is explicitly enabled in development
            signing_enabled = os.getenv("REQUEST_SIGNING_ENABLED", "false").lower() == "true"
            if not signing_enabled:
                return await call_next(request)
        
        # Skip verification for health check and documentation endpoints
        skip_paths = ["/", "/health", "/docs", "/redoc", "/openapi.json"]
        if request.url.path in skip_paths:
            return await call_next(request)
        
        # Get request headers
        timestamp_header = request.headers.get("X-Request-Timestamp")
        nonce_header = request.headers.get("X-Request-Nonce")
        signature_header = request.headers.get("X-Request-Signature")
        
        # Check if all required headers are present
        if not all([timestamp_header, nonce_header, signature_header]):
            if self.environment == "production":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Missing required security headers: X-Request-Timestamp, X-Request-Nonce, X-Request-Signature"
                )
            # In development, allow requests without signature headers
            return await call_next(request)
        
        try:
            # Parse timestamp
            timestamp = int(timestamp_header)
            
            # Verify timestamp
            if not self.verify_timestamp(timestamp):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Request timestamp expired or invalid. Time difference: {abs(int(time.time()) - timestamp)} seconds"
                )
            
            # Get request body
            body = await request.body()
            
            # Verify signature
            if not self.verify_request_signature(
                method=request.method,
                path=request.url.path,
                timestamp=timestamp,
                nonce=nonce_header,
                signature=signature_header,
                body=body
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid request signature"
                )
            
            # Recreate request with body (body was consumed)
            async def receive():
                return {"type": "http.request", "body": body}
            
            request._receive = receive
            
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid timestamp format"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Signature verification error: {str(e)}"
            )
        
        # Process request
        response = await call_next(request)
        return response

