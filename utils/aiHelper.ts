
import { GoogleGenAI, Type } from "@google/genai";

// Ensure API Key exists
const apiKey = process.env.API_KEY || (import.meta as any).env.VITE_GOOGLE_API_KEY;

export const generateEditedImage = async (imageBase64: string, prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Extract clean base64 data and mime type
  const mimeTypeMatch = imageBase64.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
  const data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("The model did not return an image.");
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const generatePromoStrategy = async (stats: any): Promise<{ title: string, description: string, imagePrompt: string }> => {
    if (!apiKey) throw new Error("API Key missing.");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        You are a restaurant marketing expert. 
        Here are the sales stats: ${JSON.stringify(stats)}.
        Based on this data, suggest a promotional offer to boost sales.
        1. Identify if sales are low (needs urgency) or high (needs upsell).
        2. Create a catchy Title (max 40 chars).
        3. Create a short, persuasive Description (max 100 chars).
        4. Write a visual image prompt to generate a banner for this food offer (be descriptive, appetizing, high resolution, 4k).
        
        Return JSON.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING }
                },
                required: ["title", "description", "imagePrompt"]
            }
        }
    });

    return JSON.parse(response.text || '{}');
};

export const generatePromoImage = async (imagePrompt: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key missing.");
    const ai = new GoogleGenAI({ apiKey });

    try {
        // Using Gemini 2.5 Flash Image for broader availability than Imagen
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: `Professional food photography, appetizing banner, ${imagePrompt}, warm lighting, 4k resolution, no text` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9"
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        
        throw new Error("No image generated.");
    } catch (e) {
        console.error("Image Generation Error", e);
        throw e;
    }
};
