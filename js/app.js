// Variáveis globais
let horaTrabalhada = parseFloat(localStorage.getItem('horaTrabalhada')) || 0;
let ingredientes = JSON.parse(localStorage.getItem('ingredientes')) || [];
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];

// Função para exibir mensagem de erro
function mostrarErro(mensagem) {
    const mensagemErro = document.getElementById('mensagemErro');
    mensagemErro.textContent = mensagem;
    mensagemErro.classList.remove('d-none');
    setTimeout(() => {
        mensagemErro.classList.add('d-none');
        mensagemErro.textContent = '';
    }, 5000);
}

// Função para salvar o valor da hora trabalhada
function salvarHoraTrabalhada() {
    const valor = parseFloat(document.getElementById('horaTrabalhada').value);
    if (isNaN(valor) || valor < 0) {
        mostrarErro('Insira um valor válido para a hora trabalhada (maior ou igual a 0).');
        return;
    }
    horaTrabalhada = valor;
    localStorage.setItem('horaTrabalhada', horaTrabalhada);
    mostrarErro('Valor da hora trabalhada salvo: R$' + horaTrabalhada.toFixed(2));
    carregarProdutos();
}

/**
 * Adiciona um novo ingrediente à lista de ingredientes.
 */
function adicionarIngrediente() {
    const nome = document.getElementById('nomeIngrediente').value.trim();
    const preco = parseFloat(document.getElementById('precoIngrediente').value);
    const unidade = document.getElementById('unidadeIngrediente').value;

    if (!nome) {
        mostrarErro('Preencha o nome do ingrediente.');
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        mostrarErro('Insira um preço válido (maior que 0).');
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
        mostrarErro('Este ingrediente está em uma ou mais receitas e não pode ser excluído.');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este ingrediente?')) {
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
        mostrarErro('Insira um preço válido (maior que 0).');
        carregarIngredientes();
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

// Função para carregar ingredientes no formulário de receitas
function carregarIngredientesParaProduto(produto = null) {
    const div = document.getElementById('ingredientesProduto');
    div.innerHTML = '<h5>Selecione os Ingredientes:</h5>';
    if (ingredientes.length === 0) {
        div.innerHTML += '<p>Nenhum ingrediente cadastrado. Cadastre ingredientes primeiro.</p>';
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
            <input type="number" class="form-control mt-1 quantidade" id="quantidade_${ingrediente.id}" placeholder="Quantidade (${ingrediente.unidade === 'kg' ? 'ex: 0.2 para 200g' : 'unidades'})" step="${ingrediente.unidade === 'kg' ? '0.001' : '0.1'}" value="${quantidade}" style="display: ${isChecked ? 'block' : 'none'};" min="0">
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

// Função para adicionar ou editar receita
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
        mostrarErro('Insira um nome para a receita.');
        return;
    }
    if (isNaN(horas) || horas <= 0) {
        mostrarErro('Insira um valor válido para as horas trabalhadas (maior que 0).');
        return;
    }
    if (ingredientesSelecionados.length === 0) {
        mostrarErro('Selecione pelo menos um ingrediente para a receita.');
        return;
    }
    if (ingredientesSelecionados.some(ing => isNaN(ing.quantidade) || ing.quantidade <= 0)) {
        mostrarErro('Informe quantidades válidas (maior que 0) para todos os ingredientes selecionados.');
        return;
    }

    if (id) {
        // Editar receita existente
        const produto = produtos.find(p => p.id === id);
        if (produto) {
            produto.nome = nome;
            produto.horas = horas;
            produto.ingredientes = ingredientesSelecionados;
        }
    } else {
        // Adicionar nova receita
        const newId = Date.now().toString();
        produtos.push({ id: newId, nome, horas, ingredientes: ingredientesSelecionados });
    }
    localStorage.setItem('produtos', JSON.stringify(produtos));
    cancelarEdicao();
    carregarProdutos();
}

// Função para editar receita
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

// Função para excluir receita
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

// Função para carregar receitas e calcular totais
function carregarProdutos() {
    const lista = document.getElementById('listaProdutos');
    lista.innerHTML = '';
    let custoTotalTodos = 0;
    let precoSugeridoTodos = 0;

    produtos.forEach(produto => {
        const ingredientesProduto = produto.ingredientes.map(ing => {
            const ingrediente = ingredientes.find(i => i.id === ing.id);
            const custo = ingrediente ? (ingrediente.preco * ing.quantidade) : 0;
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
                Ingredientes: ${ingredientesProduto.map(ing => `${ing.nome || 'Desconhecido'} (${ing.quantidade}${ing.unidade || ''} = R$${ing.custo.toFixed(2)})`).join(', ')}<br>
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