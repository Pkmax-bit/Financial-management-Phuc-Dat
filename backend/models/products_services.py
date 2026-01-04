"""
Products/Services model definitions - Optimized Structure
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from decimal import Decimal

class ProductServiceType(str, Enum):
    PRODUCT = "product"
    SERVICE = "service"

class ProductServiceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONTINUED = "discontinued"

class BaseEntity(BaseModel):
    """Base entity with common fields"""
    id: str
    created_at: datetime
    updated_at: datetime

class Dimensions(BaseModel):
    """Dimensions model for products that have physical dimensions"""
    length: Optional[Decimal] = Field(None, description="Length in meters")
    width: Optional[Decimal] = Field(None, description="Width in meters")
    height: Optional[Decimal] = Field(None, description="Height in meters")
    area: Optional[Decimal] = Field(None, description="Area in square meters")
    volume: Optional[Decimal] = Field(None, description="Volume in cubic meters")

class ProductService(BaseEntity):
    """Optimized Product/Service model"""
    code: Optional[str] = Field(None, description="Product/Service code")
    name: str = Field(..., description="Product/Service name")
    description: Optional[str] = Field(None, description="Detailed description")
    type: ProductServiceType = Field(..., description="Type of product/service")
    unit: str = Field("piece", description="Unit of measurement")

    # Pricing
    price: Decimal = Field(..., ge=0, description="Selling price")
    cost: Optional[Decimal] = Field(None, ge=0, description="Cost price")
    currency: str = Field("VND", description="Currency code")

    # Tax and financial
    tax_rate: Decimal = Field(0.0, ge=0, le=100, description="Tax rate percentage")
    tax_included: bool = Field(False, description="Whether price includes tax")

    # Categorization
    category_id: Optional[str] = Field(None, description="Category ID reference")
    category: Optional[dict] = Field(None, description="Category details (populated by joins)")

    # Status and visibility
    status: ProductServiceStatus = Field(ProductServiceStatus.ACTIVE, description="Product status")
    is_active: bool = Field(True, description="Whether product is active")

    # Dimensions (for products with physical dimensions)
    dimensions: Optional[Dimensions] = Field(None, description="Physical dimensions")

    # Media
    image_url: Optional[str] = Field(None, description="Main image URL")
    image_urls: Optional[List[str]] = Field(None, description="Additional image URLs")

    # Additional metadata
    tags: Optional[List[str]] = Field(None, description="Tags for search and filtering")
    attributes: Optional[dict] = Field(None, description="Custom attributes")

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }

class ProductServiceCreate(BaseModel):
    """Product/Service creation model"""
    code: str = Field(..., description="Product/Service code")
    name: str = Field(..., description="Product/Service name")
    description: Optional[str] = Field(None, description="Detailed description")
    type: ProductServiceType = Field(..., description="Type of product/service")
    unit: str = Field("piece", description="Unit of measurement")

    # Pricing
    price: Decimal = Field(..., ge=0, description="Selling price")
    cost: Optional[Decimal] = Field(None, ge=0, description="Cost price")
    currency: str = Field("VND", description="Currency code")

    # Tax and financial
    tax_rate: Decimal = Field(0.0, ge=0, le=100, description="Tax rate percentage")
    tax_included: bool = Field(False, description="Whether price includes tax")

    # Categorization
    category_id: Optional[str] = Field(None, description="Category ID reference")

    # Dimensions (for products with physical dimensions)
    dimensions: Optional[Dimensions] = Field(None, description="Physical dimensions")

    # Media
    image_url: Optional[str] = Field(None, description="Main image URL")
    image_urls: Optional[List[str]] = Field(None, description="Additional image URLs")

    # Additional metadata
    tags: Optional[List[str]] = Field(None, description="Tags for search and filtering")
    attributes: Optional[dict] = Field(None, description="Custom attributes")

class ProductServiceUpdate(BaseModel):
    """Product/Service update model"""
    code: Optional[str] = Field(None, description="Product/Service code")
    name: Optional[str] = Field(None, description="Product/Service name")
    description: Optional[str] = Field(None, description="Detailed description")
    type: Optional[ProductServiceType] = Field(None, description="Type of product/service")
    unit: Optional[str] = Field(None, description="Unit of measurement")

    # Pricing
    price: Optional[Decimal] = Field(None, ge=0, description="Selling price")
    cost: Optional[Decimal] = Field(None, ge=0, description="Cost price")
    currency: Optional[str] = Field(None, description="Currency code")

    # Tax and financial
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Tax rate percentage")
    tax_included: Optional[bool] = Field(None, description="Whether price includes tax")

    # Categorization
    category_id: Optional[str] = Field(None, description="Category ID reference")

    # Status and visibility
    status: Optional[ProductServiceStatus] = Field(None, description="Product status")
    is_active: Optional[bool] = Field(None, description="Whether product is active")

    # Dimensions (for products with physical dimensions)
    dimensions: Optional[Dimensions] = Field(None, description="Physical dimensions")

    # Media
    image_url: Optional[str] = Field(None, description="Main image URL")
    image_urls: Optional[List[str]] = Field(None, description="Additional image URLs")

    # Additional metadata
    tags: Optional[List[str]] = Field(None, description="Tags for search and filtering")
    attributes: Optional[dict] = Field(None, description="Custom attributes")
