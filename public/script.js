// Estado e constantes
let paginaAtual = 1;
let paginaAntesDoFiltro = 1;
let filtroAtivo = false;
const itensPorPagina = 6;

// Paleta de cores por tag
function corDaTag(tag) {
  const mapa = {
    html: '#007bff',
    python: '#28a745',
    dados: '#6f42c1',
    api: '#20c997',
    backend: '#dc3545',
    bootstrap: '#6610f2',
    texto: '#d0dbe5'
  };
  return mapa[tag.toLowerCase()] || '#002f87';
}

// Linkificar texto de descrição com segurança
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkify(text) {
  let s = escapeHtml(text);
  s = s.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1">$1</a>'
  );
  s = s.replace(
    /\b(https?:\/\/[^\s<>"']+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  s = s.replace(
    /(^|[\s(])www\.([^\s<>"']+)/g,
    '$1<a href="http://www.$2" target="_blank" rel="noopener noreferrer">www.$2</a>'
  );
  return s.replace(/\n/g, '<br>');
}

// Parser robusto dos prompts, aceita linhas em branco na descrição
function parseTextoPrompts(texto) {
  const t = String(texto || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const re = /^Título:\s*([^\n]+)\nDescrição:\s*([\s\S]*?)\nTags:\s*([^\n]+)\s*(?=\n\s*\n^Título:|\s*$)/gmi;
  const arr = [];
  let m;
  while ((m = re.exec(t)) !== null) {
    arr.push({
      titulo: m[1].trim(),
      descricao: m[2].replace(/\s+$/, ''),
      tags: m[3].trim()
    });
  }
  return arr;
}

// Preencher combo de tags
function preencherComboTags(tagsSet) {
  const select = document.getElementById('tagFilter');
  [...tagsSet].sort().forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    select.appendChild(option);
  });
}

// Paginação em cima e embaixo, recalculando a partir da busca por descrição
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
          const descricaoMatch = p.descricao.toLowerCase().includes(termo);
          const tagMatch = tagSelecionada === '' || p.tags.some(tag => tag.toLowerCase() === tagSelecionada);
          return descricaoMatch && tagMatch;
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

// Carregar prompts.txt e montar lista
async function carregarPrompts() {
  try {
    const response = await fetch('prompts.txt');
    const texto = await response.text();

    const tagsSet = new Set();
    const prompts = [];

    const itens = parseTextoPrompts(texto);
    itens.forEach(item => {
      const tagsArr = String(item.tags || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      tagsArr.forEach(t => tagsSet.add(t.toLowerCase()));
      prompts.push({
        titulo: item.titulo || 'Sem título',
        descricao: item.descricao || '',
        tags: tagsArr
      });
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

// Renderizar cards, com classes para alturas iguais
function renderizarPrompts(lista) {
  const container = document.getElementById('prompt-list');
  container.innerHTML = '';

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const pagina = lista.slice(inicio, fim);

  pagina.forEach((prompt) => {
    const col = document.createElement('div');
    col.className = 'col-md-4 d-flex'; // coluna flex para o card esticar

    const card = document.createElement('div');
    card.className = 'card prompt-card h-100'; // card ocupa 100% da altura da coluna

    card.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="card-title mb-0">${prompt.titulo}</h6>
          <button class="btn btn-sm btn-outline-secondary ms-2" title="Copiar seleção" onclick="copiarSelecao()">📋</button>
        </div>
        <p class="card-text">${linkify(prompt.descricao)}</p>
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

// Busca agora só na descrição
function filtrar(prompts) {
  paginaAtual = 1;
  const termo = document.getElementById('searchInput').value.toLowerCase();
  const tagSelecionada = document.getElementById('tagFilter').value.toLowerCase();

  const filtrados = prompts.filter(p => {
    const descricaoMatch = p.descricao.toLowerCase().includes(termo);
    const tagMatch = tagSelecionada === '' || p.tags.some(tag => tag.toLowerCase() === tagSelecionada);
    return descricaoMatch && tagMatch; // importante: retornar o resultado
  });

  renderizarPrompts(filtrados);
}

// Filtrar por tag com preservação de página anterior
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

  const filtrados = window.promptsData.filter(p =>
    p.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );

  renderizarPrompts(filtrados);
}

// Limpeza de filtro restaurando página anterior
function limparFiltro() {
  paginaAtual = paginaAntesDoFiltro || 1;
  filtroAtivo = false;

  document.getElementById('tagFilter').value = '';
  document.getElementById('searchInput').value = '';

  renderizarPrompts(window.promptsData);
}

// Utilidade de copiar seleção
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

// Intercepta clique no botão Editar Prompt para levar seleção como ?titulo=...
document.addEventListener('DOMContentLoaded', () => {
  const linkEditar = document.querySelector('a[href="pagina_adicionar_prompt.html"]');
  if (!linkEditar) return;

  linkEditar.addEventListener('click', function (e) {
    const selecionado = window.getSelection().toString().trim();
    if (!selecionado) return; // sem seleção, segue padrão
    e.preventDefault();
    const url = this.getAttribute('href') + '?titulo=' + encodeURIComponent(selecionado);
    window.location.href = url;
  });

  // início do app
  carregarPrompts();
});

