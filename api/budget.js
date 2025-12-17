// Vercel Serverless Function - Protege a API Key do Gemini
// Esta função roda no servidor, não expondo a key para o frontend

import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { location, items } = req.body;

  if (!location || !items || items.length === 0) {
    return res.status(400).json({ error: 'Localização e lista de itens são obrigatórios' });
  }

  // API Key do Gemini - Configure como variável de ambiente no Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY não configurada');
    return res.status(500).json({ error: 'Serviço de orçamento temporariamente indisponível' });
  }

  try {
    const prompt = `
      Atue como um especialista em preços de mercado no Brasil.
      Localização do usuário: ${location}.
      
      Calcule o preço estimado total para cada linha de item abaixo considerando preços médios de supermercado nesta região.
      Lista de Itens:
      ${items.join('\n')}

      Retorne APENAS um JSON válido (sem markdown, sem explicações) no seguinte formato:
      {
        "items": [
          { "name": "Nome do item (ex: Picanha)", "estimatedPrice": 150.00, "unitDetail": "R$ X/kg" }
        ],
        "total": 500.00
      }
      Seja realista com a inflação atual de carnes e bebidas no Brasil em ${new Date().getFullYear()}.
    `;

    // Inicializa o cliente do Google Generative AI
    const ai = new GoogleGenAI({ apiKey });

    // Chama a API usando o SDK
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    const textResponse = response.text;
    
    if (!textResponse) {
      throw new Error('Resposta vazia do Gemini');
    }

    const jsonResponse = JSON.parse(textResponse);
    
    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Budget API Error:', error);
    return res.status(500).json({ 
      error: 'Não foi possível calcular o orçamento. Tente novamente mais tarde.' 
    });
  }
}

