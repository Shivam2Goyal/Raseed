// Data Models for Raseed Assistant Android App
package com.raseed.assistant.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.serialization.Serializable

// Main Expense data model
@Entity(tableName = "expenses")
@TypeConverters(LineItemConverter::class)
@Serializable
data class Expense(
    @PrimaryKey val id: String,
    val storeName: String,
    val amount: Double,
    val date: String,
    val category: String,
    val tax: Double? = null,
    val lineItems: List<LineItem>? = null,
    val createdAt: Long = System.currentTimeMillis()
)

// Individual line item from receipt
@Serializable
data class LineItem(
    val description: String,
    val price: Double
)

// Categories for expenses
enum class ExpenseCategory(val displayName: String) {
    GROCERIES("Groceries"),
    DINING("Dining"),
    TRANSPORT("Transport"),
    SHOPPING("Shopping"),
    UTILITIES("Utilities"),
    OTHER("Other")
}

// Dashboard summary data
data class DashboardSummary(
    val totalSpent: Double,
    val totalTransactions: Int,
    val topCategory: String,
    val averageDailySpending: Double,
    val categoryBreakdown: List<CategorySpending>
)

// Category spending breakdown
data class CategorySpending(
    val category: String,
    val amount: Double,
    val percentage: Float
)

// Receipt analysis request/response models
@Serializable
data class ReceiptAnalysisRequest(
    val imageData: String,
    val mimeType: String
)

@Serializable
data class ReceiptAnalysisResponse(
    val storeName: String?,
    val transactionDate: String?,
    val totalAmount: Double?,
    val taxAmount: Double?,
    val lineItems: List<LineItem>,
    val suggestedCategory: String?
)

// Chat message models
@Serializable
data class ChatMessage(
    val id: String,
    val message: String,
    val isUser: Boolean,
    val timestamp: Long
)

@Serializable
data class ChatRequest(
    val message: String,
    val userId: String? = null
)

@Serializable
data class ChatResponse(
    val response: String,
    val timestamp: String
)

// Type converter for Room database
class LineItemConverter {
    @TypeConverter
    fun fromLineItemList(lineItems: List<LineItem>?): String? {
        return if (lineItems == null) null else Gson().toJson(lineItems)
    }

    @TypeConverter
    fun toLineItemList(lineItemsString: String?): List<LineItem>? {
        return if (lineItemsString == null) null else {
            val listType = object : TypeToken<List<LineItem>>() {}.type
            Gson().fromJson(lineItemsString, listType)
        }
    }
}