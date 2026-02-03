
import { GoogleGenAI, Type } from "@google/genai";
import { CycleRecord, PredictionResult, HealthReport } from "../types";

// Helper removed to ensure new instance is created right before making an API call per guidelines.

export async function getNextPeriodPrediction(history: CycleRecord[]): Promise<PredictionResult> {
  // Create a new instance right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const historyText = history.map(h => `Start: ${h.startDate}, End: ${h.endDate || 'Ongoing'}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this menstrual cycle history, predict the next period start date. History:\n${historyText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nextDate: { type: Type.STRING, description: "ISO format date YYYY-MM-DD" },
          confidence: { type: Type.NUMBER, description: "Value between 0 and 1" },
          message: { type: Type.STRING, description: "A short friendly reminder in Chinese" }
        },
        required: ["nextDate", "confidence", "message"]
      }
    }
  });

  // response.text is a property, not a method.
  const resultText = response.text || "{}";
  return JSON.parse(resultText);
}

export async function generateHealthReport(currentCycle: CycleRecord): Promise<HealthReport> {
  // Create a new instance right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const symptomsText = currentCycle.symptoms.join(', ');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The user is having their period and reporting these symptoms: ${symptomsText}. 
               Provide a personalized health report in Chinese focusing on dietary advice, exercise modifications, and rest strategies.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          advice: {
            type: Type.OBJECT,
            properties: {
              diet: { type: Type.STRING },
              exercise: { type: Type.STRING },
              rest: { type: Type.STRING }
            },
            required: ["diet", "exercise", "rest"]
          }
        },
        required: ["summary", "advice"]
      }
    }
  });

  // response.text is a property, not a method.
  const resultText = response.text || "{}";
  return JSON.parse(resultText);
}
