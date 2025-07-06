// Database and Repository components for Raseed Assistant Android App
package com.raseed.assistant.data

import androidx.room.*
import androidx.room.Database
import kotlinx.coroutines.flow.Flow
import com.raseed.assistant.data.model.Expense
import com.raseed.assistant.data.model.LineItemConverter
import javax.inject.Inject
import javax.inject.Singleton

// Room DAO for Expense operations
@Dao
interface ExpenseDao {
    @Query("SELECT * FROM expenses ORDER BY createdAt DESC")
    fun getAllExpenses(): Flow<List<Expense>>

    @Query("SELECT * FROM expenses WHERE id = :id")
    suspend fun getExpenseById(id: String): Expense?

    @Query("SELECT * FROM expenses WHERE date BETWEEN :startDate AND :endDate ORDER BY createdAt DESC")
    suspend fun getExpensesByDateRange(startDate: String, endDate: String): List<Expense>

    @Query("SELECT * FROM expenses WHERE category = :category ORDER BY createdAt DESC")
    suspend fun getExpensesByCategory(category: String): List<Expense>

    @Query("SELECT category, SUM(amount) as total FROM expenses WHERE date BETWEEN :startDate AND :endDate GROUP BY category")
    suspend fun getCategoryTotals(startDate: String, endDate: String): List<CategoryTotal>

    @Query("SELECT * FROM expenses ORDER BY createdAt DESC LIMIT :limit")
    suspend fun getRecentExpenses(limit: Int = 10): List<Expense>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: Expense)

    @Update
    suspend fun updateExpense(expense: Expense)

    @Delete
    suspend fun deleteExpense(expense: Expense)

    @Query("DELETE FROM expenses")
    suspend fun deleteAllExpenses()

    @Query("SELECT SUM(amount) FROM expenses WHERE date BETWEEN :startDate AND :endDate")
    suspend fun getTotalSpentInRange(startDate: String, endDate: String): Double?

    @Query("SELECT COUNT(*) FROM expenses WHERE date BETWEEN :startDate AND :endDate")
    suspend fun getTransactionCountInRange(startDate: String, endDate: String): Int
}

// Data class for category totals query result
data class CategoryTotal(
    val category: String,
    val total: Double
)

// Room Database
@Database(
    entities = [Expense::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(LineItemConverter::class)
abstract class ExpenseDatabase : RoomDatabase() {
    abstract fun expenseDao(): ExpenseDao
}

// Repository for managing expense data
@Singleton
class ExpenseRepository @Inject constructor(
    private val expenseDao: ExpenseDao
) {
    fun getAllExpenses(): Flow<List<Expense>> = expenseDao.getAllExpenses()

    suspend fun getExpenseById(id: String): Expense? = expenseDao.getExpenseById(id)

    suspend fun getRecentExpenses(limit: Int = 10): List<Expense> = 
        expenseDao.getRecentExpenses(limit)

    suspend fun getExpensesByCategory(category: String): List<Expense> = 
        expenseDao.getExpensesByCategory(category)

    suspend fun getExpensesByDateRange(startDate: String, endDate: String): List<Expense> = 
        expenseDao.getExpensesByDateRange(startDate, endDate)

    suspend fun getCategoryTotals(startDate: String, endDate: String): List<CategoryTotal> = 
        expenseDao.getCategoryTotals(startDate, endDate)

    suspend fun getTotalSpentInRange(startDate: String, endDate: String): Double = 
        expenseDao.getTotalSpentInRange(startDate, endDate) ?: 0.0

    suspend fun getTransactionCountInRange(startDate: String, endDate: String): Int = 
        expenseDao.getTransactionCountInRange(startDate, endDate)

    suspend fun insertExpense(expense: Expense) = expenseDao.insertExpense(expense)

    suspend fun updateExpense(expense: Expense) = expenseDao.updateExpense(expense)

    suspend fun deleteExpense(expense: Expense) = expenseDao.deleteExpense(expense)

    suspend fun deleteAllExpenses() = expenseDao.deleteAllExpenses()

    // Business logic methods
    suspend fun getDashboardSummary(startDate: String, endDate: String): DashboardSummary {
        val totalSpent = getTotalSpentInRange(startDate, endDate)
        val totalTransactions = getTransactionCountInRange(startDate, endDate)
        val categoryTotals = getCategoryTotals(startDate, endDate)
        
        val topCategory = categoryTotals.maxByOrNull { it.total }?.category ?: "None"
        
        // Calculate average daily spending (assuming 30 days for monthly view)
        val averageDailySpending = totalSpent / 30.0
        
        val categoryBreakdown = categoryTotals.map { categoryTotal ->
            CategorySpending(
                category = categoryTotal.category,
                amount = categoryTotal.total,
                percentage = if (totalSpent > 0) (categoryTotal.total / totalSpent * 100).toFloat() else 0f
            )
        }
        
        return DashboardSummary(
            totalSpent = totalSpent,
            totalTransactions = totalTransactions,
            topCategory = topCategory,
            averageDailySpending = averageDailySpending,
            categoryBreakdown = categoryBreakdown
        )
    }
}

// Import statements for the data classes
import com.raseed.assistant.data.model.DashboardSummary
import com.raseed.assistant.data.model.CategorySpending