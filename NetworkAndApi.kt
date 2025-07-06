// Network and API components for Raseed Assistant Android App
package com.raseed.assistant.network

import com.raseed.assistant.data.model.*
import retrofit2.Response
import retrofit2.http.*
import javax.inject.Inject
import javax.inject.Singleton

// Retrofit API interface
interface RaseedApiService {
    @POST("api/receipts/process")
    suspend fun analyzeReceipt(@Body request: ReceiptAnalysisRequest): Response<ReceiptAnalysisResponse>

    @POST("api/chat")
    suspend fun sendChatMessage(@Body request: ChatRequest): Response<ChatResponse>

    @GET("api/insights")
    suspend fun getInsights(@Query("userId") userId: String? = null): Response<InsightsResponse>

    @POST("api/insights/generate")
    suspend fun generateInsights(@Body request: GenerateInsightsRequest): Response<InsightResponse>
}

// Additional API response models
@kotlinx.serialization.Serializable
data class InsightsResponse(
    val success: Boolean,
    val insights: List<Insight>
)

@kotlinx.serialization.Serializable
data class Insight(
    val id: Int,
    val insightText: String,
    val insightType: String,
    val isActive: Boolean,
    val createdAt: String
)

@kotlinx.serialization.Serializable
data class GenerateInsightsRequest(
    val userId: String? = null
)

@kotlinx.serialization.Serializable
data class InsightResponse(
    val success: Boolean,
    val insight: Insight?
)

// Repository for API calls
@Singleton
class ApiRepository @Inject constructor(
    private val apiService: RaseedApiService
) {
    suspend fun analyzeReceipt(imageData: String, mimeType: String): Result<ReceiptAnalysisResponse> {
        return try {
            val request = ReceiptAnalysisRequest(imageData, mimeType)
            val response = apiService.analyzeReceipt(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to analyze receipt: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendChatMessage(message: String): Result<ChatResponse> {
        return try {
            val request = ChatRequest(message)
            val response = apiService.sendChatMessage(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to send chat message: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getInsights(): Result<List<Insight>> {
        return try {
            val response = apiService.getInsights()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.insights)
            } else {
                Result.failure(Exception("Failed to get insights: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateInsights(): Result<Insight?> {
        return try {
            val request = GenerateInsightsRequest()
            val response = apiService.generateInsights(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.insight)
            } else {
                Result.failure(Exception("Failed to generate insights: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// Utility class for image processing
class ImageUtils {
    companion object {
        fun convertImageToBase64(imageBytes: ByteArray): String {
            return android.util.Base64.encodeToString(imageBytes, android.util.Base64.DEFAULT)
        }

        fun getMimeTypeFromExtension(filename: String): String {
            return when (filename.substringAfterLast('.').lowercase()) {
                "jpg", "jpeg" -> "image/jpeg"
                "png" -> "image/png"
                "webp" -> "image/webp"
                else -> "image/jpeg"
            }
        }
    }
}