#!/usr/bin/env python3
"""
Test script to verify dimensions data flow from database to frontend
"""

from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get Supabase client"""
    url = "https://mfmijckzlhevduwfigkl.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E"
    
    return create_client(url, key)

def test_products_with_dimensions():
    """Test products with dimensions data"""
    try:
        supabase = get_supabase_client()
        
        print("🔍 Testing products with dimensions...")
        
        # Get products with dimensions
        result = supabase.table('products').select('''
          id,
          name,
          price,
          unit,
          description,
          area,
          volume,
          height,
          length,
          depth,
          product_categories:category_id(name)
        ''').eq('is_active', True).limit(10).execute()
        
        if result.data:
            print(f"✅ Found {len(result.data)} products")
            
            for product in result.data:
                print(f"\n📦 Product: {product['name']}")
                print(f"   💰 Price: {product['price']}")
                print(f"   📏 Dimensions:")
                print(f"      📐 Area: {product['area']} m²" if product['area'] else "      📐 Area: None")
                print(f"      📦 Volume: {product['volume']} m³" if product['volume'] else "      📦 Volume: None")
                print(f"      📏 Height: {product['height']} cm" if product['height'] else "      📏 Height: None")
                print(f"      📏 Length: {product['length']} cm" if product['length'] else "      📏 Length: None")
                print(f"      📏 Depth: {product['depth']} cm" if product['depth'] else "      📏 Depth: None")
        else:
            print("❌ No products found")
            
    except Exception as e:
        print(f"❌ Error testing products: {e}")

def test_quote_items_structure():
    """Test quote_items table structure"""
    try:
        supabase = get_supabase_client()
        
        print("\n🔍 Testing quote_items table structure...")
        
        # Try to get a sample quote item
        result = supabase.table('quote_items').select('*').limit(1).execute()
        
        if result.data:
            print("✅ quote_items table accessible")
            sample_item = result.data[0]
            print(f"📋 Sample item fields: {list(sample_item.keys())}")
            
            # Check for dimension fields
            dimension_fields = ['area', 'volume', 'height', 'length', 'depth']
            for field in dimension_fields:
                if field in sample_item:
                    print(f"✅ {field} field exists: {sample_item[field]}")
                else:
                    print(f"❌ {field} field missing")
        else:
            print("ℹ️ No quote_items found (table might be empty)")
            
    except Exception as e:
        print(f"❌ Error testing quote_items: {e}")

def test_invoice_items_structure():
    """Test invoice_items table structure"""
    try:
        supabase = get_supabase_client()
        
        print("\n🔍 Testing invoice_items table structure...")
        
        # Try to get a sample invoice item
        result = supabase.table('invoice_items').select('*').limit(1).execute()
        
        if result.data:
            print("✅ invoice_items table accessible")
            sample_item = result.data[0]
            print(f"📋 Sample item fields: {list(sample_item.keys())}")
            
            # Check for dimension fields
            dimension_fields = ['area', 'volume', 'height', 'length', 'depth']
            for field in dimension_fields:
                if field in sample_item:
                    print(f"✅ {field} field exists: {sample_item[field]}")
                else:
                    print(f"❌ {field} field missing")
        else:
            print("ℹ️ No invoice_items found (table might be empty)")
            
    except Exception as e:
        print(f"❌ Error testing invoice_items: {e}")

def main():
    """Main test function"""
    print("🚀 Testing dimensions data flow...")
    
    test_products_with_dimensions()
    test_quote_items_structure()
    test_invoice_items_structure()
    
    print("\n✅ Testing completed!")

if __name__ == "__main__":
    main()
