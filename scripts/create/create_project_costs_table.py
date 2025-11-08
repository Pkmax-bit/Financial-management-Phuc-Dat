import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    print('Missing Supabase environment variables')
    exit(1)

supabase: Client = create_client(url, key)

# Create project_costs table
create_table_sql = '''
CREATE TABLE IF NOT EXISTS public.project_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    cost_category_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    vendor TEXT,
    cost_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence INTEGER DEFAULT 0 CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
'''

try:
    # Try to create table using direct SQL execution
    result = supabase.rpc('exec_sql', {'sql': create_table_sql})
    print('Table project_costs created successfully')
except Exception as e:
    print(f'Error creating table with rpc: {e}')
    
    # Alternative: Create table using Supabase client
    try:
        # Check if table exists first
        result = supabase.table('project_costs').select('id').limit(1).execute()
        print('Table project_costs already exists')
    except Exception as e2:
        print(f'Table does not exist, need to create manually: {e2}')
        print('Please run this SQL in your Supabase dashboard:')
        print(create_table_sql)
