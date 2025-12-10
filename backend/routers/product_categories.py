"""
Product Categories Router
API endpoints for managing product categories
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from services.supabase_client import get_supabase_client
from models.user import User
from utils.auth import get_current_user
from pydantic import BaseModel
import uuid
from datetime import datetime

router = APIRouter()

# Pydantic models
class ProductCategory(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: str

class ProductCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ProductCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/product-categories", response_model=List[ProductCategory])
async def get_product_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get product categories list"""
    supabase = get_supabase_client()
    query = supabase.table("product_categories").select("*")
    
    if search:
        query = query.ilike("name", f"%{search}%")
    if is_active is not None:
        query = query.eq("is_active", is_active)
    
    result = query.order("name", desc=False).range(skip, skip + limit - 1).execute()
    
    return result.data if result.data else []

@router.get("/product-categories/{category_id}", response_model=ProductCategory)
async def get_product_category(
    category_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific product category by ID"""
    supabase = get_supabase_client()
    result = supabase.table("product_categories").select("*").eq("id", category_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Product category not found")
    
    return result.data[0]

@router.post("/product-categories", response_model=ProductCategory)
async def create_product_category(
    category_data: ProductCategoryCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new product category"""
    supabase = get_supabase_client()
    
    # Check if name already exists
    existing = supabase.table("product_categories").select("id").eq("name", category_data.name).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    data = category_data.dict()
    data["id"] = str(uuid.uuid4())
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("product_categories").insert(data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to create product category")

@router.put("/product-categories/{category_id}", response_model=ProductCategory)
async def update_product_category(
    category_id: str,
    category_data: ProductCategoryUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a product category"""
    supabase = get_supabase_client()
    
    # Check if category exists
    check_result = supabase.table("product_categories").select("id").eq("id", category_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Product category not found")
    
    # Check if name already exists (if name is being updated)
    if category_data.name:
        existing = supabase.table("product_categories").select("id").eq("name", category_data.name).neq("id", category_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Prepare update data
    update_data = category_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("product_categories").update(update_data).eq("id", category_id).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to update product category")

@router.delete("/product-categories/{category_id}")
async def delete_product_category(
    category_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a product category (soft delete by setting is_active to false)"""
    supabase = get_supabase_client()
    
    # Check if category exists
    check_result = supabase.table("product_categories").select("id").eq("id", category_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Product category not found")
    
    # Check if category has products
    products_check = supabase.table("products").select("id").eq("category_id", category_id).limit(1).execute()
    if products_check.data:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete category that has products. Please remove or reassign products first."
        )
    
    # Soft delete: set is_active to false
    result = supabase.table("product_categories").update({
        "is_active": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", category_id).execute()
    
    if result.data:
        return {"message": "Product category deleted successfully", "id": category_id}
    raise HTTPException(status_code=400, detail="Failed to delete product category")

@router.post("/product-categories/bulk-create")
async def bulk_create_product_categories(
    categories: List[ProductCategoryCreate],
    current_user: User = Depends(get_current_user)
):
    """Bulk create multiple product categories at once"""
    try:
        supabase = get_supabase_client()
        
        created = []
        skipped = []
        
        for category_data in categories:
            # Check if category already exists
            existing = supabase.table("product_categories").select("id").eq("name", category_data.name).execute()
            
            if existing.data:
                skipped.append({"name": category_data.name, "reason": "Already exists"})
                continue
            
            # Create new category
            data = category_data.dict()
            data["id"] = str(uuid.uuid4())
            data["created_at"] = datetime.utcnow().isoformat()
            data["updated_at"] = datetime.utcnow().isoformat()
            
            result = supabase.table("product_categories").insert(data).execute()
            
            if result.data:
                created.append(result.data[0])
            else:
                skipped.append({"name": category_data.name, "reason": "Failed to create"})
        
        return {
            "message": f"Bulk create completed: {len(created)} created, {len(skipped)} skipped",
            "created": created,
            "skipped": skipped,
            "total_requested": len(categories)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk create categories: {str(e)}"
        )

@router.post("/product-categories/seed-defaults")
async def seed_default_product_categories(
    current_user: User = Depends(get_current_user)
):
    """Seed default product categories (13 categories)"""
    default_categories = [
        ProductCategoryCreate(name="Nhôm XingFa Nhập khẩu", description="Nhôm XingFa nhập khẩu chất lượng cao"),
        ProductCategoryCreate(name="Nhôm XingFa Việt Nam", description="Nhôm XingFa sản xuất tại Việt Nam"),
        ProductCategoryCreate(name="Nhôm MaxPro", description="Nhôm MaxPro - sản phẩm nhôm cao cấp"),
        ProductCategoryCreate(name="Nhôm ZhongKai", description="Nhôm ZhongKai - nhôm nhập khẩu"),
        ProductCategoryCreate(name="Nhôm OWin", description="Nhôm OWin - sản phẩm nhôm chất lượng"),
        ProductCategoryCreate(name="Cửa kính cường lực", description="Cửa kính cường lực an toàn"),
        ProductCategoryCreate(name="Vách kính", description="Vách kính ngăn phòng, văn phòng"),
        ProductCategoryCreate(name="Phòng tắm kính", description="Phòng tắm kính hiện đại"),
        ProductCategoryCreate(name="Lan can ban công kính", description="Lan can ban công bằng kính"),
        ProductCategoryCreate(name="Lan can cầu thang kính", description="Lan can cầu thang kính an toàn"),
        ProductCategoryCreate(name="Cửa sắt CNC", description="Cửa sắt CNC công nghệ cao"),
        ProductCategoryCreate(name="Nhôm PMI", description="Nhôm PMI - sản phẩm nhôm chất lượng"),
        ProductCategoryCreate(name="Nhôm HMA", description="Nhôm HMA - nhôm nhập khẩu"),
    ]
    
    return await bulk_create_product_categories(default_categories, current_user)

