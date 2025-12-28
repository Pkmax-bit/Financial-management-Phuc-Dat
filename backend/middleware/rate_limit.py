"""
Rate Limiting Middleware
Prevents abuse by limiting the number of requests per time window
"""

from fastapi import Request, HTTPException, status
from collections import defaultdict
from typing import Dict, List
import time
import os


class RateLimiter:
    """
    In-memory rate limiter using sliding window algorithm
    For production, consider using Redis for distributed rate limiting
    """
    
    def __init__(self):
        # Store: {identifier: [timestamp1, timestamp2, ...]}
        self.store: Dict[str, List[float]] = defaultdict(list)
        # Cleanup old entries periodically
        self.last_cleanup = time.time()
        self.cleanup_interval = 300  # 5 minutes
    
    def _cleanup_old_entries(self, window_seconds: int):
        """Remove old entries to prevent memory leak"""
        current_time = time.time()
        
        # Only cleanup every cleanup_interval seconds
        if current_time - self.last_cleanup < self.cleanup_interval:
            return
        
        self.last_cleanup = current_time
        window_start = current_time - window_seconds
        
        # Remove entries older than window
        for identifier in list(self.store.keys()):
            self.store[identifier] = [
                timestamp for timestamp in self.store[identifier]
                if timestamp > window_start
            ]
            
            # Remove empty entries
            if not self.store[identifier]:
                del self.store[identifier]
    
    def check_rate_limit(
        self,
        request: Request,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> None:
        """
        Check if request exceeds rate limit
        
        Args:
            request: FastAPI request object
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            
        Raises:
            HTTPException: If rate limit is exceeded
        """
        # Get identifier (user_id or IP address)
        user_id = getattr(request.state, 'user_id', None)
        client_ip = request.client.host if request.client else 'unknown'
        identifier = user_id or f"ip:{client_ip}"
        
        current_time = time.time()
        window_start = current_time - window_seconds
        
        # Cleanup old entries periodically
        self._cleanup_old_entries(window_seconds)
        
        # Get existing requests for this identifier
        requests = self.store[identifier]
        
        # Remove requests outside the time window
        requests[:] = [ts for ts in requests if ts > window_start]
        
        # Check if limit is exceeded
        if len(requests) >= max_requests:
            # Calculate retry after time
            oldest_request = min(requests) if requests else current_time
            retry_after = int(window_seconds - (current_time - oldest_request)) + 1
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {max_requests} requests per {window_seconds} seconds. Please try again in {retry_after} seconds.",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(current_time + retry_after))
                }
            )
        
        # Add current request
        requests.append(current_time)
        
        # Update store
        self.store[identifier] = requests
    
    def get_rate_limit_info(self, identifier: str, window_seconds: int = 60) -> Dict:
        """Get rate limit information for an identifier (for debugging)"""
        current_time = time.time()
        window_start = current_time - window_seconds
        
        requests = [
            ts for ts in self.store.get(identifier, [])
            if ts > window_start
        ]
        
        return {
            "identifier": identifier,
            "requests_count": len(requests),
            "window_seconds": window_seconds,
            "oldest_request": min(requests) if requests else None,
            "newest_request": max(requests) if requests else None
        }


# Global rate limiter instance
rate_limiter = RateLimiter()


# Rate limit configuration from environment variables
def get_rate_limit_config() -> Dict:
    """Get rate limit configuration from environment variables"""
    # In development mode, use more lenient rate limits
    is_development = os.getenv("ENVIRONMENT", "development") == "development"

    return {
        "max_requests": int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "500" if is_development else "100")),
        "window_seconds": int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60")),
        "enabled": os.getenv("RATE_LIMIT_ENABLED", "false" if is_development else "true").lower() == "true"
    }

