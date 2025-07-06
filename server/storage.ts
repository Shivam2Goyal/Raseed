import { 
  users, 
  receipts, 
  spendingCategories, 
  insights,
  type User, 
  type InsertUser, 
  type Receipt, 
  type InsertReceipt,
  type SpendingCategory,
  type InsertSpendingCategory,
  type Insight,
  type InsertInsight
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Receipt management
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  getReceipt(id: number): Promise<Receipt | undefined>;
  updateReceipt(id: number, updates: Partial<InsertReceipt>): Promise<Receipt | undefined>;
  getUserReceipts(userId: number): Promise<Receipt[]>;
  getAllReceipts(): Promise<Receipt[]>;
  
  // Spending categories (Phase 2)
  createSpendingCategory(category: InsertSpendingCategory): Promise<SpendingCategory>;
  getSpendingCategories(userId?: number): Promise<SpendingCategory[]>;
  getSpendingByCategory(userId: number, category?: string, timePeriod?: string): Promise<{ category: string; total: number; count: number }[]>;
  
  // Insights (Phase 4)
  createInsight(insight: InsertInsight): Promise<Insight>;
  getUserInsights(userId: number): Promise<Insight[]>;
  updateInsight(id: number, updates: Partial<InsertInsight>): Promise<Insight | undefined>;
  getActiveInsights(userId: number): Promise<Insight[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private receipts: Map<number, Receipt>;
  private spendingCategories: Map<number, SpendingCategory>;
  private insights: Map<number, Insight>;
  private currentUserId: number;
  private currentReceiptId: number;
  private currentSpendingCategoryId: number;
  private currentInsightId: number;

  constructor() {
    this.users = new Map();
    this.receipts = new Map();
    this.spendingCategories = new Map();
    this.insights = new Map();
    this.currentUserId = 1;
    this.currentReceiptId = 1;
    this.currentSpendingCategoryId = 1;
    this.currentInsightId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const id = this.currentReceiptId++;
    const receipt: Receipt = {
      id,
      userId: insertReceipt.userId ?? null,
      storeName: insertReceipt.storeName ?? null,
      transactionDate: insertReceipt.transactionDate ?? null,
      totalAmount: insertReceipt.totalAmount ?? null,
      taxAmount: insertReceipt.taxAmount ?? null,
      subtotal: insertReceipt.subtotal ?? null,
      lineItems: Array.isArray(insertReceipt.lineItems) ? insertReceipt.lineItems : null,
      walletPassId: insertReceipt.walletPassId ?? null,
      walletPassUrl: insertReceipt.walletPassUrl ?? null,
      status: insertReceipt.status || "processing",
      createdAt: new Date(),
    };
    this.receipts.set(id, receipt);
    return receipt;
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    return this.receipts.get(id);
  }

  async updateReceipt(id: number, updates: Partial<InsertReceipt>): Promise<Receipt | undefined> {
    const existing = this.receipts.get(id);
    if (!existing) return undefined;

    const updated: Receipt = { ...existing, ...updates };
    this.receipts.set(id, updated);
    return updated;
  }

  async getUserReceipts(userId: number): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).filter(
      (receipt) => receipt.userId === userId,
    );
  }

  async getAllReceipts(): Promise<Receipt[]> {
    return Array.from(this.receipts.values());
  }

  // Spending Categories methods
  async createSpendingCategory(insertSpendingCategory: InsertSpendingCategory): Promise<SpendingCategory> {
    const id = this.currentSpendingCategoryId++;
    const category: SpendingCategory = {
      id,
      userId: insertSpendingCategory.userId ?? null,
      receiptId: insertSpendingCategory.receiptId ?? null,
      itemDescription: insertSpendingCategory.itemDescription,
      category: insertSpendingCategory.category,
      amount: insertSpendingCategory.amount,
      confidence: insertSpendingCategory.confidence ?? null,
      createdAt: new Date(),
    };
    this.spendingCategories.set(id, category);
    return category;
  }

  async getSpendingCategories(userId?: number): Promise<SpendingCategory[]> {
    const categories = Array.from(this.spendingCategories.values());
    if (userId !== undefined) {
      return categories.filter(category => category.userId === userId);
    }
    return categories;
  }

  async getSpendingByCategory(userId: number, category?: string, timePeriod?: string): Promise<{ category: string; total: number; count: number }[]> {
    const categories = await this.getSpendingCategories(userId);
    
    // Filter by time period if specified
    let filteredCategories = categories;
    if (timePeriod) {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (timePeriod) {
        case "last_week":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "last_month":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "last_year":
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filteredCategories = categories.filter(cat => 
        cat.createdAt && cat.createdAt >= cutoffDate
      );
    }

    // Filter by category if specified
    if (category) {
      filteredCategories = filteredCategories.filter(cat => cat.category === category);
    }

    // Group and sum by category
    const grouped = filteredCategories.reduce((acc, cat) => {
      const amount = parseFloat(cat.amount) || 0;
      if (!acc[cat.category]) {
        acc[cat.category] = { category: cat.category, total: 0, count: 0 };
      }
      acc[cat.category].total += amount;
      acc[cat.category].count += 1;
      return acc;
    }, {} as Record<string, { category: string; total: number; count: number }>);

    return Object.values(grouped);
  }

  // Insights methods
  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const id = this.currentInsightId++;
    const insight: Insight = {
      id,
      userId: insertInsight.userId ?? null,
      insightText: insertInsight.insightText,
      insightType: insertInsight.insightType,
      walletPassId: insertInsight.walletPassId ?? null,
      isActive: insertInsight.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.insights.set(id, insight);
    return insight;
  }

  async getUserInsights(userId: number): Promise<Insight[]> {
    return Array.from(this.insights.values()).filter(
      (insight) => insight.userId === userId,
    );
  }

  async updateInsight(id: number, updates: Partial<InsertInsight>): Promise<Insight | undefined> {
    const existing = this.insights.get(id);
    if (!existing) return undefined;

    const updated: Insight = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.insights.set(id, updated);
    return updated;
  }

  async getActiveInsights(userId: number): Promise<Insight[]> {
    return Array.from(this.insights.values()).filter(
      (insight) => insight.userId === userId && insight.isActive,
    );
  }
}

export const storage = new MemStorage();
