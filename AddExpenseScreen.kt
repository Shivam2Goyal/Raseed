// Add Expense Screen with Manual Entry and Receipt Scanning
package com.raseed.assistant.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberPermissionState
import com.raseed.assistant.data.ExpenseRepository
import com.raseed.assistant.data.model.*
import com.raseed.assistant.network.ApiRepository
import com.raseed.assistant.network.ImageUtils
import com.raseed.assistant.ui.theme.RaseedAssistantTheme
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@HiltViewModel
class AddExpenseViewModel @Inject constructor(
    private val expenseRepository: ExpenseRepository,
    private val apiRepository: ApiRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(AddExpenseUiState())
    val uiState: StateFlow<AddExpenseUiState> = _uiState.asStateFlow()
    
    private val _receiptAnalysis = MutableStateFlow<ReceiptAnalysisResponse?>(null)
    val receiptAnalysis: StateFlow<ReceiptAnalysisResponse?> = _receiptAnalysis.asStateFlow()
    
    fun updateManualEntry(
        storeName: String = _uiState.value.storeName,
        amount: String = _uiState.value.amount,
        category: String = _uiState.value.category,
        date: String = _uiState.value.date
    ) {
        _uiState.value = _uiState.value.copy(
            storeName = storeName,
            amount = amount,
            category = category,
            date = date
        )
    }
    
    fun analyzeReceipt(imageBytes: ByteArray) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAnalyzing = true, error = null)
            
            try {
                val base64Image = ImageUtils.convertImageToBase64(imageBytes)
                val mimeType = "image/jpeg"
                
                val result = apiRepository.analyzeReceipt(base64Image, mimeType)
                
                if (result.isSuccess) {
                    val analysis = result.getOrNull()
                    _receiptAnalysis.value = analysis
                    _uiState.value = _uiState.value.copy(
                        isAnalyzing = false,
                        showAnalysisResult = true
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isAnalyzing = false,
                        error = result.exceptionOrNull()?.message ?: "Failed to analyze receipt"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isAnalyzing = false,
                    error = e.message ?: "An error occurred"
                )
            }
        }
    }
    
    fun saveManualExpense() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            
            try {
                val state = _uiState.value
                val expense = Expense(
                    id = UUID.randomUUID().toString(),
                    storeName = state.storeName,
                    amount = state.amount.toDoubleOrNull() ?: 0.0,
                    date = state.date,
                    category = state.category,
                    tax = null,
                    lineItems = null
                )
                
                expenseRepository.insertExpense(expense)
                
                _uiState.value = AddExpenseUiState() // Reset state
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    showSuccessMessage = true
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    error = e.message ?: "Failed to save expense"
                )
            }
        }
    }
    
    fun saveAnalyzedExpense() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            
            try {
                val analysis = _receiptAnalysis.value
                if (analysis != null) {
                    val expense = Expense(
                        id = UUID.randomUUID().toString(),
                        storeName = analysis.storeName ?: "Unknown Store",
                        amount = analysis.totalAmount ?: 0.0,
                        date = analysis.transactionDate ?: getCurrentDate(),
                        category = analysis.suggestedCategory ?: ExpenseCategory.OTHER.displayName,
                        tax = analysis.taxAmount,
                        lineItems = analysis.lineItems
                    )
                    
                    expenseRepository.insertExpense(expense)
                    
                    _uiState.value = AddExpenseUiState() // Reset state
                    _receiptAnalysis.value = null
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        showSuccessMessage = true
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    error = e.message ?: "Failed to save expense"
                )
            }
        }
    }
    
    fun dismissError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
    
    fun dismissSuccessMessage() {
        _uiState.value = _uiState.value.copy(showSuccessMessage = false)
    }
    
    fun dismissAnalysisResult() {
        _uiState.value = _uiState.value.copy(showAnalysisResult = false)
        _receiptAnalysis.value = null
    }
    
    private fun getCurrentDate(): String {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        return dateFormat.format(Date())
    }
}

data class AddExpenseUiState(
    val storeName: String = "",
    val amount: String = "",
    val category: String = ExpenseCategory.GROCERIES.displayName,
    val date: String = getCurrentDateString(),
    val isAnalyzing: Boolean = false,
    val isSaving: Boolean = false,
    val showAnalysisResult: Boolean = false,
    val showSuccessMessage: Boolean = false,
    val error: String? = null
) {
    companion object {
        private fun getCurrentDateString(): String {
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            return dateFormat.format(Date())
        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun AddExpenseScreen(
    onNavigateBack: () -> Unit,
    viewModel: AddExpenseViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val receiptAnalysis by viewModel.receiptAnalysis.collectAsState()
    val context = LocalContext.current
    
    // Permission states
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)
    
    // Activity result launchers
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { 
            val inputStream = context.contentResolver.openInputStream(it)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
            val imageBytes = outputStream.toByteArray()
            viewModel.analyzeReceipt(imageBytes)
        }
    }
    
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        bitmap?.let {
            val outputStream = ByteArrayOutputStream()
            it.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
            val imageBytes = outputStream.toByteArray()
            viewModel.analyzeReceipt(imageBytes)
        }
    }
    
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Manual Entry", "Scan Receipt")
    
    // Show success message
    LaunchedEffect(uiState.showSuccessMessage) {
        if (uiState.showSuccessMessage) {
            kotlinx.coroutines.delay(2000)
            viewModel.dismissSuccessMessage()
            onNavigateBack()
        }
    }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Top App Bar
        TopAppBar(
            title = { Text("Add Expense") },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }
            }
        )
        
        // Tab Row
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title) }
                )
            }
        }
        
        // Tab Content
        when (selectedTab) {
            0 -> ManualEntryTab(
                uiState = uiState,
                onUpdateEntry = viewModel::updateManualEntry,
                onSave = viewModel::saveManualExpense
            )
            1 -> ScanReceiptTab(
                uiState = uiState,
                onTakePhoto = {
                    if (cameraPermissionState.hasPermission) {
                        cameraLauncher.launch(null)
                    } else {
                        cameraPermissionState.launchPermissionRequest()
                    }
                },
                onSelectImage = { imagePickerLauncher.launch("image/*") }
            )
        }
    }
    
    // Error Dialog
    uiState.error?.let { error ->
        AlertDialog(
            onDismissRequest = viewModel::dismissError,
            title = { Text("Error") },
            text = { Text(error) },
            confirmButton = {
                TextButton(onClick = viewModel::dismissError) {
                    Text("OK")
                }
            }
        )
    }
    
    // Success Message
    if (uiState.showSuccessMessage) {
        AlertDialog(
            onDismissRequest = viewModel::dismissSuccessMessage,
            title = { Text("Success") },
            text = { Text("Expense saved successfully!") },
            confirmButton = {
                TextButton(onClick = viewModel::dismissSuccessMessage) {
                    Text("OK")
                }
            }
        )
    }
    
    // Receipt Analysis Result
    if (uiState.showAnalysisResult && receiptAnalysis != null) {
        ReceiptAnalysisDialog(
            analysis = receiptAnalysis!!,
            onConfirm = viewModel::saveAnalyzedExpense,
            onDismiss = viewModel::dismissAnalysisResult,
            isSaving = uiState.isSaving
        )
    }
}

@Composable
fun ManualEntryTab(
    uiState: AddExpenseUiState,
    onUpdateEntry: (String, String, String, String) -> Unit,
    onSave: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Store Name
        OutlinedTextField(
            value = uiState.storeName,
            onValueChange = { onUpdateEntry(it, uiState.amount, uiState.category, uiState.date) },
            label = { Text("Store Name") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
        
        // Amount
        OutlinedTextField(
            value = uiState.amount,
            onValueChange = { onUpdateEntry(uiState.storeName, it, uiState.category, uiState.date) },
            label = { Text("Total Amount") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            prefix = { Text("$") }
        )
        
        // Category Dropdown
        var expanded by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded }
        ) {
            OutlinedTextField(
                value = uiState.category,
                onValueChange = { },
                readOnly = true,
                label = { Text("Category") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor()
            )
            
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                ExpenseCategory.values().forEach { category ->
                    DropdownMenuItem(
                        text = { Text(category.displayName) },
                        onClick = {
                            onUpdateEntry(uiState.storeName, uiState.amount, category.displayName, uiState.date)
                            expanded = false
                        }
                    )
                }
            }
        }
        
        // Date
        OutlinedTextField(
            value = uiState.date,
            onValueChange = { onUpdateEntry(uiState.storeName, uiState.amount, uiState.category, it) },
            label = { Text("Date (YYYY-MM-DD)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Save Button
        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth(),
            enabled = !uiState.isSaving && uiState.storeName.isNotBlank() && uiState.amount.isNotBlank()
        ) {
            if (uiState.isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text("Save Expense")
        }
    }
}

@Composable
fun ScanReceiptTab(
    uiState: AddExpenseUiState,
    onTakePhoto: () -> Unit,
    onSelectImage: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (uiState.isAnalyzing) {
            CircularProgressIndicator(modifier = Modifier.size(48.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Analyzing receipt...")
        } else {
            Icon(
                imageVector = Icons.Default.PhotoCamera,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "Capture or select a receipt image",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Our AI will extract the details automatically",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(
                onClick = onTakePhoto,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.PhotoCamera, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Take Photo")
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            OutlinedButton(
                onClick = onSelectImage,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Photo, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Select from Gallery")
            }
        }
    }
}

@Composable
fun ReceiptAnalysisDialog(
    analysis: ReceiptAnalysisResponse,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    isSaving: Boolean
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Receipt Analysis") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Store: ${analysis.storeName ?: "Unknown"}")
                Text("Date: ${analysis.transactionDate ?: "Unknown"}")
                Text("Total: $${analysis.totalAmount ?: 0.0}")
                analysis.taxAmount?.let { Text("Tax: $$it") }
                Text("Category: ${analysis.suggestedCategory ?: "Other"}")
                
                if (analysis.lineItems.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Items:", fontWeight = FontWeight.Bold)
                    analysis.lineItems.take(3).forEach { item ->
                        Text("• ${item.description}: $${item.price}")
                    }
                    if (analysis.lineItems.size > 3) {
                        Text("... and ${analysis.lineItems.size - 3} more items")
                    }
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !isSaving
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("Confirm and Add")
            }
        }
    )
}

@Preview(showBackground = true)
@Composable
fun AddExpenseScreenPreview() {
    RaseedAssistantTheme {
        AddExpenseScreen(onNavigateBack = {})
    }
}