
let paginaAtual = 1;
let paginaAntesDoFiltro = 1;
let filtroAtivo = false;
const itensPorPagina = 6;

function corDaTag(tag) {
  const mapa = {
    html: '#007bff',
    python: '#28a745',
    dados: '#6f42c1',
    api: '#20c997',
    backend: '#dc3545',
    bootstrap: '#6610f2'
  };
  return mapa[tag.toLowerCase()] || '#002f87';
}

function renderizarPaginacao(totalItens) {
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const paginacaoIds = ['paginacao', 'paginacao-topo'];
  paginacaoIds.forEach(id => {
    const paginacao = document.getElementById(id);
    paginacao.innerHTML = '';

    if (totalPaginas <= 1) return;

    const criarBotao = (texto, pagina) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-primary mx-1';
      btn.textContent = texto;
      btn.onclick = () => {
        paginaAtual = pagina;
        const termo = document.getElementById('searchInput').value.toLowerCase();
        const tagSelecionada = document.getElementById('tagFilter').value.toLowerCase();
        const filtrados = window.promptsData.filter(p => {
          const tituloMatch = p.titulo.toLowerCase().includes(termo);
          const tagMatch = tagSelecionada === '' || p.tags.some(tag => tag.toLowerCase() === tagSelecionada);
          return tituloMatch && tagMatch;
        });
        renderizarPrompts(filtrados);
      };
      return btn;
    };

    if (paginaAtual > 1) {
      paginacao.appendChild(criarBotao('Anterior', paginaAtual - 1));
    }

    for (let i = 1; i <= totalPaginas; i++) {
      const btn = criarBotao(i, i);
      if (i === paginaAtual) btn.classList.add('btn-primary');
      paginacao.appendChild(btn);
    }

    if (paginaAtual < totalPaginas) {
      paginacao.appendChild(criarBotao('Próxima', paginaAtual + 1));
    }
  });
}

async function carregarPrompts() {
  try {
    const response = await fetch('prompts.txt');
    const texto = await response.text();
    const blocos = texto.split(/\n\s*\n/);
    const tagsSet = new Set();
    const prompts = [];

    blocos.forEach(bloco => {
      const titulo = bloco.match(/Título:\s*(.+)/i)?.[1] || 'Sem título';
      const descricao = bloco.match(/Descrição:\s*([\s\S]*?)\nTags:/i)?.[1].trim() || '';
      const tagsRaw = bloco.match(/Tags:\s*(.+)/i)?.[1] || '';
      const tags = tagsRaw.split(',').map(tag => tag.trim()).filter(Boolean);
      tags.forEach(tag => tagsSet.add(tag.toLowerCase()));
      prompts.push({ titulo, descricao, tags });
    });

    preencherComboTags(tagsSet);
    renderizarPrompts(prompts);
    document.getElementById('searchInput').addEventListener('input', () => filtrar(prompts));
    document.getElementById('tagFilter').addEventListener('change', () => filtrar(prompts));
    window.promptsData = prompts;
  } catch (erro) {
    console.error('Erro ao carregar prompts:', erro);
    document.getElementById('prompt-list').innerHTML = '<p class="text-danger">Erro ao carregar o arquivo de prompts.</p>';
  }
}

function preencherComboTags(tagsSet) {
  const select = document.getElementById('tagFilter');
  [...tagsSet].sort().forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    select.appendChild(option);
  });
}

function renderizarPrompts(lista) {
  const container = document.getElementById('prompt-list');
  container.innerHTML = '';
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const pagina = lista.slice(inicio, fim);

  pagina.forEach(prompt => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    const card = document.createElement('div');
    card.className = 'card prompt-card';
    card.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="card-title mb-0">${prompt.titulo}</h6>
          <button class="btn btn-sm btn-outline-secondary ms-2" title="Copiar seleção" onclick="copiarSelecao()">📋</button>
        </div>
        <p class="card-text">${prompt.descricao.replace(/\n/g, '<br>')}</p>
        <div class="tag-container"></div>
      </div>
    `;
    const tagContainer = card.querySelector('.tag-container');
    prompt.tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'badge tag-badge';
      span.textContent = tag;
      span.title = 'Clique para filtrar. Clique duplo para limpar';
      span.style.backgroundColor = corDaTag(tag);
      if (document.getElementById('tagFilter').value.toLowerCase() === tag.toLowerCase()) {
        span.style.outline = '2px solid #ffa500';
        span.style.outlineOffset = '2px';
      }
      span.addEventListener('click', () => filtrarPorTag(tag));
      span.addEventListener('dblclick', () => limparFiltro());
      tagContainer.appendChild(span);
    });
    col.appendChild(card);
    container.appendChild(col);
  });

  renderizarPaginacao(lista.length);
}

function filtrar(prompts) {
  paginaAtual = 1;
  const termo = document.getElementById('searchInput').value.toLowerCase();
  const tagSelecionada = document.getElementById('tagFilter').value.toLowerCase();
  const filtrados = prompts.filter(p => {
    const tituloMatch = p.titulo.toLowerCase().includes(termo);
    const tagMatch = tagSelecionada === '' || p.tags.some(tag => tag.toLowerCase() === tagSelecionada);
    return tituloMatch && tagMatch;
  });
  renderizarPrompts(filtrados);
}

function filtrarPorTag(tag) {
  if (filtroAtivo) {
    paginaAtual = paginaAntesDoFiltro;
  } else {
    paginaAntesDoFiltro = paginaAtual;
  }
  filtroAtivo = true;
  paginaAtual = 1;
  document.getElementById('tagFilter').value = tag.toLowerCase();
  document.getElementById('searchInput').value = '';
  const termo = '';
  const tagSelecionada = tag.toLowerCase();
  const filtrados = window.promptsData.filter(p =>
    p.titulo.toLowerCase().includes(termo) &&
    p.tags.some(t => t.toLowerCase() === tagSelecionada)
  );
  renderizarPrompts(filtrados);
}

function limparFiltro() {
  paginaAtual = paginaAntesDoFiltro || 1;
  filtroAtivo = false;
  document.getElementById('tagFilter').value = '';
  document.getElementById('searchInput').value = '';
  const termo = '';
  const tagSelecionada = '';
  const filtrados = window.promptsData;
  renderizarPrompts(filtrados);
}

function copiarSelecao() {
  const selecionado = window.getSelection().toString();
  if (!selecionado) {
    alert('Selecione o texto que deseja copiar primeiro.');
    return;
  }
  navigator.clipboard.writeText(selecionado).then(() => {
    alert('Texto copiado para a área de transferência.');
  }).catch(err => {
    alert('Erro ao copiar: ' + err);
  });
}

carregarPrompts();
