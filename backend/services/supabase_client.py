"""
Supabase client configuration and utilities
"""

from supabase import create_client, Client
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
        """Initialize Supabase client"""
        try:
            self.client = create_client(self.url, self.service_key)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
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
