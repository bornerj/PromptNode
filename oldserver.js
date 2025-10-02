
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const PORT = 3000;

app.use(express.static(__dirname)); // Servir arquivos estáticos (HTML, CSS, JS)

app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para obter prompts.txt
app.get('/prompts.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'prompts.txt'));
});

// Endpoint para adicionar novo prompt (via POST)
app.post('/add-prompt', (req, res) => {
  const { titulo, descricao, tags } = req.body;

  if (!titulo || !descricao || !tags) {
    return res.status(400).send('Campos obrigatórios não fornecidos.');
  }

  const novoPrompt = `\n\nTítulo: ${titulo}\nDescrição: ${descricao}\nTags: ${tags}`;
  fs.appendFile('prompts.txt', novoPrompt, err => {
    if (err) {
      console.error('Erro ao adicionar prompt:', err);
      return res.status(500).send('Erro ao salvar o prompt.');
    }
    res.status(200).send('Prompt adicionado com sucesso.');
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
