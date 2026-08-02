let estoqueOriginal = []; // Variável global que guarda todos os carros carregados

document.addEventListener('DOMContentLoaded', () => {
    carregarEstoque();
    configurarSimulador();
});

// ==========================================
// 1. CARREGAMENTO E RENDERIZAÇÃO DA VITRINE
// ==========================================
function carregarEstoque() {
    fetch('veiculos.json')
        .then(response => response.json())
        .then(veiculos => {
            estoqueOriginal = veiculos; // Salva o catálogo original na memória
            popularDropdownsDeFiltro(veiculos); // Cria as opções de marca e ano
            renderizarVitrine(veiculos);        // Desenha os carros na tela
            configurarEventosDosFiltros();      // Ativa os botões de busca
        })
        .catch(error => {
            document.getElementById('vitrine-carros').innerHTML = '<p>Erro ao carregar o estoque. Tente novamente.</p>';
            console.error('Erro:', error);
        });
}

function renderizarVitrine(listaVeiculos) {
    const vitrine = document.getElementById('vitrine-carros');
    vitrine.innerHTML = ''; 
    
    // Mensagem caso nenhum carro passe no filtro
    if (listaVeiculos.length === 0) {
        vitrine.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1; color: #777;">Nenhum veículo encontrado com os filtros selecionados.</p>';
        return;
    }

    listaVeiculos.forEach(carro => {
        // Monta a mensagem pré-definida para o WhatsApp com o link do anúncio
        const textoConsultor = encodeURIComponent(`Olá! Quero falar com um consultor sobre o veículo *${carro.nome}*.\n\nAqui está o link do anúncio: ${carro.link}`);
        const linkWhatsAppDireto = `https://wa.me/5565999494847?text=${textoConsultor}`;

        const card = `
            <article class="car-card">
                <img src="${carro.foto}" alt="${carro.nome}">
                <div class="car-details">
                    <h3 class="car-title">${carro.nome}</h3>
                    <p class="car-specs">${carro.detalhes}</p>
                    <h2 class="car-price">${carro.preco}</h2>
                    <a href="${carro.link}" target="_blank" class="btn-acessar">ACESSAR ANÚNCIO</a>
                </div>
                
                <button class="btn-simular" 
                        data-veiculo="${carro.nome}" 
                        data-preco="${carro.preco_numerico}"
                        data-link="${carro.link}" 
                        onclick="abrirSidebarSimulador(this)">
                    Simular Financiamento
                </button>
                
                <!-- NOVO BOTÃO: Fale com Consultor -->
                <a href="${linkWhatsAppDireto}" target="_blank" class="btn-consultor">
                    <img src="img/icon/whatsapp.svg" alt="WhatsApp">
                    Fale com consultor agora mesmo
                </a>
            </article>
        `;
        vitrine.innerHTML += card;
    });
}

// ==========================================
// 2. LÓGICA DE FILTROS INTELIGENTES
// ==========================================
function popularDropdownsDeFiltro(veiculos) {
    const marcas = new Set();
    const anos = new Set();

    veiculos.forEach(v => {
        // Extrai a Marca (primeira palavra do nome)
        const marca = v.nome.split(' ')[0].toUpperCase();
        marcas.add(marca);

        // Extrai o Ano (procura 4 números seguidos nos detalhes)
        const matchAno = v.detalhes.match(/\d{4}/g);
        if (matchAno) {
            anos.add(matchAno[matchAno.length - 1]);
        }
    });

    const selectMarca = document.getElementById('filtro-marca');
    Array.from(marcas).sort().forEach(marca => {
        selectMarca.innerHTML += `<option value="${marca}">${marca}</option>`;
    });

    const selectAno = document.getElementById('filtro-ano');
    Array.from(anos).sort().reverse().forEach(ano => {
        selectAno.innerHTML += `<option value="${ano}">${ano}</option>`;
    });
}

function configurarEventosDosFiltros() {
    const inputs = [
        document.getElementById('filtro-nome'),
        document.getElementById('filtro-marca'),
        document.getElementById('filtro-ano'),
        document.getElementById('filtro-preco-min'),
        document.getElementById('filtro-preco-max')
    ];

    inputs.forEach(input => {
        input.addEventListener('input', aplicarFiltros);
    });

    document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
        inputs.forEach(i => i.value = ''); 
        renderizarVitrine(estoqueOriginal); 
    });
}

function aplicarFiltros() {
    const termoNome = document.getElementById('filtro-nome').value.toLowerCase();
    const marcaSelecionada = document.getElementById('filtro-marca').value.toUpperCase();
    const anoSelecionado = document.getElementById('filtro-ano').value;
    const precoMin = parseFloat(document.getElementById('filtro-preco-min').value) || 0;
    const precoMax = parseFloat(document.getElementById('filtro-preco-max').value) || Infinity;

    const filtrados = estoqueOriginal.filter(v => {
        const nomeLower = v.nome.toLowerCase();
        const marcaCarro = v.nome.split(' ')[0].toUpperCase();
        
        const matchAno = v.detalhes.match(/\d{4}/g);
        const anoCarro = matchAno ? matchAno[matchAno.length - 1] : "";

        const bateNome = nomeLower.includes(termoNome);
        const bateMarca = marcaSelecionada === "" || marcaCarro === marcaSelecionada;
        const bateAno = anoSelecionado === "" || anoCarro === anoSelecionado;
        const batePreco = v.preco_numerico >= precoMin && v.preco_numerico <= precoMax;

        return bateNome && bateMarca && bateAno && batePreco;
    });

    renderizarVitrine(filtrados);
}

// ==========================================
// 3. INTERFACE E CÁLCULO DO SIMULADOR
// ==========================================
function abrirSidebarSimulador(botao) {
    const veiculoNome = botao.getAttribute('data-veiculo');
    const veiculoPreco = parseFloat(botao.getAttribute('data-preco'));
    const veiculoLink = botao.getAttribute('data-link'); 

    document.getElementById('veiculo-selecionado-nome').innerText = veiculoNome;
    document.getElementById('valor-veiculo').value = veiculoPreco;
    
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    if(btnWhatsapp) {
        btnWhatsapp.setAttribute('data-link', veiculoLink);
        btnWhatsapp.removeAttribute('data-entrada');
        btnWhatsapp.removeAttribute('data-prazo');
        btnWhatsapp.removeAttribute('data-prestacao');
    }

    document.getElementById('valor-entrada').value = '';
    document.getElementById('resultado-simulacao').style.display = 'none';

    document.getElementById('sidebar-simulador').classList.add('open');
    document.getElementById('overlay-simulador').classList.add('active');
    
    setTimeout(() => { document.getElementById('valor-entrada').focus(); }, 350);
}

function fecharSidebarSimulador() {
    document.getElementById('sidebar-simulador').classList.remove('open');
    document.getElementById('overlay-simulador').classList.remove('active');
}

function configurarSimulador() {
    document.getElementById('fechar-simulador').addEventListener('click', fecharSidebarSimulador);
    document.getElementById('overlay-simulador').addEventListener('click', fecharSidebarSimulador);

    const btnCalcular = document.getElementById('btn-calcular');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    
    // Motor Matemático Tabela Price + IOF
    btnCalcular.addEventListener('click', () => {
        const valorVeiculo = parseFloat(document.getElementById('valor-veiculo').value);
        const valorEntrada = parseFloat(document.getElementById('valor-entrada').value);
        const prazo = parseInt(document.getElementById('prazo-meses').value);
        const taxaJuros = parseFloat(document.getElementById('taxa-juros').value) / 100;

        if (isNaN(valorEntrada) || valorEntrada < 0 || valorEntrada >= valorVeiculo) {
            alert("Por favor, insira um valor de entrada válido e menor que o valor do veículo.");
            return;
        }

        const principalBruto = valorVeiculo - valorEntrada;
        
        const diasFinanciamento = Math.min(prazo * 30, 365);
        const aliquotaIOF = 0.0038 + (0.000082 * diasFinanciamento);
        const valorIOF = principalBruto * aliquotaIOF;
        const principalTotal = principalBruto + valorIOF;
        
        const base = Math.pow(1 + taxaJuros, prazo);
        const prestacao = principalTotal * ((taxaJuros * base) / (base - 1));

        const formatBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        const prestacaoFormatada = formatBRL.format(prestacao);
        const entradaFormatada = formatBRL.format(valorEntrada);

        document.getElementById('res-financiado').innerHTML = `${formatBRL.format(principalTotal)} <br><span style="font-size: 0.75em; color: #666; font-weight: normal;">(Inclui ${formatBRL.format(valorIOF)} de IOF)</span>`;
        document.getElementById('res-parcelas').innerText = `${prazo}x de ${prestacaoFormatada}`;
        
        document.getElementById('resultado-simulacao').style.display = 'block';

        if(btnWhatsapp) {
            btnWhatsapp.setAttribute('data-entrada', entradaFormatada);
            btnWhatsapp.setAttribute('data-prazo', prazo);
            btnWhatsapp.setAttribute('data-prestacao', prestacaoFormatada);
        }
    });

    // CRM e Captação de Leads via WhatsApp
    if(btnWhatsapp) {
        btnWhatsapp.addEventListener('click', function() {
            const nome = document.getElementById('veiculo-selecionado-nome').innerText;
            const link = this.getAttribute('data-link');
            const entrada = this.getAttribute('data-entrada');
            const prazo = this.getAttribute('data-prazo');
            const prestacao = this.getAttribute('data-prestacao');

            if (!entrada || !prestacao) {
                alert("Por favor, clique em 'Calcular Parcela' antes de enviar a proposta.");
                return;
            }

            const numeroTelefone = "5565999494847"; 
            const textoMensagem = `Olá! Tenho interesse no veículo *${nome}*.\n\nFiz uma simulação de financiamento no site com as seguintes condições:\n- *Entrada:* ${entrada}\n- *Parcelas:* ${prazo}x de ${prestacao}\n\nLink do anúncio: ${link}\n\nPodemos conversar sobre essa proposta?`;

            const textoCodificado = encodeURIComponent(textoMensagem);
            window.open(`https://wa.me/${numeroTelefone}?text=${textoCodificado}`, '_blank');
        });
    }
}