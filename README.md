# IMG-LEONARDO.AI-BULK

Aplicativo para geração em massa de imagens usando a API do Leonardo AI. Esta ferramenta permite produzir múltiplas imagens a partir de prompts de texto, aproveitando os modelos avançados de IA do Leonardo.

![Leonardo AI Bulk Generator](https://leonardo.ai/static/logo-7a60a3e0b6b3d0fa411630a9ec6cc172.svg)

## 📋 Funcionalidades

- **Geração em Massa:** Crie várias imagens a partir de múltiplos prompts de texto
- **Prompt Negativo:** Especifique elementos que você NÃO deseja ver nas imagens geradas
- **Múltiplos Modelos:** Suporte para todos os modelos disponíveis no Leonardo AI
- **Configurações Avançadas:**
  - Dimensões personalizáveis (largura e altura)
  - Número de imagens por prompt
  - Parâmetros de guidance scale
- **Modos Especiais:**
  - Modo PhotoReal para imagens realistas
  - Modo Phoenix para alta qualidade
  - Modo Flux para geração rápida
- **Gerenciamento de API Key:** Interface para inserir e salvar sua chave API do Leonardo
- **Download em Lote:** Baixe todas as imagens geradas de uma só vez

## 🚀 Primeiros Passos

### Pré-requisitos

- Node.js instalado
- Uma conta no [Leonardo AI](https://leonardo.ai) com API key
- Conexão com a internet

### Instalação

1. Clone este repositório ou baixe os arquivos
2. Instale as dependências necessárias:
   ```
   npm install
   ```
3. Configure seu arquivo `.env` com sua chave API:
   ```
   LEONARDO_API_KEY=sua_chave_api_aqui
   ```
   Você também pode adicionar a chave mais tarde pela interface do aplicativo

4. Inicie o servidor proxy:
   ```
   npm start
   ```
   ou
   ```
   node server.js
   ```

5. Acesse a aplicação em: http://localhost:3001

## 🔧 Guia de Uso

### Inserir Prompts

1. Digite um ou mais prompts na área de texto principal (um por linha)
2. Opcionalmente, adicione um **prompt negativo** para elementos que você NÃO deseja nas imagens
3. Selecione o modelo AI desejado no menu suspenso 
4. Ajuste as configurações conforme necessário:
   - Dimensões (largura x altura)
   - Número de imagens por prompt (máximo 4)
   - Ative modos especiais (PhotoReal, Phoenix, Flux) para modelos compatíveis

### Gerar Imagens

1. Clique no botão "Gerar Imagens"
2. Aguarde o processamento - você verá placeholders enquanto as imagens são geradas
3. O progresso é mostrado em tempo real
4. Ao concluir, as imagens aparecem na galeria de resultados

### Baixar Resultados

- Use o botão "Baixar Todas as Imagens" para fazer download de todas as imagens geradas
- Cada imagem também tem seu próprio botão de download individual

## 📊 Modelos Suportados

O aplicativo suporta todos os modelos disponíveis na API do Leonardo, incluindo:

- Leonardo Phoenix 1.0 e 0.9
- Leonardo Anime XL
- Leonardo Lightning XL
- Leonardo Kino XL
- Leonardo Vision XL
- Leonardo Diffusion XL
- AlbedoBase XL
- RPG v5
- SDXL 1.0 e 0.9
- DreamShaper v7
- Flux Dev e Flux Schnell
- 3D Animation Style
- Leonardo Creative, Select e Signature

## ⚠️ Resolução de Problemas

### Problemas de CORS

Se encontrar problemas de CORS, você tem algumas opções:

1. **Usar o Servidor Proxy (já incluído):** O `server.js` já funciona como proxy para evitar problemas de CORS
2. **Extensões de Navegador:**
   - Chrome: [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)
   - Firefox: [CORS Everywhere](https://addons.mozilla.org/pt-BR/firefox/addon/cors-everywhere/)

### Prompt Negativo Não Funcionando

- Certifique-se de que está usando um modelo compatível com prompts negativos
- Verifique os logs para confirmar que o prompt negativo está sendo enviado
- Tente usar termos mais diretos e específicos no prompt negativo

### Erro ao Buscar Modelos

- O aplicativo usa uma lista interna de modelos em caso de falha na comunicação com a API
- Verifique se sua API key está correta
- Confirme que tem acesso aos modelos em sua conta do Leonardo AI

## 🔒 Segurança

- Sua API key é armazenada localmente no arquivo `.env`
- O servidor proxy roda apenas em seu computador local
- Nenhum dado é enviado para servidores externos além da API oficial do Leonardo

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## 📞 Contato

Para questões ou suporte, por favor abra uma issue no repositório.

---

© Ana Alves - SolucionAI Studio 