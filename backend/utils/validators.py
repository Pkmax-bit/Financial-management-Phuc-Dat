"""
Input Validation Utilities
Sanitize and validate user inputs to prevent XSS, SQL injection, and other attacks
"""

import re
from typing import Optional
from pydantic import validator, ValidationError


# XSS patterns to remove
XSS_PATTERNS = [
    r'<script[^>]*>.*?</script>',  # Script tags
    r'<iframe[^>]*>.*?</iframe>',  # Iframe tags
    r'javascript:',  # JavaScript protocol
    r'on\w+\s*=',  # Event handlers (onclick, onload, etc.)
    r'<img[^>]*onerror',  # Image onerror
    r'<svg[^>]*onload',  # SVG onload
    r'<style[^>]*>.*?</style>',  # Style tags
    r'<link[^>]*>',  # Link tags
    r'<meta[^>]*>',  # Meta tags
    r'<object[^>]*>.*?</object>',  # Object tags
    r'<embed[^>]*>',  # Embed tags
    r'<form[^>]*>.*?</form>',  # Form tags
]

# SQL injection patterns to remove
SQL_INJECTION_PATTERNS = [
    r"('|(\\')|(;)|(--)|(\*)|(\/\*)|(\*\/)|(\+)|(\%)|(\=)|(\<)|(\>)|(\[)|(\])|(\{)|(\})|(\()|(\))|(\|)|(\&)|(\^)|(\~)|(\!))",
    r"(union|select|insert|update|delete|drop|create|alter|exec|execute|script|declare|cast|convert|truncate|grant|revoke)\s+",
    r"(\bor\b|\band\b)\s+\d+\s*=\s*\d+",
    r"(\bor\b|\band\b)\s+['\"]\s*=\s*['\"]",
    r"(\bor\b|\band\b)\s+['\"]\s*=\s*['\"]",
]

# Email regex pattern
EMAIL_PATTERN = re.compile(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    re.IGNORECASE
)

# Phone number patterns (supports various formats)
PHONE_PATTERN = re.compile(
    r'^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$'
)

# Vietnamese phone number pattern
# More flexible: allows numbers starting with 0 or +84, or just digits (for test/placeholder numbers)
VIETNAM_PHONE_PATTERN = re.compile(
    r'^(\+84|0)?[0-9]{7,10}$'
)


def sanitize_string(value: Optional[str], max_length: Optional[int] = None) -> Optional[str]:
    """
    Sanitize string input to remove XSS and SQL injection patterns
    
    Args:
        value: String value to sanitize
        max_length: Maximum length of the string (None for no limit)
    
    Returns:
        Sanitized string or None if input is None
    
    Examples:
        >>> sanitize_string("<script>alert('xss')</script>")
        "alert('xss')"
        >>> sanitize_string("'; DROP TABLE users; --")
        " DROP TABLE users "
    """
    if value is None:
        return None
    
    if not isinstance(value, str):
        value = str(value)
    
    # Remove XSS patterns
    sanitized = value
    for pattern in XSS_PATTERNS:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove SQL injection patterns (be careful not to be too aggressive)
    for pattern in SQL_INJECTION_PATTERNS:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    # Strip whitespace
    sanitized = sanitized.strip()
    
    # Apply max length if specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized


def validate_email(email: Optional[str]) -> Optional[str]:
    """
    Validate email format using regex
    
    Args:
        email: Email address to validate
    
    Returns:
        Validated email or None if input is None
    
    Raises:
        ValueError: If email format is invalid
    
    Examples:
        >>> validate_email("user@example.com")
        "user@example.com"
        >>> validate_email("invalid-email")
        ValueError: Invalid email format
    """
    if email is None:
        return None
    
    if not isinstance(email, str):
        email = str(email)
    
    email = email.strip().lower()
    
    if not email:
        return None
    
    if not EMAIL_PATTERN.match(email):
        raise ValueError(f"Invalid email format: {email}")
    
    # Additional checks
    if len(email) > 254:  # RFC 5321 limit
        raise ValueError(f"Email too long: {email}")
    
    if email.count('@') != 1:
        raise ValueError(f"Invalid email format: {email}")
    
    local_part, domain = email.split('@')
    if len(local_part) > 64:  # RFC 5321 limit
        raise ValueError(f"Email local part too long: {email}")
    
    return email


def validate_phone(phone: Optional[str], country: Optional[str] = None) -> Optional[str]:
    """
    Validate phone number format
    
    Args:
        phone: Phone number to validate
        country: Country code for country-specific validation (e.g., 'VN' for Vietnam)
    
    Returns:
        Validated phone number or None if input is None
    
    Raises:
        ValueError: If phone format is invalid
    
    Examples:
        >>> validate_phone("+84123456789")
        "+84123456789"
        >>> validate_phone("0123456789", country="VN")
        "0123456789"
        >>> validate_phone("invalid")
        ValueError: Invalid phone format
    """
    if phone is None:
        return None
    
    if not isinstance(phone, str):
        phone = str(phone)
    
    # Remove common separators for validation
    phone_clean = re.sub(r'[\s\-\(\)\.]', '', phone)
    
    if not phone_clean:
        return None
    
    # Country-specific validation
    if country and country.upper() == 'VN':
        # More lenient validation for Vietnamese phones
        # Accept: numbers with +84 or 0 prefix, or just digits (7-10 digits)
        if not VIETNAM_PHONE_PATTERN.match(phone_clean):
            raise ValueError(f"Invalid Vietnamese phone format: {phone}")
    else:
        # General phone validation
        if not PHONE_PATTERN.match(phone_clean):
            raise ValueError(f"Invalid phone format: {phone}")
    
    # Length check (reasonable phone number length)
    # For Vietnamese: 7-10 digits (after removing +84 or 0 prefix)
    # For others: 7-15 digits
    if country and country.upper() == 'VN':
        # For VN, check digits only (excluding +84 prefix)
        digits_only = re.sub(r'^\+84', '', phone_clean)
        digits_only = re.sub(r'^0', '', digits_only)
        if len(digits_only) < 7 or len(digits_only) > 10:
            raise ValueError(f"Phone number length invalid: {phone} (must be 7-10 digits for Vietnamese numbers)")
    else:
        if len(phone_clean) < 7 or len(phone_clean) > 15:
            raise ValueError(f"Phone number length invalid: {phone} (must be 7-15 digits)")
    
    return phone


def sanitize_and_validate_string(value: Optional[str], max_length: Optional[int] = None) -> Optional[str]:
    """
    Sanitize and validate string input
    
    Args:
        value: String value to sanitize and validate
        max_length: Maximum length of the string
    
    Returns:
        Sanitized and validated string or None
    """
    return sanitize_string(value, max_length)


def validate_name(name: Optional[str], max_length: int = 255) -> Optional[str]:
    """
    Validate name field (customer name, employee name, etc.)
    
    Args:
        name: Name to validate
        max_length: Maximum length
    
    Returns:
        Validated name or None
    
    Raises:
        ValueError: If name is invalid
    """
    if name is None:
        return None
    
    name = sanitize_string(name, max_length)
    
    if name and len(name.strip()) < 1:
        raise ValueError("Name cannot be empty")
    
    if name and len(name) > max_length:
        raise ValueError(f"Name too long (max {max_length} characters)")
    
    return name.strip()


def validate_url(url: Optional[str]) -> Optional[str]:
    """
    Validate URL format
    
    Args:
        url: URL to validate
    
    Returns:
        Validated URL or None
    
    Raises:
        ValueError: If URL format is invalid
    """
    if url is None:
        return None
    
    if not isinstance(url, str):
        url = str(url)
    
    url = url.strip()
    
    if not url:
        return None
    
    # Basic URL validation
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    
    if not url_pattern.match(url):
        raise ValueError(f"Invalid URL format: {url}")
    
    return url

