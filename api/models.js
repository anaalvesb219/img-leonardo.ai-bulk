const { config } = require('dotenv');

// Carrega variáveis de ambiente
config();

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

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
    
    // Retornar lista de modelos
    return res.status(200).json({ models: defaultModels });
    
  } catch (error) {
    console.error('Erro ao processar modelos:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar modelos' });
  }
} 