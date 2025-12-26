#!/usr/bin/env python3
"""
Comprehensive Test Script for Custom Product Functionality
Based on TEST_CUSTOM_PRODUCT_SCRIPT_VI.md
"""

import requests
import json
import uuid
from datetime import datetime
import time

class CustomProductTester:
    def __init__(self, base_url="http://localhost:8000", auth_token=None):
        self.base_url = base_url
        self.auth_token = auth_token
        self.session = requests.Session()

        # Test data storage
        self.test_data = {
            "categories": [],
            "columns": [],
            "options": [],
            "structures": [],
            "products": []
        }

        # Test results
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": [],
            "warnings": []
        }

    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    def log_result(self, test_name, success, message="", response=None):
        if success:
            self.results["passed"] += 1
            print(f"[PASS] {test_name}: {message}")
        else:
            self.results["failed"] += 1
            print(f"[FAIL] {test_name}: {message}")
            if response:
                print(f"   Response: {response.status_code} - {response.text}")
            self.results["errors"].append({
                "test": test_name,
                "message": message,
                "response": response.text if response else None
            })

    def test_get_categories(self):
        """Test 1.1: Lấy danh sách categories"""
        try:
            url = f"{self.base_url}/api/custom-products/categories"
            response = self.session.get(url, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.log_result("Test 1.1 - Get Categories", True, f"Retrieved {len(data)} categories")
                return data
            else:
                self.log_result("Test 1.1 - Get Categories", False, f"Failed with status {response.status_code}", response)
                return []
        except Exception as e:
            self.log_result("Test 1.1 - Get Categories", False, f"Exception: {str(e)}")
            return []

    def test_create_category(self, name="Nội thất", description="Danh mục sản phẩm nội thất"):
        """Test 1.2: Tạo category mới"""
        try:
            url = f"{self.base_url}/api/custom-products/categories"
            payload = {
                "name": name,
                "description": description
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["categories"].append(data)
                self.log_result("Test 1.2 - Create Category", True, f"Created category '{name}' with ID: {data['id']}")
                return data
            else:
                self.log_result("Test 1.2 - Create Category", False, f"Failed to create category '{name}'", response)
                return None
        except Exception as e:
            self.log_result("Test 1.2 - Create Category", False, f"Exception: {str(e)}")
            return None

    def test_create_column(self, category_id, name="Chất liệu khung", description="Loại chất liệu cho khung sản phẩm"):
        """Test 1.3: Tạo column (thuộc tính) mới"""
        try:
            url = f"{self.base_url}/api/custom-products/columns"
            payload = {
                "category_id": category_id,
                "name": name,
                "description": description
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["columns"].append(data)
                self.log_result("Test 1.3 - Create Column", True, f"Created column '{name}' for category {category_id}")
                return data
            else:
                self.log_result("Test 1.3 - Create Column", False, f"Failed to create column '{name}'", response)
                return None
        except Exception as e:
            self.log_result("Test 1.3 - Create Column", False, f"Exception: {str(e)}")
            return None

    def test_create_option(self, column_id, name="Gỗ sồi", unit_price=500000, unit="cái", width=120.0, height=80.0, depth=60.0):
        """Test 1.4: Tạo option (tùy chọn) với giá và kích thước"""
        try:
            url = f"{self.base_url}/api/custom-products/options"
            payload = {
                "column_id": column_id,
                "name": name,
                "description": f"Tùy chọn {name}",
                "unit_price": unit_price,
                "unit": unit,
                "width": width,
                "height": height,
                "depth": depth,
                "has_dimensions": True
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["options"].append(data)
                self.log_result("Test 1.4 - Create Option", True, f"Created option '{name}' with price {unit_price:,} VND")
                return data
            else:
                self.log_result("Test 1.4 - Create Option", False, f"Failed to create option '{name}'", response)
                return None
        except Exception as e:
            self.log_result("Test 1.4 - Create Option", False, f"Exception: {str(e)}")
            return None

    def test_get_columns_by_category(self, category_id):
        """Test 1.5: Lấy danh sách columns theo category"""
        try:
            url = f"{self.base_url}/api/custom-products/categories/{category_id}/columns"
            response = self.session.get(url, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.log_result("Test 1.5 - Get Columns by Category", True, f"Retrieved {len(data)} columns for category {category_id}")
                return data
            else:
                self.log_result("Test 1.5 - Get Columns by Category", False, f"Failed to get columns for category {category_id}", response)
                return []
        except Exception as e:
            self.log_result("Test 1.5 - Get Columns by Category", False, f"Exception: {str(e)}")
            return []

    def test_get_options_by_column(self, column_id):
        """Test 1.6: Lấy danh sách options theo column"""
        try:
            url = f"{self.base_url}/api/custom-products/options?column_id={column_id}"
            response = self.session.get(url, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.log_result("Test 1.6 - Get Options by Column", True, f"Retrieved {len(data)} options for column {column_id}")
                return data
            else:
                self.log_result("Test 1.6 - Get Options by Column", False, f"Failed to get options for column {column_id}", response)
                return []
        except Exception as e:
            self.log_result("Test 1.6 - Get Options by Column", False, f"Exception: {str(e)}")
            return []

    def test_create_structure(self, category_id, name="Cấu trúc Bàn làm việc", column_order=None):
        """Test 2.1: Tạo cấu trúc sản phẩm"""
        if not column_order:
            # Get column IDs from test data
            column_ids = [col["id"] for col in self.test_data["columns"] if col["category_id"] == category_id]
            column_order = column_ids

        try:
            url = f"{self.base_url}/api/custom-products/structures"
            payload = {
                "category_id": category_id,
                "name": name,
                "description": f"Cấu trúc cho {name}",
                "column_order": column_order,
                "separator": " ",
                "is_default": True
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["structures"].append(data)
                self.log_result("Test 2.1 - Create Structure", True, f"Created structure '{name}' with {len(column_order)} columns")
                return data
            else:
                self.log_result("Test 2.1 - Create Structure", False, f"Failed to create structure '{name}'", response)
                return None
        except Exception as e:
            self.log_result("Test 2.1 - Create Structure", False, f"Exception: {str(e)}")
            return None

    def test_generate_product_name(self, category_id, selected_options):
        """Test 2.2: Tạo tên sản phẩm từ các tùy chọn đã chọn"""
        try:
            url = f"{self.base_url}/api/custom-products/generate-name"
            params = {
                "category_id": category_id,
                "selected_options": json.dumps(selected_options)
            }

            response = self.session.get(url, params=params, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                generated_name = data.get("generated_name", "")
                self.log_result("Test 2.2 - Generate Product Name", True, f"Generated name: '{generated_name}'")
                return data
            else:
                self.log_result("Test 2.2 - Generate Product Name", False, "Failed to generate product name", response)
                return None
        except Exception as e:
            self.log_result("Test 2.2 - Generate Product Name", False, f"Exception: {str(e)}")
            return None

    def test_create_custom_product(self, category_id, name, column_options, quantity=1):
        """Test 2.3: Tạo sản phẩm tùy chỉnh hoàn chỉnh"""
        try:
            # Calculate total price from selected options
            total_price = 0
            for column_id, option_id in column_options.items():
                # Find option price
                option = next((opt for opt in self.test_data["options"] if opt["id"] == option_id), None)
                if option and option.get("unit_price"):
                    total_price += option["unit_price"]

            total_amount = total_price * quantity

            url = f"{self.base_url}/api/custom-products/"
            payload = {
                "category_id": category_id,
                "name": name,
                "description": f"Sản phẩm tùy chỉnh: {name}",
                "column_options": column_options,
                "total_price": total_price,
                "quantity": quantity,
                "total_amount": total_amount
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["products"].append(data)
                self.log_result("Test 2.3 - Create Custom Product", True, f"Created product '{name}' with total price {total_amount:,} VND")
                return data
            else:
                self.log_result("Test 2.3 - Create Custom Product", False, f"Failed to create product '{name}'", response)
                return None
        except Exception as e:
            self.log_result("Test 2.3 - Create Custom Product", False, f"Exception: {str(e)}")
            return None

    def test_get_combined_products(self, category_id=None):
        """Test 2.4: Lấy danh sách sản phẩm đã tạo"""
        try:
            url = f"{self.base_url}/api/custom-products/"
            params = {}
            if category_id:
                params["category_id"] = category_id

            response = self.session.get(url, params=params, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.log_result("Test 2.4 - Get Combined Products", True, f"Retrieved {len(data)} products")
                return data
            else:
                self.log_result("Test 2.4 - Get Combined Products", False, "Failed to get products", response)
                return []
        except Exception as e:
            self.log_result("Test 2.4 - Get Combined Products", False, f"Exception: {str(e)}")
            return []

    def test_edge_cases(self):
        """Test 3: Cac truong hop loi va edge cases"""
        print("\n--- Testing Edge Cases ---")

        # Test empty name for category
        try:
            url = f"{self.base_url}/api/custom-products/categories"
            payload = {"name": "", "description": "Test empty name"}
            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 422:  # Validation error
                self.log_result("Edge Case - Empty Category Name", True, "Properly rejected empty category name")
            else:
                self.log_result("Edge Case - Empty Category Name", False, f"Unexpected response: {response.status_code}")
        except Exception as e:
            self.log_result("Edge Case - Empty Category Name", False, f"Exception: {str(e)}")

        # Test zero price option
        if self.test_data["columns"]:
            column_id = self.test_data["columns"][0]["id"]
            try:
                url = f"{self.base_url}/api/custom-products/options"
                payload = {
                    "column_id": column_id,
                    "name": "Miễn phí",
                    "description": "Tùy chọn miễn phí",
                    "unit_price": 0,
                    "unit": "cái"
                }
                response = self.session.post(url, json=payload, headers=self.get_headers())

                if response.status_code == 200:
                    self.log_result("Edge Case - Zero Price Option", True, "Successfully created zero-price option")
                else:
                    self.log_result("Edge Case - Zero Price Option", False, f"Failed to create zero-price option: {response.status_code}")
            except Exception as e:
                self.log_result("Edge Case - Zero Price Option", False, f"Exception: {str(e)}")

    def run_full_test_suite(self):
        """Chạy toàn bộ test suite"""
        print(">>> BAT DAU KIEM TRA TINH NANG SAN PHAM TUY CHINH")
        print("=" * 60)

        # Phase 1: Cấu hình cơ bản
        print("\n--- Phase 1: Cấu hình Thuộc tính ---")

        # 1. Lấy danh sách categories hiện có
        categories = self.test_get_categories()

        # 2. Tạo category mới nếu chưa có
        if not categories:
            category = self.test_create_category("Nội thất", "Danh mục sản phẩm nội thất")
        else:
            category = categories[0]
            self.test_data["categories"].append(category)
            print(f"[INFO] Su dung category hien co: {category['name']} (ID: {category['id']})")

        if not category:
            print("[ERROR] Khong the tiep tuc test do khong co category")
            return

        category_id = category["id"]

        # 3. Tạo columns (thuộc tính)
        columns_to_create = [
            {"name": "Chất liệu khung", "desc": "Loại chất liệu cho khung sản phẩm"},
            {"name": "Màu sắc bề mặt", "desc": "Màu sắc hoàn thiện bề mặt"},
            {"name": "Kích thước chuẩn", "desc": "Kích thước tiêu chuẩn của sản phẩm"}
        ]

        created_columns = []
        for col_data in columns_to_create:
            column = self.test_create_column(category_id, col_data["name"], col_data["desc"])
            if column:
                created_columns.append(column)

        # 4. Tạo options cho từng column
        print("\n--- Phase 2: Thêm Tùy chọn ---")

        for i, column in enumerate(created_columns):
            if i == 0:  # Chất liệu khung
                options_data = [
                    {"name": "Gỗ sồi", "price": 500000, "width": 120, "height": 80, "depth": 60},
                    {"name": "Gỗ thông", "price": 300000, "width": 120, "height": 80, "depth": 60},
                    {"name": "Inox 304", "price": 800000, "width": 120, "height": 80, "depth": 60}
                ]
            elif i == 1:  # Màu sắc bề mặt
                options_data = [
                    {"name": "Nâu tự nhiên", "price": 100000, "width": None, "height": None, "depth": None},
                    {"name": "Đen bóng", "price": 150000, "width": None, "height": None, "depth": None},
                    {"name": "Trắng kem", "price": 120000, "width": None, "height": None, "depth": None}
                ]
            else:  # Kích thước chuẩn
                options_data = [
                    {"name": "120x80x60 cm", "price": 0, "width": 120, "height": 80, "depth": 60},
                    {"name": "150x90x75 cm", "price": 200000, "width": 150, "height": 90, "depth": 75},
                    {"name": "180x100x90 cm", "price": 400000, "width": 180, "height": 100, "depth": 90}
                ]

            for opt_data in options_data:
                self.test_create_option(
                    column["id"],
                    opt_data["name"],
                    opt_data["price"],
                    "cái",
                    opt_data["width"],
                    opt_data["height"],
                    opt_data["depth"]
                )

        # Phase 3: Tạo cấu trúc sản phẩm
        print("\n--- Phase 3: Tạo Cấu trúc Sản phẩm ---")

        # Lấy columns đã tạo
        columns = self.test_get_columns_by_category(category_id)
        if columns:
            column_ids = [col["id"] for col in columns]
            structure = self.test_create_structure(category_id, "Cấu trúc Bàn làm việc", column_ids)

        # Phase 4: Test quy trình tạo sản phẩm
        print("\n--- Phase 4: Quy trình Tạo Sản phẩm ---")

        if len(self.test_data["columns"]) >= 3 and len(self.test_data["options"]) >= 3:
            # Tạo selected options (một option từ mỗi column)
            selected_options = {}
            for i, column in enumerate(self.test_data["columns"][:3]):  # Lấy 3 columns đầu
                options_for_column = [opt for opt in self.test_data["options"] if opt["column_id"] == column["id"]]
                if options_for_column:
                    selected_options[column["id"]] = options_for_column[0]["id"]  # Chọn option đầu tiên

            # Test tạo tên sản phẩm
            name_result = self.test_generate_product_name(category_id, selected_options)

            # Tạo sản phẩm hoàn chỉnh
            if name_result:
                product_name = name_result.get("generated_name", "Sản phẩm tùy chỉnh")
                product = self.test_create_custom_product(category_id, product_name, selected_options, 1)

        # Phase 5: Kiểm tra kết quả
        print("\n--- Phase 5: Kiểm tra Kết quả ---")

        # Lấy danh sách sản phẩm
        products = self.test_get_combined_products(category_id)

        # Test edge cases
        self.test_edge_cases()

        # Summary
        self.print_summary()

    def print_summary(self):
        """In kết quả tổng hợp"""
        print("\n" + "=" * 60)
        print("KET QUA KIEM TRA TONG QUAN")
        print("=" * 60)

        total_tests = self.results["passed"] + self.results["failed"]
        success_rate = (self.results["passed"] / total_tests * 100) if total_tests > 0 else 0

        print(f"[PASS] Tests Passed: {self.results['passed']}")
        print(f"[FAIL] Tests Failed: {self.results['failed']}")
        print(f"[RATE] Success Rate: {success_rate:.1f}%")

        print(f"\nTest Data Created:")
        print(f"   - Categories: {len(self.test_data['categories'])}")
        print(f"   - Columns: {len(self.test_data['columns'])}")
        print(f"   - Options: {len(self.test_data['options'])}")
        print(f"   - Structures: {len(self.test_data['structures'])}")
        print(f"   - Products: {len(self.test_data['products'])}")

        if self.results["errors"]:
            print(f"\nErrors ({len(self.results['errors'])}):")
            for error in self.results["errors"]:
                print(f"   - {error['test']}: {error['message']}")

        print("\nKET LUAN:")
        if success_rate >= 90:
            print("   [SUCCESS] He thong hoat dong tot! San sang su dung.")
        elif success_rate >= 75:
            print("   [WARNING] He thong hoat dong co ban. Can kiem tra lai mot so chuc nang.")
        else:
            print("   [ERROR] He thong co nhieu loi. Can sua chua truoc khi su dung.")

        # Save results to file
        result_file = f"test_custom_products_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "results": self.results,
                "test_data": self.test_data
            }, f, ensure_ascii=False, indent=2)

        print(f"\nKet qua chi tiet da luu vao: {result_file}")


def main():
    # Có thể thêm authentication token nếu cần
    auth_token = None  # Thay bằng token thực tế nếu cần authentication

    tester = CustomProductTester(auth_token=auth_token)
    tester.run_full_test_suite()


if __name__ == "__main__":
    main()
