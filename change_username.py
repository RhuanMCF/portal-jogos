from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Delete the old record
supabase.table('high_scores').delete().eq('username', 'teste').execute()

# Insert new record
response = supabase.table('high_scores').insert({
    'username': 'RhuanMCF',
    'score': 10
}).execute()

print("Username changed successfully.")
print(response.data)