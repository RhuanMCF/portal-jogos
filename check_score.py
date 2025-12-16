from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Query for username 'teste' and score 10
response = supabase.table('high_scores').select('username, score').eq('username', 'teste').eq('score', 10).execute()

if response.data:
    print("Sim, existe um usuário com nome 'teste' e score 10.")
    print(response.data)
else:
    print("Não, não existe nenhum usuário com nome 'teste' e score 10.")