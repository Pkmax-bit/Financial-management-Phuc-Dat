"""
Expense Object Models
Models cho đối tượng chi phí
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ExpenseObjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Tên đối tượng chi phí")
    description: Optional[str] = Field(None, description="Mô tả đối tượng chi phí")
    parent_id: Optional[str] = Field(None, description="ID đối tượng cha")
    level: Optional[int] = Field(None, description="Cấp độ của đối tượng chi phí (1=cha, 2=con, 3=con con...)")

class ExpenseObjectCreate(ExpenseObjectBase):
    role: Optional[str] = Field(None, description="Role được chọn cho đối tượng chi phí")

class ExpenseObjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Tên đối tượng chi phí")
    description: Optional[str] = Field(None, description="Mô tả đối tượng chi phí")
    is_active: Optional[bool] = Field(None, description="Trạng thái hoạt động")
    parent_id: Optional[str] = Field(None, description="ID đối tượng cha")
    level: Optional[int] = Field(None, description="Cấp độ của đối tượng chi phí (1=cha, 2=con, 3=con con...)")
    role: Optional[str] = Field(None, description="Role được chọn cho đối tượng chi phí")

class ExpenseObject(ExpenseObjectBase):
    id: str = Field(..., description="ID đối tượng chi phí")
    is_active: bool = Field(..., description="Trạng thái hoạt động")
    created_at: datetime = Field(..., description="Thời gian tạo")
    updated_at: datetime = Field(..., description="Thời gian cập nhật")
    created_by: Optional[str] = Field(None, description="ID người tạo")
    updated_by: Optional[str] = Field(None, description="ID người cập nhật")
    role: Optional[str] = Field(None, description="Role của user tạo đối tượng chi phí")
    level: Optional[int] = Field(None, description="Cấp độ của đối tượng chi phí (1=cha, 2=con, 3=con con...)")

    class Config:
        from_attributes = True
