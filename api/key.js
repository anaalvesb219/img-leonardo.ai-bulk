const { config } = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente
config();

module.exports = async function handler(req, res) {
  // GET: Retorna a chave API
  if (req.method === 'GET') {
    try {
      const apiKey = process.env.LEONARDO_API_KEY;
      
      if (!apiKey || apiKey === 'sua_chave_api_aqui') {
        return res.status(404).json({ error: 'API key não configurada no arquivo .env' });
      }
      
      // Retorna a chave API (mascarada para segurança em logs)
      const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
      console.log(`Retornando chave API (mascarada): ${maskedKey}`);
      
      return res.status(200).json({ key: apiKey });
    } catch (error) {
      console.error('Erro ao buscar a chave API:', error);
      return res.status(500).json({ error: 'Erro ao buscar a chave API' });
    }
  }
  
  // POST: Salva a chave API
  else if (req.method === 'POST') {
    try {
      const { key } = req.body;
      
      if (!key) {
        return res.status(400).json({ error: 'Chave API não fornecida' });
      }
      
      // Em ambiente serverless não podemos escrever no .env
      // Em vez disso, configuramos a variável em tempo de execução
      process.env.LEONARDO_API_KEY = key;
      
      // Nota: em um ambiente de produção real, seria necessário
      // salvar esta chave em um armazenamento mais permanente
      // como uma variável de ambiente do Vercel ou um banco de dados
      
      return res.status(200).json({ 
        success: true, 
        message: 'Chave API salva temporariamente (para persistência, configure nas variáveis de ambiente do Vercel)' 
      });
    } catch (error) {
      console.error('Erro ao salvar a chave API:', error);
      return res.status(500).json({ error: 'Erro ao salvar a chave API' });
    }
  }
  
  // Outros métodos HTTP não são permitidos
  else {
    return res.status(405).end('Method Not Allowed');
  }
} 