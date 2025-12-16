from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Query for username 'RhuanMCF' and score 10
response = supabase.table('high_scores').select('username, score').eq('username', 'RhuanMCF').eq('score', 10).execute()

if response.data:
    print("Sim, o usuário foi atualizado para 'RhuanMCF' com score 10.")
    print(response.data)
else:
    print("Não encontrado.")