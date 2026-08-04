
let estoqueOriginal = []; 

document.addEventListener('DOMContentLoaded', () => {
    carregarEstoque();
    configurarSimulador();
});

// Correção: recebendo o 'event' explicitamente
window.scrollCarousel = function(event, btn, direction) {
    event.preventDefault(); 
    event.stopPropagation();
    
    const track = btn.parentElement.querySelector('.carousel-track');
    if(track) {
        const scrollAmount = track.clientWidth;
        track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
};

function carregarEstoque() {
    fetch('veiculos.json')
        .then(response => response.json())
        .then(veiculos => {
            estoqueOriginal = veiculos; 
            popularDropdownsDeFiltro(veiculos); 
            renderizarVitrine(veiculos);        
            configurarEventosDosFiltros();      
        })
        .catch(error => {
            document.getElementById('vitrine-carros').innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Erro ao carregar o estoque.</p>';
        });
}

function renderizarVitrine(listaVeiculos) {
    const vitrine = document.getElementById('vitrine-carros');
    vitrine.innerHTML = ''; 
    
    if (listaVeiculos.length === 0) {
        vitrine.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1;">Nenhum veículo encontrado.</p>';
        return;
    }

    listaVeiculos.forEach(carro => {
        const textoConsultor = encodeURIComponent(`Olá! Quero falar com um consultor sobre o veículo *${carro.nome}*.

Link do anúncio: ${carro.link}`);
        const linkWhatsAppDireto = `https://wa.me/5565999494847?text=${textoConsultor}`;

        let fotosHtml = '';
        if (carro.fotos && carro.fotos.length > 1) {
            let trackHtml = carro.fotos.map(f => `<img src="${f}" loading="lazy" alt="Foto">`).join('');
            // Adicionado 'event' na chamada onclick
            fotosHtml = `
                <div class="carousel-container">
                    <button class="carousel-btn prev" onclick="scrollCarousel(event, this, -1)">&#10094;</button>
                    <div class="carousel-track">
                        ${trackHtml}
                    </div>
                    <button class="carousel-btn next" onclick="scrollCarousel(event, this, 1)">&#10095;</button>
                </div>
            `;
        } else {
            let singleFoto = (carro.fotos && carro.fotos.length > 0) ? carro.fotos[0] : carro.foto;
            fotosHtml = `
                <div class="carousel-container" style="display:block;">
                    <img src="${singleFoto}" alt="${carro.nome}" style="width:100%; height:100%; object-fit:cover;">
                </div>
            `;
        }

        const card = `
            <article class="car-card">
                ${fotosHtml}
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
                
                <a href="${linkWhatsAppDireto}" target="_blank" class="btn-consultor">
                    <img src="img/icon/whatsapp.svg" alt="WhatsApp">
                    Fale com consultor agora mesmo
                </a>
            </article>
        `;
        vitrine.innerHTML += card;
    });
}

function popularDropdownsDeFiltro(veiculos) {
    const marcas = new Set();
    const anos = new Set();
    veiculos.forEach(v => {
        marcas.add(v.nome.split(' ')[0].toUpperCase());
        const matchAno = v.detalhes.match(/\d{4}/g);
        if (matchAno) { anos.add(matchAno[matchAno.length - 1]); }
    });

    const selectMarca = document.getElementById('filtro-marca');
    Array.from(marcas).sort().forEach(marca => { selectMarca.innerHTML += `<option value="${marca}">${marca}</option>`; });

    const selectAno = document.getElementById('filtro-ano');
    Array.from(anos).sort().reverse().forEach(ano => { selectAno.innerHTML += `<option value="${ano}">${ano}</option>`; });
}

function configurarEventosDosFiltros() {
    const inputs = ['filtro-nome', 'filtro-marca', 'filtro-ano', 'filtro-preco-min', 'filtro-preco-max'].map(id => document.getElementById(id));
    inputs.forEach(input => { input.addEventListener('input', aplicarFiltros); });
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
        const marcaCarro = v.nome.split(' ')[0].toUpperCase();
        const matchAno = v.detalhes.match(/\d{4}/g);
        const anoCarro = matchAno ? matchAno[matchAno.length - 1] : "";
        
        return v.nome.toLowerCase().includes(termoNome) &&
               (marcaSelecionada === "" || marcaCarro === marcaSelecionada) &&
               (anoSelecionado === "" || anoCarro === anoSelecionado) &&
               (v.preco_numerico >= precoMin && v.preco_numerico <= precoMax);
    });
    renderizarVitrine(filtrados);
}

function abrirSidebarSimulador(botao) {
    document.getElementById('veiculo-selecionado-nome').innerText = botao.getAttribute('data-veiculo');
    document.getElementById('valor-veiculo').value = parseFloat(botao.getAttribute('data-preco'));
    
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    if(btnWhatsapp) {
        btnWhatsapp.setAttribute('data-link', botao.getAttribute('data-link'));
        btnWhatsapp.removeAttribute('data-entrada');
        btnWhatsapp.removeAttribute('data-prazo');
        btnWhatsapp.removeAttribute('data-prestacao');
    }

    document.getElementById('valor-entrada').value = '';
    document.getElementById('resultado-simulacao').style.display = 'none';
    document.getElementById('sidebar-simulador').classList.add('open');
    document.getElementById('overlay-simulador').classList.add('active');
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
        
        document.getElementById('res-financiado').innerHTML = `${formatBRL.format(principalTotal)} <br><span style="font-size: 0.8em; color: #64748B; font-weight: normal;">(Inclui ${formatBRL.format(valorIOF)} de IOF)</span>`;
        document.getElementById('res-parcelas').innerText = `${prazo}x de ${formatBRL.format(prestacao)}`;
        document.getElementById('resultado-simulacao').style.display = 'block';

        if(btnWhatsapp) {
            btnWhatsapp.setAttribute('data-entrada', formatBRL.format(valorEntrada));
            btnWhatsapp.setAttribute('data-prazo', prazo);
            btnWhatsapp.setAttribute('data-prestacao', formatBRL.format(prestacao));
        }
    });

    if(btnWhatsapp) {
        btnWhatsapp.addEventListener('click', function() {
            const nome = document.getElementById('veiculo-selecionado-nome').innerText;
            const entrada = this.getAttribute('data-entrada');
            const prestacao = this.getAttribute('data-prestacao');
            if (!entrada || !prestacao) { alert("Por favor, clique em 'Calcular Parcela'."); return; }

            const msg = `Olá! Tenho interesse no veículo *${nome}*.

Simulação:
- Entrada: ${entrada}
- Parcelas: ${this.getAttribute('data-prazo')}x de ${prestacao}

Link: ${this.getAttribute('data-link')}`;
            window.open(`https://wa.me/5565999494847?text=${encodeURIComponent(msg)}`, '_blank');
        });
    }
}
