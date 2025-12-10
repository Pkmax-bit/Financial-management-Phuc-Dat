from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from services.supabase_client import get_supabase_client
from models.user import User
from models.products_services import ProductService, ProductServiceCreate, ProductServiceUpdate
from utils.auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter()

# Alias endpoints for mobile app compatibility (/api/products-services)
@router.get("/products-services", response_model=List[ProductService])
async def get_products_services(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get products list (alias for mobile app)"""
    supabase = get_supabase_client()
    query = supabase.table("products").select("*")
    
    if search:
        query = query.ilike("name", f"%{search}%")
    if type:
        query = query.eq("type", type)
    if category:
        query = query.eq("category", category)
        
    result = query.range(skip, skip + limit - 1).execute()
    
    return result.data if result.data else []

@router.get("/products-services/{product_id}", response_model=ProductService)
async def get_product_service(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific product by ID (alias for mobile app)"""
    supabase = get_supabase_client()
    result = supabase.table("products").select("*").eq("id", product_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return result.data[0]

@router.post("/products-services", response_model=ProductService)
async def create_product_service(
    product_data: ProductServiceCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a product (alias for mobile app)"""
    supabase = get_supabase_client()
    data = product_data.dict()
    data["id"] = str(uuid.uuid4())
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("products").insert(data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to create product")

@router.put("/products-services/{product_id}", response_model=ProductService)
async def update_product_service(
    product_id: str,
    product_data: ProductServiceUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a product (alias for mobile app)"""
    supabase = get_supabase_client()
    
    # Check if product exists
    check_result = supabase.table("products").select("id").eq("id", product_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Prepare update data (only include fields that are not None)
    update_data = product_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("products").update(update_data).eq("id", product_id).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to update product")

@router.delete("/products-services/{product_id}")
async def delete_product_service(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a product (alias for mobile app)"""
    supabase = get_supabase_client()
    
    # Check if product exists
    check_result = supabase.table("products").select("id").eq("id", product_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Soft delete: set is_active to false
    result = supabase.table("products").update({
        "is_active": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", product_id).execute()
    
    if result.data:
        return {"message": "Product deleted successfully", "id": product_id}
    raise HTTPException(status_code=400, detail="Failed to delete product")

@router.get("/products", response_model=List[ProductService])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get products list"""
    supabase = get_supabase_client()
    query = supabase.table("products").select("*")
    
    if search:
        query = query.ilike("name", f"%{search}%")
    if type:
        query = query.eq("type", type)
    if category:
        query = query.eq("category", category)
        
    result = query.range(skip, skip + limit - 1).execute()
    
    # Map price to unit_price if needed, but model has price.
    return result.data if result.data else []
     
@router.get("/products/{product_id}", response_model=ProductService)
async def get_product(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific product by ID"""
    supabase = get_supabase_client()
    result = supabase.table("products").select("*").eq("id", product_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return result.data[0]

@router.post("/products", response_model=ProductService)
async def create_product(
    product_data: ProductServiceCreate,
    current_user: User = Depends(get_current_user)
):
    supabase = get_supabase_client()
    data = product_data.dict()
    data["id"] = str(uuid.uuid4())
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("products").insert(data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to create product")

@router.put("/products/{product_id}", response_model=ProductService)
async def update_product(
    product_id: str,
    product_data: ProductServiceUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a product"""
    supabase = get_supabase_client()
    
    # Check if product exists
    check_result = supabase.table("products").select("id").eq("id", product_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Prepare update data (only include fields that are not None)
    update_data = product_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("products").update(update_data).eq("id", product_id).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to update product")

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a product (soft delete by setting is_active to false)"""
    supabase = get_supabase_client()
    
    # Check if product exists
    check_result = supabase.table("products").select("id").eq("id", product_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Soft delete: set is_active to false
    result = supabase.table("products").update({
        "is_active": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", product_id).execute()
    
    if result.data:
        return {"message": "Product deleted successfully", "id": product_id}
    raise HTTPException(status_code=400, detail="Failed to delete product")

@router.post("/products/bulk-create")
async def bulk_create_products(
    products: List[dict],
    current_user: User = Depends(get_current_user)
):
    """Bulk create multiple products at once"""
    try:
        supabase = get_supabase_client()
        
        # Build category name to ID mapping
        category_map = {}
        for product in products:
            category_name = product.get("category_name")
            if category_name and category_name not in category_map:
                result = supabase.table("product_categories").select("id").eq("name", category_name).execute()
                if result.data:
                    category_map[category_name] = result.data[0]["id"]
        
        created = []
        skipped = []
        errors = []
        
        for product_data in products:
            try:
                product_name = product_data.get("name")
                category_name = product_data.get("category_name")
                
                if not product_name:
                    errors.append({"name": "Unknown", "reason": "Missing product name"})
                    continue
                
                # Check if product already exists
                existing = supabase.table("products").select("id").eq("name", product_name).execute()
                if existing.data:
                    skipped.append({"name": product_name, "reason": "Already exists"})
                    continue
                
                # Get category ID
                category_id = None
                if category_name:
                    category_id = category_map.get(category_name)
                    if not category_id:
                        errors.append({"name": product_name, "reason": f"Category '{category_name}' not found"})
                        continue
                
                # Create product
                data = {
                    "name": product_name,
                    "category_id": category_id,
                    "price": product_data.get("price", 0.0),
                    "unit": product_data.get("unit", "cái"),
                    "description": product_data.get("description", f"Sản phẩm {product_name}"),
                    "is_active": product_data.get("is_active", True),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                result = supabase.table("products").insert(data).execute()
                
                if result.data:
                    created.append(result.data[0])
                else:
                    errors.append({"name": product_name, "reason": "Failed to create"})
            except Exception as e:
                errors.append({"name": product_data.get("name", "Unknown"), "reason": str(e)})
        
        return {
            "message": f"Bulk create completed: {len(created)} created, {len(skipped)} skipped, {len(errors)} errors",
            "created": created,
            "skipped": skipped,
            "errors": errors,
            "total_requested": len(products)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk create products: {str(e)}"
        )
