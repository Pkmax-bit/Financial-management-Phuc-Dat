"""
Test API hóa đơn cho dự án/khách hàng liên quan tới "(Chị) Nhi - Quận 3"
Sử dụng backend production: https://financial-management-backend-3m78.onrender.com/api
"""

import requests
import json

BASE_URL = "https://financial-management-backend-3m78.onrender.com/api"


def find_target_invoice(invoices):
    """
    Tìm hóa đơn có 'Chi', 'Nhi' hoặc 'Quận 3' trong tên khách hàng hoặc dự án
    """
    for invoice in invoices:
        customer_name = ""
        project_name = ""

        # Tùy backend trả về, thử nhiều trường an toàn
        customer = invoice.get("customer") or {}
        project = invoice.get("project") or {}

        customer_name = str(customer.get("name", "") or "")
        project_name = str(project.get("name", "") or "")

        if any(key in customer_name for key in ["Chi", "Chị", "Nhi", "Quận 3"]):
            return invoice
        if any(key in project_name for key in ["Chi", "Chị", "Nhi", "Quận 3"]):
            return invoice

    return None


def extract_items_from_invoice(invoice_detail):
    """
    Backend có thể lưu dòng hàng trong các field khác nhau, nên thử lần lượt.
    """
    items = invoice_detail.get("product_components") or []
    if not items:
        items = invoice_detail.get("items") or []
    if not items:
        items = invoice_detail.get("invoice_items") or []

    return items


def test_invoice_api():
    print("=" * 80)
    print('Testing Invoice API - tìm hóa đơn liên quan "(Chị) Nhi - Quận 3"')
    print("=" * 80)

    # 1. Lấy danh sách hóa đơn
    print("\n1. Getting all invoices...")
    try:
        response = requests.get(f"{BASE_URL}/sales/invoices")
        response.raise_for_status()
        invoices = response.json()

        if isinstance(invoices, dict):
            # Phòng trường hợp API trả về {"invoices": [...]}
            invoices_list = invoices.get("invoices", [])
        else:
            invoices_list = invoices

        print(f"✓ Total invoices: {len(invoices_list)}")

        # 2. Tìm hóa đơn liên quan '(Chị) Nhi - Quận 3'
        target_invoice = find_target_invoice(invoices_list)

        if not target_invoice:
            print('\n⚠ Không tìm thấy hóa đơn nào có "Chi/Chị/Nhi/Quận 3" trong tên khách hàng hoặc dự án')
            print("\nFirst 3 invoices for reference:")
            for i, inv in enumerate(invoices_list[:3], 1):
                customer = inv.get("customer") or {}
                project = inv.get("project") or {}
                print(
                    f"  {i}. ID: {inv.get('id')}, "
                    f"Customer: {customer.get('name', 'N/A')}, "
                    f"Project: {project.get('name', 'N/A')}"
                )
            return

        invoice_id = target_invoice.get("id")
        customer = target_invoice.get("customer") or {}
        project = target_invoice.get("project") or {}

        print(f"\n✓ Found invoice with ID: {invoice_id}")
        print(f"  Customer: {customer.get('name', 'N/A')}")
        print(f"  Project: {project.get('name', 'N/A')}")
        print(f"  Status: {target_invoice.get('status', 'N/A')}")
        print(f"  Payment status: {target_invoice.get('payment_status', 'N/A')}")
        print(f"  Total amount: {target_invoice.get('total_amount', 0)}")

        # 3. Lấy chi tiết hóa đơn theo ID
        print(f"\n2. Getting invoice details by ID: {invoice_id}...")
        try:
            detail_response = requests.get(f"{BASE_URL}/sales/invoices/{invoice_id}")
            detail_response.raise_for_status()
            invoice_detail = detail_response.json()

            print("✓ Invoice detail retrieved successfully")
            print(f"  ID: {invoice_detail.get('id')}")
            print(f"  Status: {invoice_detail.get('status')}")
            print(f"  Payment status: {invoice_detail.get('payment_status')}")
            print(f"  Total amount: {invoice_detail.get('total_amount', 0)}")

            # 4. Kiểm tra dòng hàng / sản phẩm của hóa đơn
            items = extract_items_from_invoice(invoice_detail)
            print(f"  Items count: {len(items)}")

            if items:
                print("\n  Items details (first 5):")
                for i, item in enumerate(items[:5], 1):
                    # Thử lấy các tên field phổ biến
                    name = (
                        item.get("product_name")
                        or item.get("description")
                        or item.get("name")
                        or "N/A"
                    )
                    quantity = item.get("quantity", item.get("qty", 0))
                    unit_price = (
                        item.get("unit_price")
                        or item.get("price")
                        or item.get("unitPrice")
                        or 0
                    )
                    total = (
                        item.get("total")
                        or item.get("total_price")
                        or item.get("line_total")
                        or 0
                    )
                    print(
                        f"    {i}. {name} - Qty: {quantity} - Unit price: {unit_price} - Total: {total}"
                    )

                if len(items) > 5:
                    print(f"    ... and {len(items) - 5} more items")
            else:
                print("  ⚠ No items found in invoice")

            # 5. In lại customer & project chi tiết
            customer = invoice_detail.get("customer") or {}
            project = invoice_detail.get("project") or {}

            if customer:
                print("\n  Customer:")
                print(f"    Name: {customer.get('name', 'N/A')}")
                print(f"    ID: {customer.get('id', 'N/A')}")
            else:
                print("  ⚠ No customer data")

            if project:
                print("\n  Project:")
                print(f"    Name: {project.get('name', 'N/A')}")
                print(f"    ID: {project.get('id', 'N/A')}")
            else:
                print("  ⚠ No project data")

            # 6. Full JSON (debug)
            print("\n3. Full JSON response:")
            print(json.dumps(invoice_detail, indent=2, ensure_ascii=False))

        except requests.exceptions.HTTPError as e:
            print(f"✗ Error getting invoice detail: {e}")
            print(f"  Response: {detail_response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")

    except requests.exceptions.HTTPError as e:
        print(f"✗ HTTP Error: {e}")
        print(f"  Response: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")


if __name__ == "__main__":
    test_invoice_api()


