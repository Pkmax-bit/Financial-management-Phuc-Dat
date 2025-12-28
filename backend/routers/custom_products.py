from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from services.supabase_client import get_supabase_client
from models.user import User
from models.custom_products import (
    CustomProductCategory, CustomProductCategoryCreate, CustomProductCategoryUpdate,
    CustomProductColumn, CustomProductColumnCreate, CustomProductColumnUpdate,
    CustomProductOption, CustomProductOptionCreate, CustomProductOptionUpdate,
    CustomProduct, CustomProductCreate, CustomProductUpdate,
    CustomProductStructure, CustomProductStructureCreate, CustomProductStructureUpdate
)
from utils.auth import get_current_user
from config import settings
import uuid
from datetime import datetime

router = APIRouter()

# Development mode authentication helper
async def get_current_user_dev_mode():
    """Get current user - always return mock user in development mode"""
    if settings.ENVIRONMENT == "development":
        print("[DEV MODE] Using mock admin user for development")
        from datetime import datetime
        return User(
            id="dev-admin-user",
            email="admin@example.com",  # Valid email for development
            full_name="Development Admin",
            role="admin",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

    # In production, require proper authentication
    try:
        from utils.auth import get_current_user
        return await get_current_user()
    except Exception as e:
        print(f"[AUTH] Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

# ========== CATEGORIES ==========

@router.get("/categories", response_model=List[CustomProductCategory])
async def get_categories(
    active_only: bool = Query(True),
    current_user: Optional[User] = Depends(get_current_user_dev_mode)
):
    """Get all categories"""
    print(f"[API] Getting categories, active_only={active_only}, user={current_user.id if current_user else 'None'}")

    supabase = get_supabase_client()
    query = supabase.table("custom_product_categories").select("*").order("order_index")

    if active_only:
        query = query.eq("is_active", True)

    result = query.execute()
    categories = result.data if result.data else []
    print(f"[API] Found {len(categories)} categories")

    return categories

@router.get("/categories/dev", response_model=List[CustomProductCategory])
async def get_categories_dev(active_only: bool = Query(True)):
    """Get all categories - development mode without authentication"""
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in development mode"
        )

    print(f"[API DEV] Getting categories without auth, active_only={active_only}")

    supabase = get_supabase_client()
    query = supabase.table("custom_product_categories").select("*").order("order_index")

    if active_only:
        query = query.eq("is_active", True)

    result = query.execute()
    categories = result.data if result.data else []
    print(f"[API DEV] Found {len(categories)} categories")
    for cat in categories:
        print(f"[API DEV] Category: {cat.get('name')} (is_primary: {cat.get('is_primary')})")

    return categories

@router.get("/categories/{category_id}", response_model=CustomProductCategory)
async def get_category(
    category_id: str,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Get a specific category"""
    supabase = get_supabase_client()
    result = supabase.table("custom_product_categories").select("*").eq("id", category_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")

    return result.data[0]

@router.post("/categories", response_model=CustomProductCategory)
async def create_category(
    category_data: CustomProductCategoryCreate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Create a new category"""
    supabase = get_supabase_client()

    # Get max order_index
    max_order_result = supabase.table("custom_product_categories").select("order_index").order("order_index", desc=True).limit(1).execute()
    next_order = (max_order_result.data[0]["order_index"] + 1) if max_order_result.data else 0

    data = category_data.dict()
    data["id"] = str(uuid.uuid4())
    data["order_index"] = next_order
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_product_categories").insert(data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to create category")

@router.put("/categories/{category_id}", response_model=CustomProductCategory)
async def update_category(
    category_id: str,
    category_data: CustomProductCategoryUpdate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Update a category"""
    supabase = get_supabase_client()

    # Check if category exists
    check_result = supabase.table("custom_product_categories").select("id").eq("id", category_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = category_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_product_categories").update(update_data).eq("id", category_id).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to update category")

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Hard delete a category and all related data"""
    supabase = get_supabase_client()

    # Check if category exists
    check_result = supabase.table("custom_product_categories").select("id").eq("id", category_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if category has structures
    structures_check = supabase.table("custom_product_structures").select("id").eq("category_id", category_id).limit(1).execute()
    if structures_check.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category that has structures. Please remove structures first."
        )

    # Check if category has products
    products_check = supabase.table("custom_products").select("id").eq("category_id", category_id).limit(1).execute()
    if products_check.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category that has products. Please remove products first."
        )

    # Hard delete the category (cascade will delete related columns and options)
    result = supabase.table("custom_product_categories").delete().eq("id", category_id).execute()

    return {"message": "Category deleted successfully", "id": category_id}

# ========== COLUMNS ==========

@router.get("/columns", response_model=List[CustomProductColumn])
async def get_columns(
    category_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Get all columns, optionally filtered by category"""
    supabase = get_supabase_client()
    query = supabase.table("custom_product_columns").select("*").order("order_index")

    if category_id:
        query = query.eq("category_id", category_id)
    if active_only:
        query = query.eq("is_active", True)

    result = query.execute()
    return result.data if result.data else []

@router.get("/categories/{category_id}/columns", response_model=List[CustomProductColumn])
async def get_columns_by_category(
    category_id: str,
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Get columns for a specific category"""
    supabase = get_supabase_client()
    query = supabase.table("custom_product_columns").select("*").eq("category_id", category_id).order("order_index")

    if active_only:
        query = query.eq("is_active", True)

    result = query.execute()
    return result.data if result.data else []

@router.post("/columns", response_model=CustomProductColumn)
async def create_column(
    column_data: CustomProductColumnCreate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Create a new column"""
    supabase = get_supabase_client()

    # Get max order_index for this category
    max_order_result = supabase.table("custom_product_columns").select("order_index").eq("category_id", column_data.category_id).order("order_index", desc=True).limit(1).execute()
    next_order = (max_order_result.data[0]["order_index"] + 1) if max_order_result.data else 0

    data = column_data.dict()
    data["id"] = str(uuid.uuid4())
    data["order_index"] = next_order
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_product_columns").insert(data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to create column")

@router.put("/columns/{column_id}", response_model=CustomProductColumn)
async def update_column(
    column_id: str,
    column_data: CustomProductColumnUpdate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Update a column"""
    supabase = get_supabase_client()

    # Check if column exists
    check_result = supabase.table("custom_product_columns").select("id").eq("id", column_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Column not found")

    update_data = column_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_product_columns").update(update_data).eq("id", column_id).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to update column")

@router.delete("/columns/{column_id}")
async def delete_column(
    column_id: str,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Soft delete a column"""
    supabase = get_supabase_client()

    # Check if column exists
    check_result = supabase.table("custom_product_columns").select("id").eq("id", column_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Column not found")

    result = supabase.table("custom_product_columns").update({
        "is_active": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", column_id).execute()

    if result.data:
        return {"message": "Column deleted successfully", "id": column_id}
    raise HTTPException(status_code=400, detail="Failed to delete column")

# ========== OPTIONS ==========

@router.get("/options", response_model=List[CustomProductOption])
async def get_options(
    column_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Get all options, optionally filtered by column"""
    supabase = get_supabase_client()
    query = supabase.table("custom_product_options").select("*").order("order_index")

    if column_id:
        query = query.eq("column_id", column_id)
    if active_only:
        query = query.eq("is_active", True)

    result = query.execute()
    return result.data if result.data else []

@router.post("/options", response_model=CustomProductOption)
async def create_option(
    option_data: CustomProductOptionCreate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Create a new option"""
    supabase = get_supabase_client()

    # Get max order_index for this column
    max_order_result = supabase.table("custom_product_options").select("order_index").eq("column_id", option_data.column_id).order("order_index", desc=True).limit(1).execute()
    next_order = (max_order_result.data[0]["order_index"] + 1) if max_order_result.data else 0

    data = option_data.dict()
    data["id"] = str(uuid.uuid4())
    data["order_index"] = next_order
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_product_options").insert(data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to create option")

@router.put("/options/{option_id}", response_model=CustomProductOption)
async def update_option(
    option_id: str,
    option_data: CustomProductOptionUpdate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Update an option"""
    supabase = get_supabase_client()

    # Check if option exists
    check_result = supabase.table("custom_product_options").select("id").eq("id", option_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Option not found")

    update_data = option_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_product_options").update(update_data).eq("id", option_id).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to update option")

@router.delete("/options/{option_id}")
async def delete_option(
    option_id: str,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Soft delete an option"""
    supabase = get_supabase_client()

    # Check if option exists
    check_result = supabase.table("custom_product_options").select("id").eq("id", option_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Option not found")

    result = supabase.table("custom_product_options").update({
        "is_active": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", option_id).execute()

    if result.data:
        return {"message": "Option deleted successfully", "id": option_id}
    raise HTTPException(status_code=400, detail="Failed to delete option")

# ========== STRUCTURES ==========

@router.get("/structures", response_model=List[CustomProductStructure])
async def get_structures(
    category_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Get all structures"""
    supabase = get_supabase_client()
    query = supabase.table("custom_product_structures").select("*").order("created_at", desc=True)

    if category_id:
        query = query.eq("category_id", category_id)
    if active_only:
        query = query.eq("is_active", True)

    result = query.execute()
    return result.data if result.data else []

@router.get("/dashboard-data")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Get all data needed for dashboard in a single request to avoid rate limiting"""
    supabase = get_supabase_client()

    try:
        # Get all active categories
        categories_result = supabase.table("custom_product_categories").select("*").eq("is_active", True).order("order_index", desc=True).execute()
        categories = categories_result.data or []

        # Get all active structures
        structures_result = supabase.table("custom_product_structures").select("*").eq("is_active", True).order("created_at", desc=True).execute()
        structures = structures_result.data or []

        # Get all active columns
        columns_result = supabase.table("custom_product_columns").select("*").eq("is_active", True).order("order_index", desc=True).execute()
        columns = columns_result.data or []

        # Group columns by category_id
        columns_by_category = {}
        for column in columns:
            category_id = column["category_id"]
            if category_id not in columns_by_category:
                columns_by_category[category_id] = []
            columns_by_category[category_id].append(column)

        # Get limited options for performance (first 50 options only)
        options_result = supabase.table("custom_product_options").select("*").eq("is_active", True).order("order_index", desc=True).limit(50).execute()
        options = options_result.data or []

        # Group options by column_id
        options_by_column = {}
        for option in options:
            column_id = option["column_id"]
            if column_id not in options_by_column:
                options_by_column[column_id] = []
            options_by_column[column_id].append(option)

        return {
            "categories": categories,
            "structures": structures,
            "columns_by_category": columns_by_category,
            "options_by_column": options_by_column
        }

    except Exception as e:
        print(f"Error in get_dashboard_data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard data: {str(e)}"
        )

@router.post("/structures", response_model=CustomProductStructure)
async def create_structure(
    structure_data: CustomProductStructureCreate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Create a new structure"""
    supabase = get_supabase_client()

    # If setting as default, unset other defaults for this category
    if structure_data.is_default:
        supabase.table("custom_product_structures").update({"is_default": False}).eq("category_id", structure_data.category_id).execute()

    data = structure_data.dict()
    data["id"] = str(uuid.uuid4())
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_product_structures").insert(data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to create structure")

@router.put("/structures/{structure_id}", response_model=CustomProductStructure)
async def update_structure(
    structure_id: str,
    structure_data: CustomProductStructureUpdate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Update a structure"""
    supabase = get_supabase_client()

    # Check if structure exists
    check_result = supabase.table("custom_product_structures").select("*").eq("id", structure_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Structure not found")

    existing_structure = check_result.data[0]

    update_data = structure_data.dict(exclude_unset=True)

    # If setting as default, unset other defaults for this category
    if update_data.get("is_default", False):
        supabase.table("custom_product_structures").update({"is_default": False}).eq("category_id", existing_structure["category_id"]).execute()

    update_data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_product_structures").update(update_data).eq("id", structure_id).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to update structure")

@router.delete("/structures/{structure_id}")
async def delete_structure(
    structure_id: str,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Soft delete a structure"""
    supabase = get_supabase_client()

    # Check if structure exists
    check_result = supabase.table("custom_product_structures").select("id").eq("id", structure_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Structure not found")

    result = supabase.table("custom_product_structures").update({
        "is_active": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", structure_id).execute()

    if result.data:
        return {"message": "Structure deleted successfully", "id": structure_id}
    raise HTTPException(status_code=400, detail="Failed to delete structure")

# ========== COMBINED PRODUCTS ==========

@router.get("/", response_model=List[CustomProduct])
async def get_combined_products(
    category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    active_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Get combined products"""
    supabase = get_supabase_client()
    query = supabase.table("custom_products").select("*").order("created_at", desc=True)

    if category_id:
        query = query.eq("category_id", category_id)
    if search:
        query = query.ilike("name", f"%{search}%")
    if active_only:
        query = query.eq("is_active", True)

    result = query.range(skip, skip + limit - 1).execute()
    return result.data if result.data else []

@router.get("/{product_id}", response_model=CustomProduct)
async def get_combined_product(
    product_id: str,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Get a specific combined product"""
    supabase = get_supabase_client()
    result = supabase.table("custom_products").select("*").eq("id", product_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return result.data[0]

@router.post("/", response_model=CustomProduct)
async def create_combined_product(
    product_data: CustomProductCreate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Create a new combined product"""
    supabase = get_supabase_client()

    data = product_data.dict()
    data["id"] = str(uuid.uuid4())
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_products").insert(data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to create combined product")

@router.put("/{product_id}", response_model=CustomProduct)
async def update_combined_product(
    product_id: str,
    product_data: CustomProductUpdate,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Update a combined product"""
    supabase = get_supabase_client()

    # Check if product exists
    check_result = supabase.table("custom_products").select("id").eq("id", product_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("custom_products").update(update_data).eq("id", product_id).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Failed to update combined product")

@router.delete("/{product_id}")
async def delete_combined_product(
    product_id: str,
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Soft delete a combined product"""
    supabase = get_supabase_client()

    # Check if product exists
    check_result = supabase.table("custom_products").select("id").eq("id", product_id).execute()
    if not check_result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    result = supabase.table("custom_products").update({
        "is_active": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", product_id).execute()

    if result.data:
        return {"message": "Product deleted successfully", "id": product_id}
    raise HTTPException(status_code=400, detail="Failed to delete product")

# ========== UTILITY ENDPOINTS ==========

@router.post("/columns/reorder")
async def reorder_columns(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Reorder columns within a category"""
    supabase = get_supabase_client()
    category_id = data.get("category_id")
    column_orders = data.get("column_orders", [])

    if not category_id or not column_orders:
        raise HTTPException(status_code=400, detail="Missing category_id or column_orders")

    # Update order_index for each column
    for i, col_data in enumerate(column_orders):
        supabase.table("custom_product_columns").update({
            "order_index": i,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", col_data["id"]).execute()

    return {"message": "Columns reordered successfully"}

@router.get("/generate-name")
async def generate_product_name(
    category_id: str,
    selected_options: Dict[str, str],  # column_id -> option_id
    structure_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user_dev_mode)
):
    """Generate product name from selected options"""
    supabase = get_supabase_client()

    # Get structure (default or specified)
    if structure_id:
        structure_result = supabase.table("custom_product_structures").select("*").eq("id", structure_id).execute()
    else:
        structure_result = supabase.table("custom_product_structures").select("*").eq("category_id", category_id).eq("is_default", True).execute()

    if not structure_result.data:
        raise HTTPException(status_code=400, detail="No structure found for category")

    structure = structure_result.data[0]
    column_order = structure["column_order"]
    separator = structure["separator"]

    # Get option names
    option_names = []
    for column_id in column_order:
        if column_id in selected_options:
            option_id = selected_options[column_id]
            option_result = supabase.table("custom_product_options").select("name").eq("id", option_id).execute()
            if option_result.data:
                option_names.append(option_result.data[0]["name"])

    generated_name = separator.join(option_names)

    return {
        "generated_name": generated_name,
        "option_names": option_names,
        "separator": separator
    }


