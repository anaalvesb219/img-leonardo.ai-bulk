/**
 * Servidor proxy para a API do Leonardo AI
 * Este servidor contorna problemas de CORS encaminhando requisições do frontend para a API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuração do aplicativo
const app = express();
const PORT = process.env.PORT || 3001;
const LEONARDO_API_BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';

// Middlewares
app.use(cors({
  origin: '*', // Permite acesso de qualquer origem
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' })); // Aumenta o limite para facilitar envio de imagens
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para debug de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rota para verificar se o servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor proxy para Leonardo AI está funcionando' });
});

// Rota API de geração
app.post('/api/generate', async (req, res) => {
  // Validação básica do payload
  const { prompt, modelId } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt é obrigatório' });
  }
  
  try {
    const apiKey = process.env.LEONARDO_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key não configurada no .env' });
    }
    
    // Encaminhar para a API do Leonardo
    const response = await axios.post(
      `${LEONARDO_API_BASE_URL}/generations`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.json(response.data);
  } catch (error) {
    console.error('Erro na requisição para a API do Leonardo:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Endpoint para obter a chave API do arquivo .env
app.get('/api/key', (req, res) => {
  const apiKey = process.env.LEONARDO_API_KEY;
  
  // Log para debug
  console.log('Requisição para /api/key recebida. Chave encontrada:', !!apiKey);
  
  if (!apiKey || apiKey === 'sua_chave_api_aqui') {
    console.log('Chave API não encontrada ou é o valor padrão');
    return res.status(404).json({ error: 'API key não configurada no arquivo .env' });
  }
  
  // Se chegou até aqui, tem uma chave válida
  console.log('Retornando chave API com sucesso');
  return res.status(200).json({ key: apiKey });
});

// Endpoint para salvar a chave API no arquivo .env
app.post('/api/key', (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Chave API não fornecida' });
  }
  
  try {
    const envPath = path.resolve('./.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Substitui a chave existente ou adiciona se não existir
    if (envContent.includes('LEONARDO_API_KEY=')) {
      envContent = envContent.replace(/LEONARDO_API_KEY=.*/, `LEONARDO_API_KEY=${key}`);
    } else {
      envContent += `\nLEONARDO_API_KEY=${key}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    process.env.LEONARDO_API_KEY = key;
    
    return res.json({ success: true, message: 'Chave API salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar a chave API:', error);
    return res.status(500).json({ error: 'Erro ao salvar a chave API' });
  }
});

// Endpoint para buscar modelos
app.get('/api/models', async (req, res) => {
  try {
    const apiKey = process.env.LEONARDO_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Chave API não configurada no .env' });
    }
    
    console.log('Usando lista de modelos padrão para evitar problemas de API');
    
    // Lista de modelos padrão conhecidos do Leonardo AI
    const defaultModels = [
      { id: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', name: 'Leonardo Phoenix 1.0', modelType: 'Phoenix' },
      { id: '6b645e3a-d64f-4341-a6d8-7a3690fbf042', name: 'Leonardo Phoenix 0.9', modelType: 'Phoenix' },
      { id: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8', name: 'Leonardo Anime XL', modelType: 'Anime' },
      { id: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', name: 'Leonardo Lightning XL', modelType: 'Texto para Imagem' },
      { id: 'aa77f04e-3eec-4034-9c07-d0f619684628', name: 'Leonardo Kino XL', modelType: 'PhotoReal' },
      { id: '5c232a9e-9061-4777-980a-ddc8e65647c6', name: 'Leonardo Vision XL', modelType: 'PhotoReal' },
      { id: '1e60896f-3c26-4296-8ecc-53e2afecc132', name: 'Leonardo Diffusion XL', modelType: 'PhotoReal' },
      { id: '2067ae52-33fd-4a82-bb92-c2c55e7d2786', name: 'AlbedoBase XL', modelType: 'Texto para Imagem' },
      { id: 'f1929ea3-b169-4c18-a16c-5d58b4292c69', name: 'RPG v5', modelType: 'RPG' },
      { id: '16e7060a-803e-4df3-97ee-edcfa5dc9cc8', name: 'SDXL 1.0', modelType: 'Texto para Imagem' },
      { id: 'b63f7119-31dc-4540-969b-2a9df997e173', name: 'SDXL 0.9', modelType: 'Texto para Imagem' },
      { id: 'ac614f96-1082-45bf-be9d-757f2d31c174', name: 'DreamShaper v7', modelType: 'Texto para Imagem' },
      { id: 'b2614463-296c-462a-9586-aafdb8f00e36', name: 'Flux Dev', modelType: 'Flux' },
      { id: '1dd50843-d653-4516-a8e3-f0238ee453ff', name: 'Flux Schnell', modelType: 'Flux' },
      { id: 'd69c8273-6b17-4a30-a13e-d6637ae1c644', name: '3D Animation Style', modelType: 'Estilizado' },
      { id: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', name: 'Leonardo Creative', modelType: 'Texto para Imagem' },
      { id: 'cd2b2a15-9760-4174-a5ff-4d2925057376', name: 'Leonardo Select', modelType: 'Texto para Imagem' },
      { id: '291be633-cb24-434f-898f-e662799936ad', name: 'Leonardo Signature', modelType: 'Texto para Imagem' }
    ];
    
    // Retornar lista padrão diretamente sem tentativas de API
    console.log(`Retornando ${defaultModels.length} modelos padrão`);
    return res.json({ models: defaultModels });
    
  } catch (error) {
    console.error('Erro ao processar modelos:', error.message);
    
    // Retorna modelos padrão em caso de falha
    const defaultModels = [
      { id: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', name: 'Leonardo Phoenix 1.0', modelType: 'Phoenix' },
      // Versão resumida por brevidade
      { id: '1dd50843-d653-4516-a8e3-f0238ee453ff', name: 'Flux Schnell', modelType: 'Flux' }
    ];
    
    console.log('Retornando modelos padrão devido a erro na API');
    return res.json({ models: defaultModels });
  }
});

// Servir a aplicação frontend para qualquer outra rota
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse a aplicação em http://localhost:${PORT}`);
  console.log(`API Key ${process.env.LEONARDO_API_KEY ? 'encontrada' : 'não configurada'} no arquivo .env`);
});