import { GoogleGenAI } from "@google/genai";

export async function generateMenuBackground() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A high-quality, realistic photo of a black man with afro hair, wearing glasses and a red soccer jersey with black details, holding a classic arcade video game controller, professional studio lighting, clean background.',
        },
      ],
    },
    config: {
      imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
        },
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateGameAvatar(gameTitle: string, description: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const prompt = `Estilo animação 3D realista (estilo Pixar/Disney moderno), ícone centralizado para o jogo "${gameTitle}". Descrição: ${description}. Iluminação cinematográfica, cores vibrantes, fundo limpo.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        },
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error(`Erro ao gerar avatar para ${gameTitle}:`, e);
  }
  return null;
}
