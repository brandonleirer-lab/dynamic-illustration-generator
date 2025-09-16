// services/geminiService.ts
import type { Modality } from "@google/genai";

interface VariationResult {
    imageUrl: string;
    textResponse: string;
}

export const generateImageVariation = async (
    base64Image: string,
    mimeType: string,
    prompt: string
): Promise<VariationResult> => {
    try {
        // This now calls our own server's /api/generate endpoint
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemini-1.5-flash-latest',
                contents: {
                    parts: [
                        { inlineData: { data: base64Image, mimeType: mimeType } },
                        { text: prompt },
                    ],
                },
                config: { responseMimeType: "image/png" },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }
        const data = await response.json();

        if (!data.candidates?.length) throw new Error("No candidates returned from the API.");

        const candidate = data.candidates[0];
        const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
        const textPart = candidate.content.parts.find((p: any) => p.text);

        if (!imagePart) throw new Error("API did not return an image.");

        return {
            imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
            textResponse: textPart ? textPart.text : '',
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to generate variation for prompt "${prompt}": ${errorMessage}`);
    }
};