import os
import requests
from bs4 import BeautifulSoup
import json
import re

# ==========================================
# CONFIGURAÇÕES DA EMPRESA E SCRAPING
# ==========================================
URL_CATALOGO = "https://www.usadofacil.com.br/autocarbonmultimarcas"
BASE_URL = "https://www.usadofacil.com.br"
URL_ANUNCIO_BASE = "https://www.usadofacil.com.br/V6"

def extrair_dados_veiculos():
    print("Conectando ao catálogo online da AutoCarbon...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
    }
    
    try:
        response = requests.get(URL_CATALOGO, headers=headers, timeout=10)
        response.raise_for_status()
        response.encoding = 'utf-8' # Corrigindo problemas de acentuação (UTF-8)
    except Exception as e:
        print(f"Erro ao acessar o site: {e}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    veiculos = []

    container_grid = soup.find('div', class_=lambda c: c and 'tw-grid' in c and 'tw-grid-cols-1' in c)
    if not container_grid:
        print("Não foi possível encontrar o container de veículos.")
        return []

    cards_desktop = container_grid.find_all('div', class_=lambda c: c and 'tw-hidden' in c and 'md:tw-block' in c)
    
    for card in cards_desktop:
        try:
            link_tag = card.find('a', href=True)
            if not link_tag: continue
            
            link = URL_ANUNCIO_BASE + '/' + link_tag['href'] if not link_tag['href'].startswith('http') else link_tag['href']
            
            # --- MELHORIA: FOTOS EM ALTA RESOLUÇÃO ---
            img_tag = link_tag.find('img')
            if img_tag and img_tag.has_attr('src'):
                foto_miniatura = BASE_URL + img_tag['src'].replace('../', '/')
                # O Usado Fácil geralmente nomeia miniaturas como "id-m.jpg" e as em alta como "id.jpg"
                foto_alta_def = foto_miniatura.replace('-m.jpg', '.jpg')
            else:
                foto_alta_def = "img/sem-foto.jpg"
            
            nome_tag = card.find('h2', class_=lambda c: c and 'js-capitalize-model' in c)
            nome = nome_tag.text.strip() if nome_tag else 'Veículo Sem Nome'
            
            text_right_div = card.find('div', class_=lambda c: c and 'tw-text-right' in c)
            if text_right_div:
                ps = text_right_div.find_all('p')
                km = ps[0].text.strip() if len(ps) > 0 else ''
                ano = ps[1].text.strip() if len(ps) > 1 else ''
                preco_tag = text_right_div.find('h3')
                preco = preco_tag.text.strip() if preco_tag else 'Consulte valor'
            else:
                km, ano, preco = '', '', 'Consulte valor'

            detalhes = f"Ano: {ano} • {km}" if ano and km else ano or km
            
            apenas_numeros = re.sub(r'[^\d]', '', preco)
            preco_numerico = int(apenas_numeros[:-2]) if len(apenas_numeros) > 2 else 0

            veiculos.append({
                'nome': nome,
                'preco': preco,
                'preco_numerico': preco_numerico,
                'detalhes': detalhes,
                'link': link,
                'foto': foto_alta_def # Usando a variável da foto em alta definição
            })
            
        except Exception as e:
            print(f"Erro ao processar card: {e}")

    return veiculos

def atualizar_site_json(veiculos):
    if not veiculos:
        print("Nenhum veículo para atualizar o site.")
        return
        
    caminho_arquivo = "veiculos.json"
    try:
        with open(caminho_arquivo, 'w', encoding='utf-8') as f:
            json.dump(veiculos, f, ensure_ascii=False, indent=4)
        print(f"✅ Site atualizado com fotos em ALTA DEFINIÇÃO! Arquivo gerado: {caminho_arquivo}")
    except Exception as e:
        print(f"❌ Erro ao gerar JSON do site: {e}")

if __name__ == "__main__":
    lista_veiculos = extrair_dados_veiculos()
    atualizar_site_json(lista_veiculos)
