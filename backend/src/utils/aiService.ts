import OpenAI from 'openai';
import axios from 'axios';

const GEMMA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const GEMMA_MODEL = "google/gemma-3n-e4b-it";

/**
 * Centralized Gemma AI caller via NVIDIA API.
 * Sends a prompt and returns parsed JSON.
 */
export async function callGemma(prompt: string, maxTokens: number = 1024): Promise<any> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        throw new Error('NVIDIA_API_KEY is not set in environment variables.');
    }

    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
    };

    const payload = {
        model: GEMMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.20,
        top_p: 0.70,
        stream: false
    };

    const response = await axios.post(GEMMA_INVOKE_URL, payload, { headers });
    let content: string = response.data.choices[0].message.content;

    // Strip potential markdown code fences
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    return JSON.parse(content);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeJobDescription = async (description: string) => {
    try {
        const prompt = `You are an expert HR AI assistant. Analyze the given job description for biased, non-inclusive language (e.g. "rockstar", "ninja", gendered terms, aggressive phrasing) and suggest a more professional, inclusive version.
Also, provide a list of recommended keywords based on modern industry standards for the role described.

Job Description:
"""
${description}
"""

Return your analysis in raw JSON format exactly like this:
{
    "suggestedDescription": "string (the improved, inclusive job description)",
    "biasedTermsFound": ["string", "string"],
    "recommendedKeywords": ["string", "string", "string"],
    "inclusivityScore": number (0-100 indicating how inclusive the original was)
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        return {
            original: description,
            suggestedDescription: result.suggestedDescription || description,
            biasedTermsFound: result.biasedTermsFound || [],
            recommendedKeywords: result.recommendedKeywords || [],
            inclusivityScore: result.inclusivityScore || 100
        };
    } catch (error) {
        console.error("AI Error (Job Analysis):", error);
        // Fallback to basic if AI fails
        return {
            original: description,
            suggestedDescription: description,
            biasedTermsFound: [],
            recommendedKeywords: ["Error communicating with AI"],
            inclusivityScore: 100
        };
    }
};

export const analyzeSurveySentiment = async (comments: string[]) => {
    try {
        if (!comments || comments.length === 0) {
            return { score: 50, sentiment: 'NEUTRAL', topThemes: [] };
        }

        const prompt = `You are an expert psychological AI for HR. Read the following anonymous free-text comments from an employee pulse survey.
Provide an overarching sentiment score on a scale from 0 to 100 (where 0 is completely negative, 50 is neutral, and 100 is completely positive).
Also determine the primary overriding sentiment ('POSITIVE', 'NEGATIVE', or 'NEUTRAL') and extract up to 3 major themes from the comments.

Comments:
"""
- ${comments.join('\n- ')}
"""

Return your analysis in raw JSON format exactly like this:
{
    "score": number (0 to 100),
    "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
    "topThemes": ["string", "string", "string"]
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        return {
            score: result.score ?? 50,
            sentiment: result.sentiment || 'NEUTRAL',
            topThemes: result.topThemes || []
        };
    } catch (error) {
        console.error("AI Error (Sentiment Analysis):", error);
        return {
            score: 50,
            sentiment: 'NEUTRAL',
            topThemes: ["Error analyzing themes"]
        };
    }
};
