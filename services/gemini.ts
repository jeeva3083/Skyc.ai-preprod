import { GoogleGenAI, Tool, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are Skyc.ai, a privacy-first enterprise AI assistant. 
You act as a secure agent for a large corporation.
Your tone is professional, concise, and executive-ready.
If the user is a CEO, provide strategic summaries.
Always emphasize security and data privacy in your responses.`;

interface AgentOptions {
  isInternal: boolean;
  useSearch: boolean;
  useMaps: boolean;
  fastMode: boolean; // Bolt: use Flash Lite
  imagePart?: { inlineData: { data: string; mimeType: string } };
  videoPart?: { inlineData: { data: string; mimeType: string } };
  audioPart?: { inlineData: { data: string; mimeType: string } };
}

// Main Agent Response Generator
export const generateAgentResponse = async (
  prompt: string,
  role: string,
  options: AgentOptions
): Promise<{ text: string; groundingChunks?: any[] }> => {
  try {
    // Model Selection Strategy
    let modelId = 'gemini-2.5-flash'; // Default
    if (options.fastMode) modelId = 'gemini-2.5-flash-lite-latest'; // Fast AI Response (Bolt)
    if (options.imagePart || options.videoPart) modelId = 'gemini-3-pro-preview'; // Vision/Video Understanding
    if (options.audioPart) modelId = 'gemini-2.5-flash'; // Audio Transcription

    // Construct Content Parts
    const parts: any[] = [];
    
    // Add Multimedia Context
    if (options.imagePart) parts.push(options.imagePart);
    if (options.videoPart) parts.push(options.videoPart);
    if (options.audioPart) parts.push(options.audioPart);
    
    // Enrich Prompt
    let textPrompt = prompt;
    if (options.audioPart) textPrompt = `Transcribe this audio and answer: ${prompt}`;
    else if (options.videoPart) textPrompt = `Analyze this video: ${prompt}`;
    else if (options.imagePart) textPrompt = `Analyze this image: ${prompt}`;
    
    parts.push({ text: `[User Role: ${role}] ${textPrompt}` });

    // Configure Tools (Search / Maps)
    const tools: Tool[] = [];
    if (options.useSearch) tools.push({ googleSearch: {} }); // Google Search Grounding
    if (options.useMaps) tools.push({ googleMaps: {} }); // Google Maps Grounding

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: tools.length > 0 ? tools : undefined,
      }
    });

    const text = response.text || "I apologize, but I could not generate a response.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { text, groundingChunks };
  } catch (error) {
    console.error("Gemini Agent Error:", error);
    return { text: "Skyc.ai Agent Error: Unable to process request due to connection or policy restrictions." };
  }
};

// Veo Video Generation (Prompt or Image based)
export const generateVeoVideo = async (prompt: string, imageBase64?: string): Promise<string | undefined> => {
    try {
        let operation;
        if (imageBase64) {
             // Image-to-Video
             operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                image: { imageBytes: imageBase64, mimeType: 'image/png' },
                prompt: prompt || "Animate this image",
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
             });
        } else {
             // Text-to-Video
             operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
             });
        }
        
        // Polling for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        // Return URI (Frontend will append API Key)
        return operation.response?.generatedVideos?.[0]?.video?.uri;
    } catch (e) {
        console.error("Veo Error", e);
        throw e;
    }
};

// Text-to-Speech Generation
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error("TTS Error", e);
    return undefined;
  }
};

// Dashboard Insight Helper
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

// Presentation Structure Generation
export const generatePresentationStructure = async (topic: string): Promise<{ title: string; content: string }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `You are a presentation expert. Create a structured 5-slide outline for a presentation about: "${topic}".
      
      Return ONLY valid JSON array. No markdown formatting.
      Format:
      [
        { "title": "Slide Title", "points": ["Bullet 1", "Bullet 2", "Bullet 3"] }
      ]`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text).map((s: any) => ({
        title: s.title,
        content: s.points.join('\n• ')
    }));
  } catch (error) {
    console.error("Presentation Gen Error", error);
    return [];
  }
};

interface WhiteboardCommandOptions {
    useSearch?: boolean;
    useMaps?: boolean;
    fastMode?: boolean;
}

// Interpret Whiteboard Natural Language Commands
export const interpretWhiteboardCommand = async (command: string, currentNodes: any[], options?: WhiteboardCommandOptions): Promise<any[]> => {
    try {
        const tools: Tool[] = [];
        if (options?.useSearch) tools.push({ googleSearch: {} });
        if (options?.useMaps) tools.push({ googleMaps: {} });
        
        // Note: For complex reasoning + JSON output with Tools, using Pro model is safer
        const modelId = options?.fastMode ? 'gemini-2.5-flash-lite-latest' : 'gemini-2.5-flash';

        const response = await ai.models.generateContent({
            model: modelId,
            contents: `You are a workspace automation agent. The user wants to manipulate a whiteboard.
            Current nodes summary: ${JSON.stringify(currentNodes.map(n => ({ id: n.id, content: n.content })))}
            User Command: "${command}"
            
            ${options?.useSearch ? 'IMPORTANT: You have access to Google Search. Use it to find real-world information (facts, news, data) if the user asks, and create nodes containing that information.' : ''}
            ${options?.useMaps ? 'IMPORTANT: You have access to Google Maps. Use it to find locations if asked.' : ''}

            Return a valid JSON array of actions. Supported actions:
            - create_node: { "action": "create_node", "params": { "type": "note" | "process" | "file", "content": "...", "x": 100, "y": 100 } }
            - connect_nodes: { "action": "connect_nodes", "params": { "from_content_match": "string", "to_content_match": "string" } }
            
            Logic:
            - If user asks to "create a plan for X", create multiple connected nodes.
            - If user says "connect X to Y", output connection action.
            - If you searched for info, put the findings into the "content" of "note" nodes.
            
            Return ONLY JSON.`,
            config: { 
                responseMimeType: 'application/json',
                tools: tools.length > 0 ? tools : undefined
            }
        });
        
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Whiteboard AI Error", e);
        return [];
    }
}