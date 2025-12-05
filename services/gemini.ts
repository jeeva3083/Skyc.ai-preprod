import { GoogleGenAI, Tool } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are Skyc.ai, a privacy-first enterprise AI assistant based in Switzerland. 
You act as a secure agent for a large corporation.
Your tone is professional, concise, and executive-ready.
You are role-aware. 
If the user is a CEO, provide strategic summaries and risk analysis.
If the user is an Analyst, provide detailed data breakdowns.
When asked about "Internal Data", assume you have access to secure email and document repositories (simulated).
Always emphasize security and data privacy in your responses.`;

export const generateAgentResponse = async (
  prompt: string,
  role: string,
  isInternal: boolean
): Promise<{ text: string; groundingChunks?: any[] }> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    // Enrich prompt with context
    const contextualPrompt = `
    [User Role: ${role}]
    [Mode: ${isInternal ? 'PRIVATE INTERNAL INTRANET' : 'PUBLIC INTERNET VERIFICATION'}]
    
    User Query: ${prompt}
    `;

    // Only enable Google Search for External Agents
    let tools: Tool[] | undefined;
    if (!isInternal) {
      tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contextualPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: tools,
      }
    });

    const text = response.text || "I apologize, but I could not generate a response at this time.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { text, groundingChunks };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Skyc.ai Agent Error: Unable to process request due to connection or policy restrictions." };
  }
};

export const generateInsight = async (dataContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this data context and provide a single sentence executive insight: ${dataContext}`,
    });
    return response.text || "No insight available.";
  } catch (error) {
    return "Insight generation failed.";
  }
};
