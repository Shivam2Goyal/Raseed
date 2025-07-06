import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";
import { extractedReceiptDataSchema, type ExtractedReceiptData } from "@shared/schema";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

export class GeminiReceiptService {
  // Phase 2: Item categorization
  async categorizeItem(itemDescription: string): Promise<{ category: string; confidence: string }> {
    try {
      const prompt = `Given the item description: '${itemDescription}', categorize it into one of the following: 'Groceries', 'Electronics', 'Clothing', 'Restaurants', 'Subscriptions', 'Utilities', 'General Merchandise'. Also provide a confidence score from 0 to 1. Respond only with JSON format: {"category": "category_name", "confidence": "0.95"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              category: { type: "string" },
              confidence: { type: "string" },
            },
            required: ["category", "confidence"],
          },
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (rawJson) {
        const data = JSON.parse(rawJson);
        return {
          category: data.category || "General Merchandise",
          confidence: data.confidence || "0.5"
        };
      } else {
        throw new Error("Empty response from Gemini model");
      }
    } catch (error) {
      console.error("Error categorizing item:", error);
      return {
        category: "General Merchandise",
        confidence: "0.1"
      };
    }
  }

  // Phase 4: Generate spending insights
  async generateSpendingInsight(spendingData: any[]): Promise<{ insightText: string; insightType: string }> {
    try {
      const prompt = `Analyze this user's spending data for the last 30 days. Identify one key insight. This could be a trend (e.g., spending on 'Restaurants' is up 20%), a new recurring subscription, or an opportunity to save (e.g., 'They buy Brand X coffee every week; Brand Y is cheaper'). Formulate this insight as a short, actionable sentence. Respond in JSON format: {"insightText": "Your spending on restaurants is trending up this month.", "insightType": "trend"}

Spending data: ${JSON.stringify(spendingData)}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              insightText: { type: "string" },
              insightType: { type: "string" },
            },
            required: ["insightText", "insightType"],
          },
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (rawJson) {
        const data = JSON.parse(rawJson);
        return {
          insightText: data.insightText || "Keep tracking your spending for better insights!",
          insightType: data.insightType || "general"
        };
      } else {
        throw new Error("Empty response from Gemini model");
      }
    } catch (error) {
      console.error("Error generating insight:", error);
      return {
        insightText: "Keep tracking your spending for better insights!",
        insightType: "general"
      };
    }
  }

  // Phase 3: Chat functionality for conversational AI assistant with Firebase data access
  async processUserQuery(message: string, userContext: any = {}): Promise<string> {
    try {
      // Enhanced system prompt with better financial assistant capabilities
      const systemPrompt = `You are Raseed, an advanced AI financial assistant specializing in receipt management and spending analysis. Your capabilities include:

1. **Receipt Analysis**: Analyze user receipts and spending patterns from their data
2. **Financial Insights**: Provide actionable insights about spending habits and trends
3. **Smart Recommendations**: Suggest ways to save money or optimize purchases
4. **Inventory Tracking**: Help users track what they've bought and what they might need
5. **Shopping Assistance**: Create smart shopping lists based on purchase history
6. **Budget Planning**: Help with budgeting and financial planning

IMPORTANT: You have access to the user's real receipt data stored in Firebase. Use this data to provide accurate, personalized responses. When referencing specific purchases, dates, or amounts, use the actual data from their receipts.

User Context and Data: ${JSON.stringify(userContext)}

Guidelines:
- Be conversational yet professional
- Provide specific, actionable advice
- Reference actual purchase data when relevant
- Ask clarifying questions when needed
- Suggest concrete next steps
- Focus on helping users make better financial decisions

Respond helpfully and reference their actual receipt data when answering questions about spending, purchases, or financial habits.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
        contents: message,
      });

      return response.text || "I'm here to help with your financial questions! Could you tell me more about what you'd like to know?";
    } catch (error) {
      console.error("Error processing user query:", error);
      return "I'm having trouble processing your request right now. Please try again.";
    }
  }

  async extractReceiptData(imageData: string, mimeType: string): Promise<ExtractedReceiptData> {
    try {
      const systemPrompt = `You are a receipt data extraction expert. 
Analyze this receipt image and extract the following information in a structured JSON format:
- store_name: string (the name of the store/business)
- transaction_date: string (in YYYY-MM-DD format, if not found use null)
- total_amount: number (the final total amount paid, as a number)
- tax_amount: number (the tax amount, as a number, if not found use null)
- line_items: array of objects, where each object has:
  - description: string (item name/description)
  - quantity: number (quantity purchased)
  - price: number (total price for this line item as a number)

Important guidelines:
- Extract all amounts as numbers (no currency symbols)
- If you cannot determine a value, use null
- For line_items, only include actual purchased items, not subtotals or fees
- Be as accurate as possible with the extracted data
- If the image is unclear or not a receipt, return all null values`;

      const contents = [
        {
          inlineData: {
            data: imageData,
            mimeType: mimeType,
          },
        },
        systemPrompt,
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              store_name: { type: "string" },
              transaction_date: { type: "string" },
              total_amount: { type: "number" },
              tax_amount: { type: "number" },
              line_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    quantity: { type: "number" },
                    price: { type: "number" },
                  },
                  required: ["description", "quantity", "price"],
                },
              },
            },
            required: ["store_name", "transaction_date", "total_amount", "tax_amount", "line_items"],
          },
        },
        contents: contents,
      });

      const rawJson = response.text;
      console.log(`Raw JSON response: ${rawJson}`);

      if (rawJson) {
        const parsedData = JSON.parse(rawJson);
        const validatedData = extractedReceiptDataSchema.parse(parsedData);
        return validatedData;
      } else {
        throw new Error("Empty response from Gemini model");
      }
    } catch (error) {
      console.error("Error extracting receipt data:", error);
      throw new Error(`Failed to extract receipt data: ${error}`);
    }
  }
}

export const geminiService = new GeminiReceiptService();
