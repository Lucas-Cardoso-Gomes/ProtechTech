import requests
import tarfile
import os
import json
import shutil
from pathlib import Path

BLACKLIST_URL = "http://dsi.ut-capitole.fr/blacklists/download/blacklists.tar.gz"
TARGET_CATEGORIES = [
    'phishing', 'malware', 'scam', 'crypto', 'bitcoin', 'cryptojacking', 
    'ddos', 'fakenews', 'hacking'
]

BLACKLIST_FILE_NAME = "blacklist.json"

def generate_blacklists():
    print("Iniciando a geração da blacklist...")

    download_path = Path("blacklists.tar.gz")
    temp_extract_folder = Path("blacklists_extracted")

    print(f"Baixando a lista de {BLACKLIST_URL}...")
    try:
        with requests.get(BLACKLIST_URL, stream=True) as r:
            r.raise_for_status()
            with open(download_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
    except requests.exceptions.RequestException as e:
        print(f"Erro ao baixar a lista: {e}")
        return

    print("Extraindo arquivos...")
    with tarfile.open(download_path, "r:gz") as tar:
        tar.extractall(path=temp_extract_folder)
    
    print("Processando categorias e agregando domínios...")
    base_path = temp_extract_folder / "blacklists"
    all_malicious_domains = {}

    for category in TARGET_CATEGORIES:
        clean_category = category.strip()
        if not clean_category:
            continue
        
        domains_file = base_path / clean_category / "domains"
        
        if domains_file.exists():
            count = 0
            with open(domains_file, 'r', encoding='utf-8') as f:
                for domain in f:
                    domain = domain.strip()
                    if domain:
                        all_malicious_domains[domain] = clean_category
                        count += 1
            print(f"-> Categoria '{clean_category}' processada com {count} domínios.")
        else:
            print(f"-> Aviso: Categoria '{clean_category}' não encontrada.")
    
    output_path = BLACKLIST_FILE_NAME
    print(f"\nGravando {len(all_malicious_domains)} domínios únicos em '{output_path}'...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_malicious_domains, f, indent=2)

    print("Limpando arquivos temporários...")
    download_path.unlink()
    shutil.rmtree(temp_extract_folder)
    
    print("\n✅ Sucesso! A blacklist foi gerada.")

if __name__ == "__main__":
    generate_blacklists()