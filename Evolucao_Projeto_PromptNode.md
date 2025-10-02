# 📑 Evolução do Projeto PromptNode  
**Histórico das modificações e decisões**  

## 1. Concepção inicial
- Página HTML simples para exibir prompts.  
- Uso do Bootstrap para layout responsivo.  
- Leitura de prompts a partir de `prompts.txt`.  
- Estrutura: **Título, Descrição, Tags**.

## 2. Melhorias de layout e funcionalidades
- Cards em três colunas.  
- Paleta de cores azul royal + laranja.  
- Pesquisa por título e combo de tags.  
- Filtro por tags, clique simples e duplo clique para limpar.

## 3. Interatividade avançada
- Copiar texto selecionado (ícone 📋).  
- Ajustes de usabilidade e correções de ícones duplicados.

## 4. Paginação
- Exibição de 6 prompts por página.  
- Botões Anterior / Próxima + números de página.  
- Paginação no topo e rodapé.  
- Estado da página preservado ao limpar filtros.

## 5. Estrutura de projeto mais profissional
- Separação em HTML, CSS e JS.  
- Preparação para Node.js.  
- `server.js` simples para servir arquivos.  
- Página `pagina_adicionar_prompt.html` criada.

## 6. CRUD de prompts
- Inclusão de novos prompts com separação correta.  
- Suporte a linhas em branco na descrição.  
- Exclusão de prompts implementada.  
- Correções de bugs na gravação e carregamento.

## 7. Refinamentos visuais
- Altura uniforme dos cards.  
- Rolagem da descrição em cards.  
- Limpeza do `style.css` e centralização do CSS.

## 8. Funcionalidades adicionais
- Função `linkify` para URLs e e-mails clicáveis.  
- Pré-visualização de descrição com links na página de edição.  
- Ajustes no fluxo de edição (abrir com título selecionado).

## 9. Integração com GitHub
- Roteiro para criar repositório e versionar o projeto.  
- Configuração de Git local (`user.name`, `user.email`).  
- `git init`, `add`, `commit`, `push`.  
- Criação de `.gitignore` para Node.js e frontend.  
- Indicação de extensões VS Code para commits automáticos.

---

# 📌 Conclusão
O projeto evoluiu de uma página estática para um **mini-sistema completo de gerenciamento de prompts**:  
- Exibição, pesquisa, filtro e paginação.  
- CRUD (criar, editar, excluir).  
- Layout responsivo com Bootstrap.  
- Estrutura organizada (HTML + CSS + Node.js).  
- Preparado para versionamento no GitHub.
