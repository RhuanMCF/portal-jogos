from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get the record
response = supabase.table('high_scores').select('*').eq('username', 'teste').eq('score', 10).execute()

if response.data:
    record = response.data[0]
    record_id = record['id']
    
    # Update the username
    update_response = supabase.table('high_scores').update({'username': 'RhuanMCF'}).eq('id', record_id).execute()
    
    print("Username updated successfully.")
    print(update_response.data)
else:
    print("Record not found.")