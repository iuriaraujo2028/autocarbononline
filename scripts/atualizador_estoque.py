import os
import json
import requests
from bs4 import BeautifulSoup

URL_CATALOGO = "https://www.usadofacil.com.br/autocarbonmultimarcas"
BASE_URL = "https://www.usadofacil.com.br"
URL_ANUNCIO_BASE = "https://www.usadofacil.com.br/V6"

def categorizar_veiculo(nome):
    """
    Lógica de Inteligência para mapear o nome do veículo extraído 
    para as categorias do site (Hatch, Sedan, SUV, etc.)
    """
    nome_lower = nome.lower()
    
    # Dicionário de regras
    if any(palavra in nome_lower for palavra in ['x3', 'x4', 'x5', 'x6', 'cayenne', 'commander', 'range rover', 'haval', 'jeep', 'suv', 'tracker', 'creta', 'hr-v']):
        return 'suv'
    elif any(palavra in nome_lower for palavra in ['1500', '2500', '3500', 'amarok', 'hilux', 'ranger', 's10', 'silverado', 'f-150', 'strada', 'toro', 'saveiro']):
        return 'utilitario'
    elif any(palavra in nome_lower for palavra in ['harley', 'moto', 'cg', 'r 1200', 'ninja']):
        return 'moto'
    elif any(palavra in nome_lower for palavra in ['320i', 'c200', 'c300', 'panamera', 'corolla', 'civic', 'cruze']):
        return 'sedan'
    elif any(palavra in nome_lower for palavra in ['avant', 'touring', 'sw', 'parati']):
        return 'station'
    elif any(palavra in nome_lower for palavra in ['caminhao', 'truck', 'constellation', 'scania', 'volvo fh']):
        return 'caminhao'
    else:
        # Padrão para esportivos/compactos se não cair nas regras acima
        return 'hatch'

def extrair_dados_veiculos():
    print("Conectando ao catálogo online da AutoCarbon...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        response = requests.get(URL_CATALOGO, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Erro ao acessar: {e}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    veiculos = []

    # Localiza o container (lógica mantida do seu código original)
    container_grid = soup.find('div', class_=lambda c: c and 'tw-grid' in c and 'tw-grid-cols-1' in c)
    if not container_grid:
        return []

    cards_desktop = container_grid.find_all('div', class_=lambda c: c and 'tw-hidden' in c and 'md:tw-block' in c)
    
    for card in cards_desktop:
        try:
            link_tag = card.find('a', href=True)
            if not link_tag: continue
            
            link = URL_ANUNCIO_BASE + '/' + link_tag['href'] if not link_tag['href'].startswith('http') else link_tag['href']
            
            img_tag = link_tag.find('img')
            foto = BASE_URL + img_tag['src'].replace('../', '/') if img_tag and img_tag.has_attr('src') else None
            
            nome_tag = card.find('h2', class_=lambda c: c and 'js-capitalize-model' in c)
            nome = nome_tag.text.strip() if nome_tag else 'Veículo'
            
            text_right_div = card.find('div', class_=lambda c: c and 'tw-text-right' in c)
            if text_right_div:
                ps = text_right_div.find_all('p')
                km = ps[0].text.strip() if len(ps) > 0 else ''
                ano = ps[1].text.strip() if len(ps) > 1 else ''
                preco_tag = text_right_div.find('h3')
                preco = preco_tag.text.strip() if preco_tag else 'Consulte valor'
            else:
                km, ano, preco = '', '', 'Consulte'

            # APLICA A REGRA DE CATEGORIZAÇÃO AQUI
            categoria_detectada = categorizar_veiculo(nome)

            veiculos.append({
                'nome': nome,
                'preco': preco,
                'ano_km': f"{ano} • {km}",
                'link': link,
                'foto': foto,
                'categoria': categoria_detectada
            })
            
        except Exception as e:
            continue

    return veiculos

if __name__ == "__main__":
    veiculos = extrair_dados_veiculos()
    # Salvar em JSON para o frontend ler
    with open("../data/estoque.json", "w", encoding="utf-8") as f:
        json.dump(veiculos, f, ensure_ascii=False, indent=4)
    print("Atualização concluída! JSON gerado para o site.")
