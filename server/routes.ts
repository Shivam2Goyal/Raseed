import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { geminiService } from "./services/gemini";
import { walletService } from "./services/wallet";
import { contextService } from "./services/context";
import { 
  processReceiptSchema, 
  extractedReceiptDataSchema, 
  spendingAnalysisRequestSchema,
  chatMessageSchema 
} from "@shared/schema";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Process receipt endpoint
  app.post("/api/receipts/process", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const imageData = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;

      // Validate the request
      const validatedData = processReceiptSchema.parse({
        imageData,
        mimeType
      });

      // Extract data using Gemini
      const extractedData = await geminiService.extractReceiptData(
        validatedData.imageData,
        validatedData.mimeType
      );

      // Create receipt record
      const receipt = await storage.createReceipt({
        userId: null, // For MVP, not using user authentication
        storeName: extractedData.store_name,
        transactionDate: extractedData.transaction_date,
        totalAmount: extractedData.total_amount?.toString() || null,
        taxAmount: extractedData.tax_amount?.toString() || null,
        subtotal: extractedData.total_amount && extractedData.tax_amount 
          ? (extractedData.total_amount - extractedData.tax_amount).toString() 
          : null,
        lineItems: extractedData.line_items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price.toString()
        })),
        status: "completed"
      });

      // Phase 2: Categorize items and store spending categories
      for (const item of extractedData.line_items) {
        try {
          const categorization = await geminiService.categorizeItem(item.description);
          await storage.createSpendingCategory({
            userId: null,
            receiptId: receipt.id,
            itemDescription: item.description,
            category: categorization.category,
            amount: item.price.toString(),
            confidence: categorization.confidence,
          });
        } catch (error) {
          console.warn(`Failed to categorize item: ${item.description}`, error);
        }
      }

      res.json({ 
        success: true, 
        receipt,
        extractedData 
      });
    } catch (error) {
      console.error("Error processing receipt:", error);
      res.status(500).json({ 
        error: "Failed to process receipt",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Generate wallet pass endpoint
  app.post("/api/receipts/:id/wallet-pass", async (req, res) => {
    try {
      const receiptId = parseInt(req.params.id);
      const receipt = await storage.getReceipt(receiptId);

      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      if (!receipt.storeName || !receipt.totalAmount) {
        return res.status(400).json({ error: "Receipt data incomplete for wallet pass generation" });
      }

      // Generate wallet pass with enhanced data
      const walletPass = await walletService.createReceiptPass({
        storeName: receipt.storeName,
        transactionDate: receipt.transactionDate || new Date().toISOString().split('T')[0],
        totalAmount: receipt.totalAmount,
        taxAmount: receipt.taxAmount,
        subtotal: receipt.subtotal,
        receiptId: receipt.id,
        lineItems: (receipt.lineItems as any[]) || [],
        deepLinkUrl: `${process.env.APP_URL || 'https://raseed.app'}/receipt/${receipt.id}/chat`
      });

      // Update receipt with wallet pass info
      await storage.updateReceipt(receiptId, {
        walletPassId: walletPass.passId,
        walletPassUrl: walletPass.addToWalletUrl
      });

      res.json({
        success: true,
        walletPass
      });
    } catch (error) {
      console.error("Error generating wallet pass:", error);
      res.status(500).json({ 
        error: "Failed to generate wallet pass",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get receipt by ID
  app.get("/api/receipts/:id", async (req, res) => {
    try {
      const receiptId = parseInt(req.params.id);
      const receipt = await storage.getReceipt(receiptId);

      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      res.json(receipt);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      res.status(500).json({ 
        error: "Failed to fetch receipt",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Phase 2: Spending analysis endpoints
  app.get("/api/spending/analysis", async (req, res) => {
    try {
      const query = spendingAnalysisRequestSchema.parse(req.query);
      const spendingData = await storage.getSpendingByCategory(
        query.userId || 1, // Default user for MVP
        query.category,
        query.timePeriod
      );

      res.json({
        success: true,
        data: spendingData,
        timePeriod: query.timePeriod,
        category: query.category
      });
    } catch (error) {
      console.error("Error fetching spending analysis:", error);
      res.status(500).json({ 
        error: "Failed to fetch spending analysis",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/spending/categories", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const categories = await storage.getSpendingCategories(userId);

      res.json({
        success: true,
        categories
      });
    } catch (error) {
      console.error("Error fetching spending categories:", error);
      res.status(500).json({ 
        error: "Failed to fetch spending categories",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Phase 3: Chat/AI assistant endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userId } = chatMessageSchema.parse(req.body);
      
      // Get comprehensive user context from Firebase for better AI responses
      const userContext = userId 
        ? await contextService.getUserContext(userId)
        : { userId: null, summary: { totalReceipts: 0 } };

      const response = await geminiService.processUserQuery(message, userContext);

      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ 
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Receipt-specific chat endpoint for deep linking from wallet passes
  app.post("/api/receipts/:id/chat", async (req, res) => {
    try {
      const receiptId = parseInt(req.params.id);
      const { message, userId } = chatMessageSchema.parse(req.body);
      
      // Get specific receipt context for AI chat
      const receiptContext = await contextService.getReceiptContext(receiptId, userId);
      
      if (receiptContext.error) {
        return res.status(404).json({ error: receiptContext.error });
      }
      
      // Enhanced prompt for receipt-specific conversations
      const contextualMessage = `I'm looking at my receipt from ${receiptContext.receipt.storeName} on ${receiptContext.receipt.transactionDate}. ${message}`;
      
      const response = await geminiService.processUserQuery(contextualMessage, receiptContext);

      res.json({
        success: true,
        response,
        receiptInfo: {
          id: receiptContext.receipt.id,
          storeName: receiptContext.receipt.storeName,
          date: receiptContext.receipt.transactionDate,
          total: receiptContext.receipt.totalAmount
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing receipt chat:", error);
      res.status(500).json({ 
        error: "Failed to process receipt chat",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Phase 4: Insights endpoints
  app.get("/api/insights", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const insights = await storage.getActiveInsights(userId);

      res.json({
        success: true,
        insights
      });
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ 
        error: "Failed to fetch insights",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/insights/generate", async (req, res) => {
    try {
      const userId = parseInt(req.body.userId) || 1;
      
      // Get user's spending data for the last 30 days
      const spendingData = await storage.getSpendingByCategory(userId, undefined, "last_month");
      
      if (spendingData.length === 0) {
        return res.json({
          success: true,
          message: "Not enough spending data to generate insights"
        });
      }

      // Generate insight using Gemini
      const insight = await geminiService.generateSpendingInsight(spendingData);
      
      // Store the insight
      const createdInsight = await storage.createInsight({
        userId,
        insightText: insight.insightText,
        insightType: insight.insightType,
        walletPassId: null,
        isActive: true
      });

      res.json({
        success: true,
        insight: createdInsight
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ 
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
