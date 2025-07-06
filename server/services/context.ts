import { storage } from '../storage';

export class ContextService {
  /**
   * Get comprehensive user context for AI assistant
   * Includes recent receipts, spending patterns, and insights
   */
  async getUserContext(userId: number): Promise<any> {
    try {
      // Get user's recent receipts (last 30 days)
      const recentReceipts = await storage.getUserReceipts(userId);
      const last30Days = recentReceipts.filter(receipt => {
        const receiptDate = new Date(receipt.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return receiptDate >= thirtyDaysAgo;
      });

      // Get spending categories
      const spendingCategories = await storage.getSpendingCategories(userId);
      
      // Get spending by category for different time periods
      const [weeklySpending, monthlySpending, yearlySpending] = await Promise.all([
        storage.getSpendingByCategory(userId, undefined, 'last_week'),
        storage.getSpendingByCategory(userId, undefined, 'last_month'),
        storage.getSpendingByCategory(userId, undefined, 'last_year')
      ]);

      // Get user insights
      const insights = await storage.getUserInsights(userId);
      const activeInsights = await storage.getActiveInsights(userId);

      // Calculate totals and patterns
      const totalSpent30Days = last30Days.reduce((sum, receipt) => {
        const amount = parseFloat(receipt.totalAmount || '0');
        return sum + amount;
      }, 0);

      const frequentStores = this.getFrequentStores(last30Days);
      const topCategories = this.getTopCategories(spendingCategories);
      const recentPurchases = this.getRecentPurchases(last30Days);

      return {
        userId,
        summary: {
          totalReceipts: recentReceipts.length,
          totalSpent30Days: totalSpent30Days.toFixed(2),
          averageTransactionAmount: recentReceipts.length > 0 
            ? (totalSpent30Days / recentReceipts.length).toFixed(2) 
            : '0',
          frequentStores,
          topCategories
        },
        recentReceipts: last30Days.map(receipt => ({
          id: receipt.id,
          storeName: receipt.storeName,
          totalAmount: receipt.totalAmount,
          transactionDate: receipt.transactionDate,
          itemCount: receipt.lineItems?.length || 0,
          lineItems: receipt.lineItems?.slice(0, 3) // First 3 items only for context
        })),
        spendingPatterns: {
          weekly: weeklySpending,
          monthly: monthlySpending,
          yearly: yearlySpending
        },
        recentPurchases,
        insights: {
          total: insights.length,
          active: activeInsights.length,
          recent: activeInsights.slice(0, 3).map(insight => ({
            type: insight.insightType,
            text: insight.insightText
          }))
        },
        preferences: {
          // This could be expanded with user preferences from a separate collection
          currency: 'USD',
          timezone: 'America/New_York'
        }
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        userId,
        error: 'Unable to load user context',
        summary: {
          totalReceipts: 0,
          totalSpent30Days: '0',
          averageTransactionAmount: '0',
          frequentStores: [],
          topCategories: []
        }
      };
    }
  }

  /**
   * Get context for a specific receipt for AI chat
   */
  async getReceiptContext(receiptId: number, userId?: number): Promise<any> {
    try {
      const receipt = await storage.getReceipt(receiptId);
      if (!receipt) {
        return { error: 'Receipt not found' };
      }

      // Get related spending categories for this receipt
      const categories = await storage.getSpendingCategories(userId);
      const receiptCategories = categories.filter(cat => cat.receiptId === receiptId);

      // Get user's other receipts from the same store
      const userReceipts = userId ? await storage.getUserReceipts(userId) : [];
      const sameStoreReceipts = userReceipts.filter(r => 
        r.storeName === receipt.storeName && r.id !== receiptId
      );

      return {
        receipt: {
          id: receipt.id,
          storeName: receipt.storeName,
          transactionDate: receipt.transactionDate,
          totalAmount: receipt.totalAmount,
          taxAmount: receipt.taxAmount,
          subtotal: receipt.subtotal,
          lineItems: receipt.lineItems,
          status: receipt.status
        },
        categories: receiptCategories.map(cat => ({
          item: cat.itemDescription,
          category: cat.category,
          amount: cat.amount,
          confidence: cat.confidence
        })),
        relatedReceipts: sameStoreReceipts.slice(0, 5).map(r => ({
          id: r.id,
          date: r.transactionDate,
          amount: r.totalAmount,
          itemCount: r.lineItems?.length || 0
        })),
        purchaseHistory: {
          timesVisitedStore: sameStoreReceipts.length + 1,
          totalSpentAtStore: sameStoreReceipts.reduce((sum, r) => 
            sum + parseFloat(r.totalAmount || '0'), parseFloat(receipt.totalAmount || '0')
          ).toFixed(2)
        }
      };
    } catch (error) {
      console.error('Error getting receipt context:', error);
      return { error: 'Unable to load receipt context' };
    }
  }

  private getFrequentStores(receipts: any[]): string[] {
    const storeCounts = receipts.reduce((acc, receipt) => {
      const store = receipt.storeName;
      if (store) {
        acc[store] = (acc[store] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(storeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([store]) => store);
  }

  private getTopCategories(categories: any[]): Array<{category: string, count: number, totalAmount: number}> {
    const categoryStats = categories.reduce((acc, cat) => {
      const category = cat.category;
      const amount = parseFloat(cat.amount || '0');
      
      if (!acc[category]) {
        acc[category] = { count: 0, totalAmount: 0 };
      }
      acc[category].count += 1;
      acc[category].totalAmount += amount;
      
      return acc;
    }, {} as Record<string, {count: number, totalAmount: number}>);

    return Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        totalAmount: parseFloat(stats.totalAmount.toFixed(2))
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }

  private getRecentPurchases(receipts: any[]): Array<{item: string, store: string, date: string, price: string}> {
    const allItems: Array<{item: string, store: string, date: string, price: string}> = [];
    
    receipts.forEach(receipt => {
      if (receipt.lineItems && Array.isArray(receipt.lineItems)) {
        receipt.lineItems.forEach((item: any) => {
          allItems.push({
            item: item.description,
            store: receipt.storeName || 'Unknown Store',
            date: receipt.transactionDate || receipt.createdAt,
            price: item.price?.toString() || '0'
          });
        });
      }
    });

    return allItems
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }
}

export const contextService = new ContextService();