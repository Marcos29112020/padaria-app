// Variáveis globais
let horaTrabalhada = parseFloat(localStorage.getItem('horaTrabalhada')) || 0;
let ingredientes = JSON.parse(localStorage.getItem('ingredientes')) || [];
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];

// Função para salvar o valor da hora trabalhada
function salvarHoraTrabalhada() {
    const valor = parseFloat(document.getElementById('horaTrabalhada').value);
    if (isNaN(valor) || valor < 0) {
        alert('Por favor, insira um valor válido para a hora trabalhada (maior ou igual a 0).');
        return;
    }
    horaTrabalhada = valor;
    localStorage.setItem('horaTrabalhada', horaTrabalhada);
    alert('Valor da hora trabalhada salvo: R$' + horaTrabalhada.toFixed(2));
    carregarProdutos();
}

// Função para adicionar ingrediente
function adicionarIngrediente() {
    const nome = document.getElementById('nomeIngrediente').value.trim();
    const preco = parseFloat(document.getElementById('precoIngrediente').value);
    const unidade = document.getElementById('unidadeIngrediente').value;

    if (!nome || isNaN(preco) || preco <= 0) {
        alert('Preencha o nome e um preço válido (maior que 0) para o produto!');
        return;
    }

    const id = Date.now().toString();
    ingredientes.push({ id, nome, preco, unidade });
    localStorage.setItem('ingredientes', JSON.stringify(ingredientes));
    document.getElementById('nomeIngrediente').value = '';
    document.getElementById('precoIngrediente').value = '';
    carregarIngredientes();
}

// Função para excluir ingrediente
function excluirIngrediente(id) {
    const usadoEmProdutos = produtos.some(produto => produto.ingredientes.some(ing => ing.id === id));
    if (usadoEmProdutos) {
        alert('Este produto não pode ser excluído porque está sendo usado em uma ou mais receitas!');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        ingredientes = ingredientes.filter(ing => ing.id !== id);
        localStorage.setItem('ingredientes', JSON.stringify(ingredientes));
        carregarIngredientes();
    }
}

// Função para carregar ingredientes
function carregarIngredientes() {
    const lista = document.getElementById('listaIngredientes');
    lista.innerHTML = '';
    ingredientes.forEach(ingrediente => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <div>
                ${ingrediente.nome} (${ingrediente.unidade}): R$ 
                <input type="number" value="${ingrediente.preco.toFixed(2)}" step="0.01" min="0" onchange="atualizarPrecoIngrediente('${ingrediente.id}', this.value)">
                <button class="btn btn-danger btn-sm" onclick="excluirIngrediente('${ingrediente.id}')">Excluir</button>
            </div>
        `;
        lista.appendChild(li);
    });
    carregarIngredientesParaProduto();
}

// Função para atualizar preço do ingrediente
function atualizarPrecoIngrediente(id, preco) {
    const novoPreco = parseFloat(preco);
    if (isNaN(novoPreco) || novoPreco <= 0) {
        alert('Por favor, insira um preço válido (maior que 0).');
        carregarIngredientes(); // Reverter para evitar preços inválidos
        return;
    }
    const ingrediente = ingredientes.find(ing => ing.id === id);
    if (ingrediente) {
        ingrediente.preco = novoPreco;
        localStorage.setItem('ingredientes', JSON.stringify(ingredientes));
        carregarIngredientes();
        carregarProdutos();
    }
}

// Função para carregar ingredientes no formulário de produtos
function carregarIngredientesParaProduto(produto = null) {
    const div = document.getElementById('ingredientesProduto');
    div.innerHTML = '<h5>Selecione os Produtos:</h5>';
    if (ingredientes.length === 0) {
        div.innerHTML += '<p>Nenhum produto cadastrado. Cadastre produtos primeiro.</p>';
        return;
    }
    ingredientes.forEach(ingrediente => {
        const divIng = document.createElement('div');
        divIng.className = 'form-check';
        const isChecked = produto && produto.ingredientes.some(ing => ing.id === ingrediente.id);
        const quantidade = isChecked ? produto.ingredientes.find(ing => ing.id === ingrediente.id).quantidade : '';
        divIng.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${ingrediente.id}" id="ingrediente_${ingrediente.id}" ${isChecked ? 'checked' : ''} onchange="toggleQuantidade('${ingrediente.id}', this.checked)">
            <label class="form-check-label" for="ingrediente_${ingrediente.id}">
                ${ingrediente.nome} (R$${ingrediente.preco.toFixed(2)}/${ingrediente.unidade})
            </label>
            <input type="number" class="form-control mt-1 quantidade" id="quantidade_${ingrediente.id}" placeholder="Quantidade (${ingrediente.unidade === 'kg' ? 'ex: 0.2 para 200g' : 'unidades'})" step="${ingrediente.unidade === 'kg' ? '0.001' : '1'}" value="${quantidade}" style="display: ${isChecked ? 'block' : 'none'};" min="0">
        `;
        div.appendChild(divIng);
    });
}

// Função para mostrar/esconder campo de quantidade
function toggleQuantidade(id, checked) {
    const inputQuantidade = document.getElementById(`quantidade_${id}`);
    inputQuantidade.style.display = checked ? 'block' : 'none';
    if (!checked) inputQuantidade.value = '';
}

// Função para adicionar ou editar produto
function adicionarOuEditarProduto() {
    const id = document.getElementById('produtoId').value;
    const nome = document.getElementById('nomeProduto').value.trim();
    const horas = parseFloat(document.getElementById('horasTrabalhadas').value);
    const checkboxes = document.querySelectorAll('#ingredientesProduto input:checked');
    const ingredientesSelecionados = Array.from(checkboxes).map(cb => {
        const id = cb.value;
        const quantidade = parseFloat(document.getElementById(`quantidade_${id}`).value);
        return { id, quantidade };
    });

    if (!nome) {
        alert('Por favor, insira um nome para a receita.');
        return;
    }
    if (isNaN(horas) || horas <= 0) {
        alert('Por favor, insira um valor válido para as horas trabalhadas (maior que 0).');
        return;
    }
    if (ingredientesSelecionados.length === 0) {
        alert('Selecione pelo menos um produto para a receita.');
        return;
    }
    if (ingredientesSelecionados.some(ing => isNaN(ing.quantidade) || ing.quantidade <= 0)) {
        alert('Informe quantidades válidas (maior que 0) para todos os produtos selecionados.');
        return;
    }

    if (id) {
        // Editar produto existente
        const produto = produtos.find(p => p.id === id);
        if (produto) {
            produto.nome = nome;
            produto.horas = horas;
            produto.ingredientes = ingredientesSelecionados;
        }
    } else {
        // Adicionar novo produto
        const newId = Date.now().toString();
        produtos.push({ id: newId, nome, horas, ingredientes: ingredientesSelecionados });
    }
    localStorage.setItem('produtos', JSON.stringify(produtos));
    cancelarEdicao();
    carregarProdutos();
}

// Função para editar produto
function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        document.getElementById('produtoId').value = produto.id;
        document.getElementById('nomeProduto').value = produto.nome;
        document.getElementById('horasTrabalhadas').value = produto.horas;
        document.getElementById('tituloProdutoForm').textContent = 'Editar Receita';
        document.getElementById('botaoProduto').textContent = 'Salvar Alterações';
        document.getElementById('cancelarEdicao').style.display = 'inline-block';
        carregarIngredientesParaProduto(produto);
    }
}

// Função para excluir produto
function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
        produtos = produtos.filter(p => p.id !== id);
        localStorage.setItem('produtos', JSON.stringify(produtos));
        carregarProdutos();
    }
}

// Função para cancelar edição
function cancelarEdicao() {
    document.getElementById('produtoId').value = '';
    document.getElementById('nomeProduto').value = '';
    document.getElementById('horasTrabalhadas').value = '';
    document.getElementById('tituloProdutoForm').textContent = 'Cadastrar Receita';
    document.getElementById('botaoProduto').textContent = 'Adicionar Receita';
    document.getElementById('cancelarEdicao').style.display = 'none';
    carregarIngredientesParaProduto();
}

// Função para carregar produtos e calcular totais
function carregarProdutos() {
    const lista = document.getElementById('listaProdutos');
    lista.innerHTML = '';
    let custoTotalTodos = 0;
    let precoSugeridoTodos = 0;

    produtos.forEach(produto => {
        const ingredientesProduto = produto.ingredientes.map(ing => {
            const ingrediente = ingredientes.find(i => i.id === ing.id);
            const custo = ingrediente ? (ingrediente.preco * (ingrediente.unidade === 'kg' ? ing.quantidade : Math.floor(ing.quantidade))) : 0;
            return { ...ingrediente, quantidade: ing.quantidade, custo };
        });
        const custoIngredientes = ingredientesProduto.reduce((sum, ing) => sum + (ing.custo || 0), 0);
        const custoHoras = produto.horas * horaTrabalhada;
        const custoTotal = custoIngredientes + custoHoras;
        const precoSugerido = custoTotal * 2 * 1.1; // 100% lucro + 10% custos incalculáveis

        custoTotalTodos += custoTotal;
        precoSugeridoTodos += precoSugerido;

        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <div>
                <strong>${produto.nome}</strong><br>
                Produtos: ${ingredientesProduto.map(ing => `${ing.nome || 'Desconhecido'} (${ing.quantidade}${ing.unidade || ''} = R$${ing.custo.toFixed(2)})`).join(', ')}<br>
                Horas Trabalhadas: ${produto.horas} (R$${custoHoras.toFixed(2)})<br>
                Custo Total: R$${custoTotal.toFixed(2)}<br>
                Preço Sugerido: R$${precoSugerido.toFixed(2)}
                <div>
                    <button class="btn btn-warning btn-sm" onclick="editarProduto('${produto.id}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirProduto('${produto.id}')">Excluir</button>
                </div>
            </div>
        `;
        lista.appendChild(li);
    });

    // Exibir totais
    const totaisDiv = document.getElementById('totais');
    totaisDiv.innerHTML = produtos.length > 0 ? `
        <p>Custo Total de Todas as Receitas: R$${custoTotalTodos.toFixed(2)}</p>
        <p>Preço Sugerido Total: R$${precoSugeridoTodos.toFixed(2)}</p>
    ` : '<p>Nenhuma receita cadastrada.</p>';
}

// Inicializar
carregarIngredientes();
carregarProdutos();