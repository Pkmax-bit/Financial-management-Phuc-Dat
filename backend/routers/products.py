from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from services.supabase_client import get_supabase_client
from models.user import User
from models.products_services import ProductService, ProductServiceCreate, ProductServiceUpdate
from utils.auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter()

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
