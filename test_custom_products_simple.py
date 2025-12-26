#!/usr/bin/env python3
"""
Simple Test Script for Custom Product Functionality
Based on TEST_CUSTOM_PRODUCT_SCRIPT_VI.md
"""

import requests
import json
import uuid
from datetime import datetime

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
            "errors": []
        }

    def authenticate(self, email="admin@test.com", password="123456"):
        """Authenticate and get token"""
        try:
            url = f"{self.base_url}/api/auth/login"
            payload = {
                "email": email,
                "password": password
            }

            response = self.session.post(url, json=payload)

            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.log_result("Authentication", True, f"Successfully authenticated as {email}")
                return True
            else:
                self.log_result("Authentication", False, f"Failed to authenticate: {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Authentication", False, f"Authentication exception: {str(e)}")
            return False

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
                print(f"   Response: {response.status_code}")
            self.results["errors"].append({
                "test": test_name,
                "message": message,
                "response": response.text if response else None
            })

    def test_api_connection(self):
        """Test basic API connection"""
        try:
            url = f"{self.base_url}/api/custom-products/categories"
            response = self.session.get(url, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.log_result("API Connection", True, f"Connected successfully, found {len(data)} categories")
                return True
            else:
                self.log_result("API Connection", False, f"Connection failed with status {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("API Connection", False, f"Exception: {str(e)}")
            return False

    def test_create_category(self):
        """Test creating a new category"""
        try:
            url = f"{self.base_url}/api/custom-products/categories"
            payload = {
                "name": "Furniture",
                "description": "Furniture products category"
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["categories"].append(data)
                self.log_result("Create Category", True, f"Created category '{data['name']}' with ID: {data['id']}")
                return data
            else:
                self.log_result("Create Category", False, f"Failed to create category", response)
                return None
        except Exception as e:
            self.log_result("Create Category", False, f"Exception: {str(e)}")
            return None

    def test_create_column(self, category_id):
        """Test creating a column (attribute)"""
        try:
            url = f"{self.base_url}/api/custom-products/columns"
            payload = {
                "category_id": category_id,
                "name": "Material",
                "description": "Product material type"
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["columns"].append(data)
                self.log_result("Create Column", True, f"Created column '{data['name']}' for category {category_id}")
                return data
            else:
                self.log_result("Create Column", False, f"Failed to create column", response)
                return None
        except Exception as e:
            self.log_result("Create Column", False, f"Exception: {str(e)}")
            return None

    def test_create_option(self, column_id):
        """Test creating an option with pricing and dimensions"""
        try:
            url = f"{self.base_url}/api/custom-products/options"
            payload = {
                "column_id": column_id,
                "name": "Oak Wood",
                "description": "Premium oak wood material",
                "unit_price": 500000,
                "unit": "piece",
                "width": 120.0,
                "height": 80.0,
                "depth": 60.0,
                "has_dimensions": True
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["options"].append(data)
                self.log_result("Create Option", True, f"Created option '{data['name']}' with price {data['unit_price']:,}")
                return data
            else:
                self.log_result("Create Option", False, f"Failed to create option", response)
                return None
        except Exception as e:
            self.log_result("Create Option", False, f"Exception: {str(e)}")
            return None

    def test_create_structure(self, category_id):
        """Test creating a product structure"""
        if not self.test_data["columns"]:
            self.log_result("Create Structure", False, "No columns available to create structure")
            return None

        column_ids = [col["id"] for col in self.test_data["columns"]]

        try:
            url = f"{self.base_url}/api/custom-products/structures"
            payload = {
                "category_id": category_id,
                "name": "Desk Structure",
                "description": "Structure for desk products",
                "column_order": column_ids,
                "separator": " ",
                "is_default": True
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["structures"].append(data)
                self.log_result("Create Structure", True, f"Created structure with {len(column_ids)} columns")
                return data
            else:
                self.log_result("Create Structure", False, f"Failed to create structure", response)
                return None
        except Exception as e:
            self.log_result("Create Structure", False, f"Exception: {str(e)}")
            return None

    def test_generate_product_name(self, category_id, selected_options):
        """Test generating product name from selected options"""
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
                self.log_result("Generate Product Name", True, f"Generated name: '{generated_name}'")
                return data
            else:
                self.log_result("Generate Product Name", False, "Failed to generate product name", response)
                return None
        except Exception as e:
            self.log_result("Generate Product Name", False, f"Exception: {str(e)}")
            return None

    def test_create_product(self, category_id, name, column_options):
        """Test creating a complete custom product"""
        try:
            # Calculate total price
            total_price = 0
            for option_id in column_options.values():
                option = next((opt for opt in self.test_data["options"] if opt["id"] == option_id), None)
                if option and option.get("unit_price"):
                    total_price += option["unit_price"]

            total_amount = total_price

            url = f"{self.base_url}/api/custom-products/"
            payload = {
                "category_id": category_id,
                "name": name,
                "description": f"Custom product: {name}",
                "column_options": column_options,
                "total_price": total_price,
                "quantity": 1,
                "total_amount": total_amount
            }

            response = self.session.post(url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                data = response.json()
                self.test_data["products"].append(data)
                self.log_result("Create Product", True, f"Created product '{name}' with total price {total_amount:,}")
                return data
            else:
                self.log_result("Create Product", False, f"Failed to create product '{name}'", response)
                return None
        except Exception as e:
            self.log_result("Create Product", False, f"Exception: {str(e)}")
            return None

    def run_basic_test_suite(self):
        """Run basic test suite"""
        print("STARTING CUSTOM PRODUCT TESTS")
        print("=" * 50)

        # Test 1: Authentication
        if not self.authenticate():
            print("Cannot authenticate. Aborting tests.")
            return

        # Test 2: API Connection
        if not self.test_api_connection():
            print("Cannot connect to API. Aborting tests.")
            return

        # Test 2: Create Category
        category = self.test_create_category()
        if not category:
            print("Cannot create category. Aborting tests.")
            return

        category_id = category["id"]

        # Test 3: Create Columns
        print("\n--- Creating Columns ---")
        columns_to_create = ["Material", "Color", "Size"]
        for col_name in columns_to_create:
            column = self.test_create_column(category_id)
            if column:
                # Update the name for variety
                column["name"] = col_name
                self.test_data["columns"][-1]["name"] = col_name

        # Test 4: Create Options
        print("\n--- Creating Options ---")
        for column in self.test_data["columns"]:
            if column["name"] == "Material":
                options = ["Oak Wood", "Pine Wood", "Steel"]
                prices = [500000, 300000, 800000]
            elif column["name"] == "Color":
                options = ["Natural Brown", "Black", "White"]
                prices = [100000, 150000, 120000]
            else:  # Size
                options = ["120x80x60", "150x90x75", "180x100x90"]
                prices = [0, 200000, 400000]

            for i, opt_name in enumerate(options):
                # Create option
                option_data = {
                    "column_id": column["id"],
                    "name": opt_name,
                    "unit_price": prices[i],
                    "unit": "piece"
                }

                if column["name"] == "Size" and i == 0:
                    option_data.update({
                        "width": 120.0, "height": 80.0, "depth": 60.0, "has_dimensions": True
                    })

                try:
                    url = f"{self.base_url}/api/custom-products/options"
                    response = self.session.post(url, json=option_data, headers=self.get_headers())

                    if response.status_code == 200:
                        data = response.json()
                        self.test_data["options"].append(data)
                        self.log_result(f"Create {column['name']} Option", True, f"Created '{opt_name}'")
                    else:
                        self.log_result(f"Create {column['name']} Option", False, f"Failed to create '{opt_name}'", response)
                except Exception as e:
                    self.log_result(f"Create {column['name']} Option", False, f"Exception: {str(e)}")

        # Test 5: Create Structure
        print("\n--- Creating Structure ---")
        structure = self.test_create_structure(category_id)

        # Test 6: Generate Product Name and Create Product
        print("\n--- Creating Product ---")
        if len(self.test_data["columns"]) >= 3 and len(self.test_data["options"]) >= 3:
            # Create selected options mapping
            selected_options = {}
            for i, column in enumerate(self.test_data["columns"][:3]):
                options_for_column = [opt for opt in self.test_data["options"] if opt["column_id"] == column["id"]]
                if options_for_column:
                    selected_options[column["id"]] = options_for_column[0]["id"]

            # Generate name
            name_result = self.test_generate_product_name(category_id, selected_options)

            # Create product
            if name_result:
                product_name = name_result.get("generated_name", "Custom Desk")
                product = self.test_create_product(category_id, product_name, selected_options)

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 50)
        print("TEST RESULTS SUMMARY")
        print("=" * 50)

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
            for error in self.results["errors"][:5]:  # Show first 5 errors
                print(f"   - {error['test']}: {error['message']}")

        print("\nCONCLUSION:")
        if success_rate >= 90:
            print("   [SUCCESS] System working well!")
        elif success_rate >= 75:
            print("   [WARNING] System working basically. Some functions need checking.")
        else:
            print("   [ERROR] System has many errors. Needs fixing before use.")


def main():
    # You can add authentication token if needed
    auth_token = None

    tester = CustomProductTester(auth_token=auth_token)
    tester.run_basic_test_suite()


if __name__ == "__main__":
    main()
