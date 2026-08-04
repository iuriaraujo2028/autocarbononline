import os
import requests
from bs4 import BeautifulSoup
import json
import re
import time

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
        response.encoding = 'utf-8' 
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
    
    print(f"Encontrados {len(cards_desktop)} veículos. Iniciando extração de galerias (isso pode levar alguns segundos)...")

    for card in cards_desktop:
        try:
            link_tag = card.find('a', href=True)
            if not link_tag: continue
            
            link = URL_ANUNCIO_BASE + '/' + link_tag['href'] if not link_tag['href'].startswith('http') else link_tag['href']
            
            img_tag = link_tag.find('img')
            if img_tag and img_tag.has_attr('src'):
                foto_miniatura = BASE_URL + img_tag['src'].replace('../', '/')
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

            # --- NOVO: ENTRAR NA PÁGINA DO ANÚNCIO E BUSCAR TODAS AS FOTOS ---
            fotos_galeria = [foto_alta_def] if foto_alta_def != "img/sem-foto.jpg" else []
            try:
                det_resp = requests.get(link, headers=headers, timeout=5)
                if det_resp.status_code == 200:
                    det_soup = BeautifulSoup(det_resp.text, 'html.parser')
                    for img_det in det_soup.find_all('img'):
                        src = img_det.get('src') or img_det.get('data-src') or ''
                        if 'fotoscarrosano' in src:
                            f_url = BASE_URL + src.replace('../', '/') if src.startswith('../') else src
                            if not f_url.startswith('http'):
                                f_url = BASE_URL + '/' + f_url.lstrip('/')
                            f_alta = f_url.replace('-m.jpg', '.jpg')
                            if f_alta not in fotos_galeria:
                                fotos_galeria.append(f_alta)
            except Exception as e:
                print(f"Aviso: Não foi possível buscar galeria extra para {nome}")

            # Fallback se a galeria falhar
            if not fotos_galeria:
                fotos_galeria = ["img/sem-foto.jpg"]

            veiculos.append({
                'nome': nome,
                'preco': preco,
                'preco_numerico': preco_numerico,
                'detalhes': detalhes,
                'link': link,
                'foto': fotos_galeria[0], # Mantém para retrocompatibilidade
                'fotos': fotos_galeria    # Array completo de fotos
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
        print(f"✅ Site atualizado! Galerias de fotos baixadas com sucesso. Arquivo: {caminho_arquivo}")
    except Exception as e:
        print(f"❌ Erro ao gerar JSON do site: {e}")

if __name__ == "__main__":
    lista_veiculos = extrair_dados_veiculos()
    atualizar_site_json(lista_veiculos)
