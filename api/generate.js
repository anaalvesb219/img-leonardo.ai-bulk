// /api/generate.js
const { config } = require('dotenv');
const axios = require('axios');

// Carrega variáveis de ambiente
config();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const {
    prompt,
    width,
    height,
    num_images,
    guidance_scale,
    modelId,
    negative_prompt
  } = req.body;

  // validações simples
  if (!prompt) return res.status(400).json({error: 'prompt requerido'});

  try {
    const apiKey = process.env.LEONARDO_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({error: 'Chave API não configurada'});
    }
    
    // Montando o payload com todos os campos, incluindo negative_prompt
    const payload = {
      prompt,
      modelId,
      width: width || 512,
      height: height || 512,
      num_images: num_images || 1,
      guidance_scale: guidance_scale || 7
    };
    
    // Adiciona negative_prompt apenas se existir
    if (negative_prompt) {
      console.log(`Usando negative prompt: "${negative_prompt}"`);
      payload.negative_prompt = negative_prompt;
    }
    
    const response = await axios.post(
      'https://cloud.leonardo.ai/api/rest/v1/generations',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Erro na geração:', err.response?.data || err.message);
    
    // Verifica se há detalhes específicos do erro
    if (err.response?.data) {
      return res.status(err.response.status || 500).json({
        error: 'Falha na geração',
        details: err.response.data
      });
    }
    
    res.status(500).json({error: 'Falha na geração'});
  }
} 