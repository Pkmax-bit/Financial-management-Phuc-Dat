from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from services.supabase_client import get_supabase_client
from models.user import User
from models.product_category import (
    ProductCategory,
    ProductCategoryCreate,
    ProductCategoryUpdate,
    ProductCategoryTree
)
from utils.auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/product-categories", response_model=List[ProductCategory])
async def get_product_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    parent_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get product categories list"""
    supabase = get_supabase_client()
    query = supabase.table("product_categories").select("*")

    if search:
        query = query.ilike("name", f"%{search}%")
    if parent_id:
        query = query.eq("parent_id", parent_id)
    if is_active is not None:
        query = query.eq("is_active", is_active)

    query = query.order("category_level", desc=False).order("sort_order", desc=False).order("name", desc=False)

    result = query.range(skip, skip + limit - 1).execute()

    return result.data if result.data else []

@router.get("/product-categories/tree", response_model=List[ProductCategoryTree])
async def get_product_categories_tree(
    root_category_id: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Get product categories as hierarchical tree"""
    supabase = get_supabase_client()

    # Use the database function to get tree structure
    try:
        result = supabase.rpc('get_category_tree', {
            'root_category_id': root_category_id
        }).execute()

        if not result.data:
            return []

        # Build tree structure from flat results
        categories_dict = {cat['id']: {**cat, 'children': []} for cat in result.data}
        root_categories = []

        for cat in result.data:
            if cat['parent_id']:
                # This is a child category
                parent = categories_dict.get(cat['parent_id'])
                if parent:
                    parent['children'].append(categories_dict[cat['id']])
            else:
                # This is a root category
                root_categories.append(categories_dict[cat['id']])

        return root_categories

    except Exception as e:
        # Fallback to simple list if function doesn't exist
        print(f"Tree function not available, falling back to flat list: {str(e)}")
        return await get_product_categories(
            parent_id=root_category_id,
            is_active=True if not include_inactive else None
        )

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
    """Create a product category"""
    supabase = get_supabase_client()

    # Check if category code already exists (if provided)
    if category_data.category_code:
        existing = supabase.table("product_categories").select("id").eq("category_code", category_data.category_code).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Category code already exists")

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

    # Check if category code already exists (if updating code)
    if category_data.category_code:
        existing = supabase.table("product_categories").select("id").eq("category_code", category_data.category_code).neq("id", category_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Category code already exists")

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

    # Check if category has children
    children = supabase.table("product_categories").select("id").eq("parent_id", category_id).execute()
    if children.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with child categories. Please delete children first."
        )

    # Check if category is used by products
    products = supabase.table("products").select("id").eq("category_id", category_id).execute()
    if products.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category that is used by products. Please reassign products first."
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
        errors = []

        for category_data in categories:
            try:
                # Check if category already exists
                existing = supabase.table("product_categories").select("id").eq("name", category_data.name).execute()
                if existing.data:
                    skipped.append({"name": category_data.name, "reason": "Already exists"})
                    continue

                # Check if category code already exists (if provided)
                if category_data.category_code:
                    code_existing = supabase.table("product_categories").select("id").eq("category_code", category_data.category_code).execute()
                    if code_existing.data:
                        errors.append({"name": category_data.name, "reason": f"Category code '{category_data.category_code}' already exists"})
                        continue

                # Create category
                data = category_data.dict()
                data["id"] = str(uuid.uuid4())
                data["created_at"] = datetime.utcnow().isoformat()
                data["updated_at"] = datetime.utcnow().isoformat()

                result = supabase.table("product_categories").insert(data).execute()

                if result.data:
                    created.append(result.data[0])
                else:
                    errors.append({"name": category_data.name, "reason": "Failed to create"})
            except Exception as e:
                errors.append({"name": category_data.name, "reason": str(e)})

        return {
            "message": f"Bulk create completed: {len(created)} created, {len(skipped)} skipped, {len(errors)} errors",
            "created": created,
            "skipped": skipped,
            "errors": errors,
            "total_requested": len(categories)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk create product categories: {str(e)}"
        )