import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  storeName: text("store_name"),
  transactionDate: text("transaction_date"),
  totalAmount: text("total_amount"),
  taxAmount: text("tax_amount"),
  subtotal: text("subtotal"),
  lineItems: jsonb("line_items").$type<LineItem[]>().default([]),
  walletPassId: text("wallet_pass_id"),
  walletPassUrl: text("wallet_pass_url"),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Add spending analysis table for Phase 2
export const spendingCategories = pgTable("spending_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  receiptId: integer("receipt_id").references(() => receipts.id),
  itemDescription: text("item_description").notNull(),
  category: text("category").notNull(), // 'Groceries', 'Electronics', etc.
  amount: text("amount").notNull(),
  confidence: text("confidence"), // AI confidence score
  createdAt: timestamp("created_at").defaultNow(),
});

// Add insights table for Phase 4
export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  insightText: text("insight_text").notNull(),
  insightType: text("insight_type").notNull(), // 'trend', 'savings', 'alert'
  walletPassId: text("wallet_pass_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  price: z.string(),
});

export type LineItem = z.infer<typeof lineItemSchema>;

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
});

export const processReceiptSchema = z.object({
  imageData: z.string(), // base64 encoded image
  mimeType: z.string(),
});

export const extractedReceiptDataSchema = z.object({
  store_name: z.string().nullable(),
  transaction_date: z.string().nullable().transform(val => 
    val || new Date().toISOString().split('T')[0] // Default to current date if missing
  ),
  total_amount: z.number().nullable(),
  tax_amount: z.number().nullable(),
  subtotal: z.number().nullable(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    price: z.number(),
  })).default([]),
});

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type ProcessReceiptRequest = z.infer<typeof processReceiptSchema>;
export type ExtractedReceiptData = z.infer<typeof extractedReceiptDataSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// New schemas for Phase 2 & 4
export const insertSpendingCategorySchema = createInsertSchema(spendingCategories).omit({
  id: true,
  createdAt: true,
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const spendingAnalysisRequestSchema = z.object({
  userId: z.number().optional(),
  category: z.string().optional(),
  timePeriod: z.string().default("last_month"), // last_week, last_month, last_year
});

export const chatMessageSchema = z.object({
  message: z.string(),
  userId: z.number().optional(),
});

export type InsertSpendingCategory = z.infer<typeof insertSpendingCategorySchema>;
export type SpendingCategory = typeof spendingCategories.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insights.$inferSelect;
export type SpendingAnalysisRequest = z.infer<typeof spendingAnalysisRequestSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
