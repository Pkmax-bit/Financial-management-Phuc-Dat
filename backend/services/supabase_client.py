"""
Supabase client configuration and utilities
"""

from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from config import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    """Supabase service for database operations"""
    
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.service_key = settings.SUPABASE_SERVICE_KEY
        self.anon_key = settings.SUPABASE_ANON_KEY
        self.client: Client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Supabase client with service role key to bypass RLS"""
        try:
            # Verify service key is set
            if not self.service_key:
                raise ValueError("SUPABASE_SERVICE_KEY is not set")
            
            # Check if service key looks correct (should start with 'eyJ' for JWT or be a long string)
            if len(self.service_key) < 50:
                logger.warning(f"Service key seems too short ({len(self.service_key)} chars). Please verify it's the service_role key, not anon key.")
            
            # Use ClientOptions to ensure service_role key bypasses RLS
            # auto_refresh_token=False and persist_session=False prevent user sessions
            # from being attached, which would cause RLS to be enforced
            try:
                from supabase.lib.client_options import ClientOptions
                self.client = create_client(
                    self.url,
                    self.service_key,
                    options=ClientOptions(
                        auto_refresh_token=False,
                        persist_session=False,
                    )
                )
            except (ImportError, AttributeError):
                # Fallback if ClientOptions not available
                logger.warning("ClientOptions not available, using simple initialization")
                self.client = create_client(self.url, self.service_key)
            
            logger.info("Supabase client initialized successfully with service role key")
            logger.info(f"Service key length: {len(self.service_key)} chars")
            logger.info(f"Service key starts with: {self.service_key[:10]}...")
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            logger.error(f"URL: {self.url}")
            logger.error(f"Service key set: {bool(self.service_key)}")
            raise
    
    def get_client(self) -> Client:
        """Get Supabase client instance"""
        if not self.client:
            self._initialize_client()
        return self.client
    
    def get_anon_client(self) -> Client:
        """Get Supabase client with anon key for frontend operations"""
        return create_client(self.url, self.anon_key)

# Global instance
supabase_service = SupabaseService()

def get_supabase_client() -> Client:
    """Dependency to get Supabase client"""
    return supabase_service.get_client()

def get_supabase_anon_client() -> Client:
    """Get Supabase anon client for public operations"""
    return supabase_service.get_anon_client()
