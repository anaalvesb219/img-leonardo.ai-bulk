// /api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const {
    prompt,
    width,
    height,
    num_images,
    guidance_scale,
    modelId
  } = req.body;

  // validações simples
  if (!prompt) return res.status(400).json({error: 'prompt requerido'});

  try {
    const response = await axios.post(
      'https://cloud.leonardo.ai/api/rest/v1/generations',
      {
        prompt,
        width,
        height,
        num_images,
        guidance_scale,
        modelId
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LEONARDO_API_KEY}`
        }
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({error: 'Falha na geração'});
  }
} 