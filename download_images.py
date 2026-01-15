import os
import requests
from pathlib import Path
from PIL import Image
from io import BytesIO
import time

# Configuração
BASE_DIR = Path(__file__).parent / "data" / "images"
UNSPLASH_API_KEY = "sua_chave_api_aqui"  # Obter em https://unsplash.com/oauth/applications

# Categorias e palavras-chave para busca
CATEGORIES = {
    "gatos": "cat",
    "cachorros": "dog",
    "passaros": "bird",
    "carros": "car",
    "casas": "house",
}

IMAGE_SIZE = (224, 224)
IMAGES_PER_CATEGORY = 50

def create_directories():
    """Cria estrutura de diretórios"""
    for category in CATEGORIES.keys():
        path = BASE_DIR / category
        path.mkdir(parents=True, exist_ok=True)
    print(f"✓ Diretórios criados em {BASE_DIR}")

def download_from_unsplash(category, keyword):
    """Download de imagens do Unsplash"""
    url = "https://api.unsplash.com/search/photos"
    
    for page in range(1, 3):  # 2 páginas
        params = {
            "query": keyword,
            "page": page,
            "per_page": IMAGES_PER_CATEGORY,
            "client_id": UNSPLASH_API_KEY,
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            results = response.json()["results"]
            
            for idx, item in enumerate(results):
                try:
                    img_url = item["urls"]["regular"]
                    img_response = requests.get(img_url, timeout=10)
                    img_response.raise_for_status()
                    
                    # Processar imagem
                    img = Image.open(BytesIO(img_response.content))
                    img = img.convert("RGB")
                    img.thumbnail(IMAGE_SIZE, Image.Resampling.LANCZOS)
                    
                    # Salvar
                    filename = f"{category}_{page}_{idx}.jpg"
                    filepath = BASE_DIR / category / filename
                    img.save(filepath, "JPEG", quality=85)
                    
                    print(f"  ✓ {filename}")
                    time.sleep(0.2)  # Rate limiting
                    
                except Exception as e:
                    print(f"  ✗ Erro ao baixar imagem {idx}: {e}")
                    continue
                    
        except Exception as e:
            print(f"✗ Erro na página {page}: {e}")
            break

def download_from_pexels(category, keyword):
    """Download de imagens do Pexels (sem API key)"""
    base_url = "https://www.pexels.com/api/v1/search"
    api_key = "sua_chave_pexels_aqui"  # Obter em https://www.pexels.com/api/
    
    for page in range(1, 3):
        params = {
            "query": keyword,
            "page": page,
            "per_page": 20,
        }
        headers = {"Authorization": api_key}
        
        try:
            response = requests.get(base_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            photos = response.json()["photos"]
            
            for idx, photo in enumerate(photos):
                try:
                    img_url = photo["src"]["medium"]
                    img_response = requests.get(img_url, timeout=10)
                    img_response.raise_for_status()
                    
                    img = Image.open(BytesIO(img_response.content))
                    img = img.convert("RGB")
                    img.thumbnail(IMAGE_SIZE, Image.Resampling.LANCZOS)
                    
                    filename = f"{category}_{page}_{idx}.jpg"
                    filepath = BASE_DIR / category / filename
                    img.save(filepath, "JPEG", quality=85)
                    
                    print(f"  ✓ {filename}")
                    time.sleep(0.2)
                    
                except Exception as e:
                    print(f"  ✗ Erro: {e}")
                    continue
                    
        except Exception as e:
            print(f"✗ Erro na página {page}: {e}")

def main():
    """Função principal"""
    print("🚀 Iniciando download de imagens...\n")
    
    create_directories()
    
    print("\n📥 Fazendo download das imagens:")
    for category, keyword in CATEGORIES.items():
        print(f"\n[{category.upper()}]")
        try:
            # Tentar Unsplash primeiro
            download_from_unsplash(category, keyword)
        except Exception as e:
            print(f"⚠ Unsplash indisponível, tentando Pexels...")
            try:
                download_from_pexels(category, keyword)
            except Exception as e2:
                print(f"✗ Erro: {e2}")
    
    print("\n✅ Download concluído!")
    print(f"Imagens salvas em: {BASE_DIR}")

if __name__ == "__main__":
    main()
