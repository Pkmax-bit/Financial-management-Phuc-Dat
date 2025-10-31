"""
Material Adjustment Rule Models
Models cho quy tắc điều chỉnh vật tư khi thay đổi kích thước/số lượng
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class DimensionType(str, Enum):
    """Loại kích thước"""
    AREA = "area"
    VOLUME = "volume"
    HEIGHT = "height"
    LENGTH = "length"
    DEPTH = "depth"
    QUANTITY = "quantity"

class ChangeType(str, Enum):
    """Loại thay đổi"""
    PERCENTAGE = "percentage"
    ABSOLUTE = "absolute"

class ChangeDirection(str, Enum):
    """Hướng thay đổi"""
    INCREASE = "increase"
    DECREASE = "decrease"
    BOTH = "both"

class AdjustmentType(str, Enum):
    """Loại điều chỉnh"""
    PERCENTAGE = "percentage"
    ABSOLUTE = "absolute"

class MaterialAdjustmentRuleBase(BaseModel):
    """Base model cho quy tắc điều chỉnh vật tư"""
    expense_object_id: str = Field(..., description="ID đối tượng chi phí áp dụng")
    dimension_type: DimensionType = Field(..., description="Loại kích thước: area, volume, height, length, depth, quantity")
    change_type: ChangeType = Field(..., description="Loại thay đổi: percentage hoặc absolute")
    change_value: float = Field(..., description="Giá trị ngưỡng thay đổi")
    change_direction: ChangeDirection = Field(ChangeDirection.INCREASE, description="Hướng thay đổi: increase, decrease, both")
    adjustment_type: AdjustmentType = Field(..., description="Loại điều chỉnh: percentage hoặc absolute")
    adjustment_value: float = Field(..., description="Giá trị điều chỉnh (có thể âm để giảm)")
    priority: int = Field(100, description="Độ ưu tiên (số nhỏ hơn = ưu tiên cao hơn)")
    name: Optional[str] = Field(None, description="Tên quy tắc")
    description: Optional[str] = Field(None, description="Mô tả quy tắc")
    is_active: bool = Field(True, description="Trạng thái hoạt động")

class MaterialAdjustmentRuleCreate(MaterialAdjustmentRuleBase):
    """Model để tạo quy tắc mới"""
    pass

class MaterialAdjustmentRuleUpdate(BaseModel):
    """Model để cập nhật quy tắc"""
    expense_object_id: Optional[str] = None
    dimension_type: Optional[DimensionType] = None
    change_type: Optional[ChangeType] = None
    change_value: Optional[float] = None
    change_direction: Optional[ChangeDirection] = None
    adjustment_type: Optional[AdjustmentType] = None
    adjustment_value: Optional[float] = None
    priority: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class MaterialAdjustmentRule(MaterialAdjustmentRuleBase):
    """Model đầy đủ cho quy tắc điều chỉnh vật tư"""
    id: str = Field(..., description="ID quy tắc")
    created_at: datetime = Field(..., description="Thời gian tạo")
    updated_at: datetime = Field(..., description="Thời gian cập nhật")
    created_by: Optional[str] = Field(None, description="ID người tạo")

    class Config:
        from_attributes = True

