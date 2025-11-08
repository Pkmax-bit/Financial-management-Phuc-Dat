#!/usr/bin/env python3
"""
Script để setup database schema cho AI Expenses
"""

import os
import sys
from pathlib import Path

def main():
    """Main function to setup AI expenses database"""
    print("Setting up AI Expenses Database Schema...")
    
    # Check if we're in the right directory
    if not Path("frontend").exists():
        print("Error: Please run this script from the project root directory")
        sys.exit(1)
    
    # Database schema file
    schema_file = "create_project_costs_schema.sql"
    
    if not Path(schema_file).exists():
        print(f"Error: Schema file {schema_file} not found")
        sys.exit(1)
    
    print(f"Found schema file: {schema_file}")
    print("\nDatabase Schema Setup Instructions:")
    print("=" * 50)
    print("1. Connect to your Supabase database")
    print("2. Run the following SQL commands:")
    print(f"3. Execute: {schema_file}")
    print("\nManual Setup Steps:")
    print("1. Go to Supabase Dashboard > SQL Editor")
    print("2. Copy and paste the contents of create_project_costs_schema.sql")
    print("3. Execute the SQL script")
    print("4. Verify tables are created:")
    print("   - project_costs")
    print("   - cost_categories") 
    print("   - cost_allocations")
    print("\nEnvironment Variables Setup:")
    print("1. Add to frontend/.env.local:")
    print("   OPENAI_API_KEY=your_openai_api_key")
    print("2. Get OpenAI API key from: https://platform.openai.com/api-keys")
    print("\nFeatures Available After Setup:")
    print("- AI Receipt Analysis with GPT-4 Vision")
    print("- Automatic Project Detection from Receipts")
    print("- Project Cost Dashboard")
    print("- Expense Management with AI")
    print("- Cost Category Classification")
    print("- Budget vs Actual Tracking")
    
    print("\nNext Steps:")
    print("1. Setup database schema")
    print("2. Configure OpenAI API key")
    print("3. Test AI receipt upload")
    print("4. Verify project cost tracking")
    
    print("\nSetup instructions completed!")

if __name__ == "__main__":
    main()
