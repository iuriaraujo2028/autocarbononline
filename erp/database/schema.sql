-- DDL SCRIPT: AutoCarbon ERP & CRM
CREATE DATABASE autocarbon_erp;
USE autocarbon_erp;

-- Gestão de Vendedores e Histórico de Distribuição
CREATE TABLE vendedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone_whatsapp VARCHAR(20) NOT NULL,
    ultimo_lead_recebido DATETIME,
    status ENUM('ATIVO', 'INATIVO', 'FERIAS') DEFAULT 'ATIVO'
);

-- Cadastro de Clientes (Base ERP)
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf_cnpj VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Veículos / Estoque Espelhado
CREATE TABLE veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) UNIQUE,
    marca VARCHAR(50),
    modelo VARCHAR(100),
    ano_fab INT,
    ano_mod INT,
    preco_venda DECIMAL(12,2),
    custo_preparacao DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('DISPONIVEL', 'RESERVADO', 'VENDIDO') DEFAULT 'DISPONIVEL'
);

-- Gestor de Leads (O CRM)
CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    vendedor_id INT,
    veiculo_id INT,
    origem VARCHAR(50), -- Site, Webmotors, OLX
    data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
    status_funil ENUM('NOVO', 'ATENDIMENTO', 'PROPOSTA', 'GANHO', 'PERDIDO') DEFAULT 'NOVO',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (vendedor_id) REFERENCES vendedores(id),
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
);

-- Módulo Financeiro e Contratos (NFe, Assinatura Digital)
CREATE TABLE contratos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT,
    valor_fechado DECIMAL(12,2),
    hash_assinatura_digital VARCHAR(255),
    chave_nfe VARCHAR(50),
    data_emissao DATETIME,
    status_contrato ENUM('MINUTA', 'ENVIADO', 'ASSINADO', 'CANCELADO') DEFAULT 'MINUTA',
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);
