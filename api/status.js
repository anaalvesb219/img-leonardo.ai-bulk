import { config } from 'dotenv';

// Carrega variáveis de ambiente
config();

export default async function handler(req, res) {
  // Apenas GET é permitido
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }
  
  try {
    // Verifica se a API key está configurada
    const hasApiKey = !!process.env.LEONARDO_API_KEY;
    
    // Retorna o status do servidor
    return res.status(200).json({
      status: 'online',
      timestamp: new Date().toISOString(),
      hasApiKey,
      version: '1.0.0',
      apiType: 'serverless',
      provider: 'vercel'
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ 
      error: 'Erro ao verificar status do servidor',
      message: error.message 
    });
  }
} 