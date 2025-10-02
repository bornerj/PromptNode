// server.js
const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const PUBLIC_DIR = path.join(__dirname, 'public');
const PROMPTS_FILE = path.join(PUBLIC_DIR, 'prompts.txt');
const TEMP_FILE = path.join(PUBLIC_DIR, 'prompts.tmp');

const EOL = '\n';
const SEP = '\n\n';

function normalizeEOL(str) {
  return String(str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function parsePrompts(texto) {
  const t = normalizeEOL(texto);
  const re = /^\s*Título:\s*([^\n]+)\n\s*Descrição:\s*([\s\S]*?)\n\s*Tags:\s*([^\n]*?)\s*(?=\n\s*\n\s*^Título:|\s*$)/gmi;
  const itens = [];
  let m;
  while ((m = re.exec(t)) !== null) {
    itens.push({
      titulo: (m[1] || '').trim(),
      descricao: String(m[2] || '').replace(/\s+$/,''),
      tags: (m[3] || '').trim()
    });
  }
  return itens;
}

function blocoToText({ titulo, descricao, tags }) {
  const t = String(titulo || '').trim();
  const d = normalizeEOL(descricao);
  const g = String(tags || '').trim();
  return `Título: ${t}\nDescrição: ${d}\nTags: ${g}`;
}

async function ensurePublicAndFile() {
  try {
    await fsp.mkdir(PUBLIC_DIR, { recursive: true });
  } catch (e) {
    console.error('Erro ao criar pasta public:', e);
    throw e;
  }
  try {
    await fsp.access(PROMPTS_FILE, fs.constants.F_OK);
  } catch {
    await fsp.writeFile(PROMPTS_FILE, '', 'utf8');
  }
}

app.get('/health', async (req, res) => {
  try {
    await ensurePublicAndFile();
    res.json({ ok: true, file: PROMPTS_FILE });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post('/add-prompt', async (req, res) => {
  let { titulo, descricao, tags } = req.body;
  try {
    await ensurePublicAndFile();

    if (!titulo || !descricao || !tags) {
      console.error('Campos ausentes:', { titulo, descricaoLen: descricao?.length, tags });
      return res.status(400).send('Campos obrigatórios ausentes');
    }

    titulo = String(titulo).trim();
    tags = String(tags).trim();
    descricao = normalizeEOL(descricao);

    const novoBloco = blocoToText({ titulo, descricao, tags });

    let atual = await fsp.readFile(PROMPTS_FILE, 'utf8');
    atual = normalizeEOL(atual);

    const lista = parsePrompts(atual);
    const idx = lista.findIndex(p => p.titulo.toLowerCase() === titulo.toLowerCase());

    if (idx >= 0) {
      lista[idx] = { titulo, descricao, tags };
    } else {
      lista.push({ titulo, descricao, tags });
    }

    const novoConteudo = lista.map(blocoToText).join(SEP) + SEP;

    await fsp.writeFile(TEMP_FILE, novoConteudo, 'utf8');
    await fsp.rename(TEMP_FILE, PROMPTS_FILE);

    return res.status(200).send('Prompt salvo com sucesso');
  } catch (e) {
    console.error('Falha ao salvar prompt:', e);
    try { await fsp.unlink(TEMP_FILE); } catch {}
    return res.status(500).send('Erro ao salvar o prompt no arquivo');
  }
});

// Excluir prompt por título
app.post('/delete-prompt', async (req, res) => {
  let { titulo } = req.body;
  try {
    await ensurePublicAndFile();
    if (!titulo) {
      return res.status(400).send('Título é obrigatório');
    }
    titulo = String(titulo).trim();

    // Lê e parseia
    let atual = await fsp.readFile(PROMPTS_FILE, 'utf8');
    atual = normalizeEOL(atual);
    const lista = parsePrompts(atual);

    const antes = lista.length;
    const nova = lista.filter(p => p.titulo.toLowerCase() !== titulo.toLowerCase());

    if (nova.length === antes) {
      return res.status(404).send('Título não encontrado');
    }

    const novoConteudo = nova.length ? nova.map(blocoToText).join(SEP) + SEP : '';
    await fsp.writeFile(TEMP_FILE, novoConteudo, 'utf8');
    await fsp.rename(TEMP_FILE, PROMPTS_FILE);

    return res.status(200).send('Prompt excluído com sucesso');
  } catch (e) {
    console.error('Falha ao excluir prompt:', e);
    try { await fsp.unlink(TEMP_FILE); } catch {}
    return res.status(500).send('Erro ao excluir o prompt');
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Pasta pública:', PUBLIC_DIR);
  console.log('Arquivo de prompts:', PROMPTS_FILE);
});
