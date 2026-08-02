// Script de interatividade do site
document.addEventListener('DOMContentLoaded', () => {
    // Lógica das Abas de Pesquisa
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Função Simulada: Carregar dados processados pelo Python (estoque.json)
    // Em ambiente real, usar fetch('data/estoque.json')
    const grid = document.getElementById('vitrine-grid');
    
    // Simulação dos dados que o Python vai gerar após classificar
    const dadosExemplo = [
        { nome: 'RAM 3500 LARAMIE', preco: 'R$ 499.000', ano_km: '2023 • 15.000 km', foto: 'img/lazy.gif', categoria: 'utilitario', link: '#' },
        { nome: 'PORSCHE 911 TARGA', preco: 'R$ 969.900', ano_km: '2022 • 30.075 km', foto: 'img/lazy.gif', categoria: 'hatch', link: '#' },
        { nome: 'BMW X6 M COMPETITION', preco: 'R$ 1.150.000', ano_km: '2024 • 16.290 km', foto: 'img/lazy.gif', categoria: 'suv', link: '#' }
    ];

    dadosExemplo.forEach(v => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${v.foto}" alt="${v.nome}">
            <div class="card-content">
                <div class="card-title">${v.nome}</div>
                <div class="card-price">${v.preco}</div>
                <div class="card-details">
                    <span>${v.ano_km}</span>
                    <span class="tag-categoria">${v.categoria}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
});
