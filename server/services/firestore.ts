import { db, COLLECTIONS } from '../config/firebase';
import { 
  type User, 
  type InsertUser, 
  type Receipt, 
  type InsertReceipt,
  type SpendingCategory,
  type InsertSpendingCategory,
  type Insight,
  type InsertInsight,
  type IStorage
} from '../storage';
import { FieldValue } from 'firebase-admin/firestore';

export class FirestoreStorage implements IStorage {
  private usersCollection = db.collection(COLLECTIONS.USERS);
  private receiptsCollection = db.collection(COLLECTIONS.RECEIPTS);
  private spendingCategoriesCollection = db.collection(COLLECTIONS.SPENDING_CATEGORIES);
  private insightsCollection = db.collection(COLLECTIONS.INSIGHTS);

  // User management
  async getUser(id: number): Promise<User | undefined> {
    try {
      const doc = await this.usersCollection.doc(id.toString()).get();
      if (doc.exists) {
        return { id, ...doc.data() } as User;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const snapshot = await this.usersCollection.where('username', '==', username).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: parseInt(doc.id), ...doc.data() } as User;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const docRef = await this.usersCollection.add({
        ...user,
        createdAt: FieldValue.serverTimestamp()
      });
      
      const doc = await docRef.get();
      return { id: parseInt(docRef.id), ...doc.data() } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Receipt management
  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    try {
      const receiptData = {
        ...receipt,
        userId: receipt.userId ?? null,
        storeName: receipt.storeName ?? null,
        transactionDate: receipt.transactionDate ?? new Date().toISOString().split('T')[0], // Default to current date
        totalAmount: receipt.totalAmount ?? null,
        taxAmount: receipt.taxAmount ?? null,
        subtotal: receipt.subtotal ?? null,
        lineItems: receipt.lineItems || [],
        walletPassId: receipt.walletPassId ?? null,
        walletPassUrl: receipt.walletPassUrl ?? null,
        status: receipt.status || "processing",
        createdAt: FieldValue.serverTimestamp()
      };

      const docRef = await this.receiptsCollection.add(receiptData);
      const doc = await docRef.get();
      
      return { id: parseInt(docRef.id), ...doc.data() } as Receipt;
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    try {
      const doc = await this.receiptsCollection.doc(id.toString()).get();
      if (doc.exists) {
        const data = doc.data();
        return { 
          id, 
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as Receipt;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting receipt:', error);
      return undefined;
    }
  }

  async updateReceipt(id: number, updates: Partial<InsertReceipt>): Promise<Receipt | undefined> {
    try {
      const docRef = this.receiptsCollection.doc(id.toString());
      await docRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        return { 
          id, 
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as Receipt;
      }
      return undefined;
    } catch (error) {
      console.error('Error updating receipt:', error);
      return undefined;
    }
  }

  async getUserReceipts(userId: number): Promise<Receipt[]> {
    try {
      const snapshot = await this.receiptsCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as Receipt;
      });
    } catch (error) {
      console.error('Error getting user receipts:', error);
      return [];
    }
  }

  async getAllReceipts(): Promise<Receipt[]> {
    try {
      const snapshot = await this.receiptsCollection.orderBy('createdAt', 'desc').get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as Receipt;
      });
    } catch (error) {
      console.error('Error getting all receipts:', error);
      return [];
    }
  }

  // Spending Categories methods
  async createSpendingCategory(category: InsertSpendingCategory): Promise<SpendingCategory> {
    try {
      const categoryData = {
        ...category,
        userId: category.userId ?? null,
        receiptId: category.receiptId ?? null,
        confidence: category.confidence ?? null,
        createdAt: FieldValue.serverTimestamp()
      };

      const docRef = await this.spendingCategoriesCollection.add(categoryData);
      const doc = await docRef.get();
      
      return { id: parseInt(docRef.id), ...doc.data() } as SpendingCategory;
    } catch (error) {
      console.error('Error creating spending category:', error);
      throw error;
    }
  }

  async getSpendingCategories(userId?: number): Promise<SpendingCategory[]> {
    try {
      let query = this.spendingCategoriesCollection.orderBy('createdAt', 'desc');
      
      if (userId !== undefined) {
        query = query.where('userId', '==', userId) as any;
      }
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as SpendingCategory;
      });
    } catch (error) {
      console.error('Error getting spending categories:', error);
      return [];
    }
  }

  async getSpendingByCategory(userId: number, category?: string, timePeriod?: string): Promise<{ category: string; total: number; count: number }[]> {
    try {
      let query = this.spendingCategoriesCollection.where('userId', '==', userId);
      
      // Filter by time period if specified
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
        
        query = query.where('createdAt', '>=', cutoffDate) as any;
      }
      
      // Filter by category if specified
      if (category) {
        query = query.where('category', '==', category) as any;
      }
      
      const snapshot = await query.get();
      
      // Group and sum by category
      const grouped = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        const amount = parseFloat(data.amount) || 0;
        const categoryName = data.category;
        
        if (!acc[categoryName]) {
          acc[categoryName] = { category: categoryName, total: 0, count: 0 };
        }
        acc[categoryName].total += amount;
        acc[categoryName].count += 1;
        return acc;
      }, {} as Record<string, { category: string; total: number; count: number }>);

      return Object.values(grouped);
    } catch (error) {
      console.error('Error getting spending by category:', error);
      return [];
    }
  }

  // Insights methods
  async createInsight(insight: InsertInsight): Promise<Insight> {
    try {
      const insightData = {
        ...insight,
        userId: insight.userId ?? null,
        walletPassId: insight.walletPassId ?? null,
        isActive: insight.isActive ?? true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const docRef = await this.insightsCollection.add(insightData);
      const doc = await docRef.get();
      
      return { id: parseInt(docRef.id), ...doc.data() } as Insight;
    } catch (error) {
      console.error('Error creating insight:', error);
      throw error;
    }
  }

  async getUserInsights(userId: number): Promise<Insight[]> {
    try {
      const snapshot = await this.insightsCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date()
        } as Insight;
      });
    } catch (error) {
      console.error('Error getting user insights:', error);
      return [];
    }
  }

  async updateInsight(id: number, updates: Partial<InsertInsight>): Promise<Insight | undefined> {
    try {
      const docRef = this.insightsCollection.doc(id.toString());
      await docRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        return { 
          id, 
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date()
        } as Insight;
      }
      return undefined;
    } catch (error) {
      console.error('Error updating insight:', error);
      return undefined;
    }
  }

  async getActiveInsights(userId: number): Promise<Insight[]> {
    try {
      const snapshot = await this.insightsCollection
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date()
        } as Insight;
      });
    } catch (error) {
      console.error('Error getting active insights:', error);
      return [];
    }
  }

  // Additional methods for Firebase-specific functionality
  async getReceiptsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Receipt[]> {
    try {
      const snapshot = await this.receiptsCollection
        .where('userId', '==', userId)
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as Receipt;
      });
    } catch (error) {
      console.error('Error getting receipts by date range:', error);
      return [];
    }
  }

  async searchReceipts(userId: number, searchTerm: string): Promise<Receipt[]> {
    try {
      // Firestore doesn't support full-text search, so we'll get all user receipts
      // and filter them client-side for now
      const allReceipts = await this.getUserReceipts(userId);
      
      return allReceipts.filter(receipt => 
        receipt.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.lineItems?.some(item => 
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Error searching receipts:', error);
      return [];
    }
  }
}

export const firestoreStorage = new FirestoreStorage();