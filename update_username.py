from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Update username from 'teste' to 'RhuanMCF'
response = supabase.table('high_scores').update({'username': 'RhuanMCF'}).eq('username', 'teste').execute()

print("Username updated successfully.")
print(response.data)