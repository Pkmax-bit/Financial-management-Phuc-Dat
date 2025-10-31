"""
Material Adjustment Service
Service để tính toán và áp dụng quy tắc điều chỉnh vật tư
"""

from typing import List, Dict, Optional, Any
from services.supabase_client import get_supabase_client

class MaterialAdjustmentService:
    """Service để tính toán điều chỉnh vật tư"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def get_applicable_rules(
        self,
        expense_object_id: str,
        dimension_type: str,
        old_value: Optional[float],
        new_value: float
    ) -> List[Dict[str, Any]]:
        """
        Lấy các quy tắc áp dụng được dựa trên thay đổi kích thước/số lượng
        
        Args:
            expense_object_id: ID đối tượng chi phí
            dimension_type: Loại kích thước (area, volume, height, length, depth, quantity)
            old_value: Giá trị cũ
            new_value: Giá trị mới
            
        Returns:
            Danh sách quy tắc áp dụng được, đã sắp xếp theo priority
        """
        try:
            # Tính toán thay đổi
            if old_value is None or old_value == 0:
                change_percentage = 0
                change_absolute = 0
            else:
                change_percentage = ((new_value - old_value) / old_value) * 100
                change_absolute = new_value - old_value
            
            # Xác định hướng thay đổi
            if change_absolute > 0:
                change_direction = 'increase'
            elif change_absolute < 0:
                change_direction = 'decrease'
            else:
                return []  # Không có thay đổi
            
            # Lấy tất cả quy tắc active cho expense_object_id và dimension_type
            result = self.supabase.table("material_adjustment_rules")\
                .select("*")\
                .eq("expense_object_id", expense_object_id)\
                .eq("dimension_type", dimension_type)\
                .eq("is_active", True)\
                .order("priority")\
                .execute()
            
            applicable_rules = []
            for rule in result.data:
                rule_change_direction = rule.get("change_direction", "increase")
                
                # Kiểm tra hướng thay đổi có khớp không
                if rule_change_direction not in ["both", change_direction]:
                    continue
                
                rule_change_type = rule.get("change_type")
                rule_change_value = float(rule.get("change_value", 0))
                
                # Kiểm tra điều kiện
                is_applicable = False
                if rule_change_type == "percentage":
                    # Kiểm tra % thay đổi
                    if abs(change_percentage) >= abs(rule_change_value):
                        is_applicable = True
                elif rule_change_type == "absolute":
                    # Kiểm tra giá trị tuyệt đối thay đổi
                    if abs(change_absolute) >= abs(rule_change_value):
                        is_applicable = True
                
                if is_applicable:
                    applicable_rules.append(rule)
            
            return applicable_rules
            
        except Exception as e:
            print(f"Error getting applicable rules: {str(e)}")
            return []
    
    def calculate_adjustment(
        self,
        original_quantity: float,
        original_unit_price: float,
        rules: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        Tính toán điều chỉnh vật tư dựa trên các quy tắc
        
        Args:
            original_quantity: Số lượng ban đầu
            original_unit_price: Đơn giá ban đầu
            rules: Danh sách quy tắc áp dụng
            
        Returns:
            Dict với adjusted_quantity và adjusted_unit_price
        """
        adjusted_quantity = original_quantity
        adjusted_unit_price = original_unit_price
        
        for rule in rules:
            adjustment_type = rule.get("adjustment_type")
            adjustment_value = float(rule.get("adjustment_value", 0))
            
            if adjustment_type == "percentage":
                # Điều chỉnh theo %
                adjustment_factor = 1 + (adjustment_value / 100)
                adjusted_quantity = adjusted_quantity * adjustment_factor
                # Có thể điều chỉnh giá hoặc số lượng tùy business logic
                # adjusted_unit_price = adjusted_unit_price * adjustment_factor
            elif adjustment_type == "absolute":
                # Điều chỉnh theo giá trị tuyệt đối
                adjusted_quantity = adjusted_quantity + adjustment_value
        
        return {
            "adjusted_quantity": max(0, adjusted_quantity),  # Đảm bảo không âm
            "adjusted_unit_price": adjusted_unit_price,
            "adjusted_total_price": adjusted_quantity * adjusted_unit_price
        }
    
    def apply_adjustments_to_components(
        self,
        components: List[Dict[str, Any]],
        dimension_changes: Dict[str, Dict[str, Optional[float]]]
    ) -> List[Dict[str, Any]]:
        """
        Áp dụng điều chỉnh cho danh sách components
        
        Args:
            components: Danh sách components với expense_object_id, quantity, unit_price, etc.
            dimension_changes: Dict với các thay đổi kích thước
                Format: {
                    "area": {"old": 10, "new": 12},
                    "volume": {"old": 5, "new": 6},
                    ...
                }
        
        Returns:
            Danh sách components đã được điều chỉnh
        """
        adjusted_components = []
        
        for component in components:
            expense_object_id = component.get("expense_object_id")
            if not expense_object_id:
                adjusted_components.append(component)
                continue
            
            original_quantity = float(component.get("quantity", 0))
            original_unit_price = float(component.get("unit_price", 0))
            
            # Lấy tất cả quy tắc áp dụng cho component này
            all_applicable_rules = []
            
            for dim_type, change_info in dimension_changes.items():
                old_val = change_info.get("old")
                new_val = change_info.get("new")
                
                if new_val is None:
                    continue
                
                applicable_rules = self.get_applicable_rules(
                    expense_object_id,
                    dim_type,
                    old_val,
                    new_val
                )
                all_applicable_rules.extend(applicable_rules)
            
            # Tính toán điều chỉnh
            if all_applicable_rules:
                adjustment_result = self.calculate_adjustment(
                    original_quantity,
                    original_unit_price,
                    all_applicable_rules
                )
                
                adjusted_component = component.copy()
                adjusted_component["quantity"] = adjustment_result["adjusted_quantity"]
                adjusted_component["unit_price"] = adjustment_result["adjusted_unit_price"]
                adjusted_component["total_price"] = adjustment_result["adjusted_total_price"]
                adjusted_components.append(adjusted_component)
            else:
                # Không có quy tắc nào áp dụng, giữ nguyên
                adjusted_components.append(component)
        
        return adjusted_components

