import requests
import tarfile
import json
import shutil
from pathlib import Path

BLACKLIST_URL = "http://dsi.ut-capitole.fr/blacklists/download/blacklists.tar.gz"
TARGET_CATEGORIES = [
    'phishing', 'malware', 'scam', 'crypto', 'bitcoin', 'cryptojacking',
    'ddos', 'fakenews', 'hacking'
]

OUTPUT_DIR = Path(__file__).parent

def generate_blacklists():
    """
    Baixa, extrai e processa listas de domínios maliciosos,
    gerando um ficheiro JSON separado para cada categoria.
    """
    print("Iniciando a geração das blacklists...")

    download_path = OUTPUT_DIR / "blacklists.tar.gz"
    temp_extract_folder = OUTPUT_DIR / "blacklists_extracted"

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

    if temp_extract_folder.exists():
        shutil.rmtree(temp_extract_folder)
    temp_extract_folder.mkdir()
    
    print("Extraindo arquivos...")
    with tarfile.open(download_path, "r:gz") as tar:
        tar.extractall(path=temp_extract_folder)
    
    print("Processando categorias e gerando arquivos JSON...")
    base_path = temp_extract_folder / "blacklists"
    
    for category in TARGET_CATEGORIES:
        clean_category = category.strip()
        if not clean_category:
            continue
        
        domains_file = base_path / clean_category / "domains"
        
        if domains_file.exists():
            category_sites = {}
            with open(domains_file, 'r', encoding='utf-8') as f:
                for domain in f:
                    domain = domain.strip()
                    if domain:
                        category_sites[domain] = clean_category
            
            output_path = OUTPUT_DIR / f'{clean_category}.json'
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(category_sites, f)
            print(f"-> Arquivo '{output_path.name}' criado com {len(category_sites)} domínios.")
        else:
            print(f"-> Aviso: Categoria '{clean_category}' não encontrada.")

    print("Limpando arquivos temporários...")
    download_path.unlink()
    shutil.rmtree(temp_extract_folder)
    
    print("\n✅ Sucesso! As blacklists foram geradas na pasta 'Lists'.")

if __name__ == "__main__":
    generate_blacklists()