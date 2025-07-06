// Complete Android Project Configuration Files for Raseed Assistant

// 1. build.gradle.kts (Project level)
/*
plugins {
    id("com.android.application") version "8.2.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
    id("com.google.dagger.hilt.android") version "2.48" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.22" apply false
}
*/

// 2. build.gradle.kts (App level) - Already provided above

// 3. AndroidManifest.xml
/*
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />

    <application
        android:name=".RaseedApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.RaseedAssistant"
        android:usesCleartextTraffic="true"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.RaseedAssistant">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <!-- File Provider for camera functionality -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.provider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/provider_paths" />
        </provider>
        
    </application>
</manifest>
*/

// 4. strings.xml
/*
<resources>
    <string name="app_name">Raseed Assistant</string>
    <string name="dashboard_title">Dashboard</string>
    <string name="add_expense_title">Add Expense</string>
    <string name="assistant_title">AI Assistant</string>
    <string name="camera_permission_required">Camera permission is required to take photos</string>
    <string name="storage_permission_required">Storage permission is required to select images</string>
    <string name="receipt_analysis_success">Receipt analyzed successfully</string>
    <string name="receipt_analysis_failed">Failed to analyze receipt</string>
    <string name="expense_saved_success">Expense saved successfully</string>
    <string name="expense_save_failed">Failed to save expense</string>
    <string name="network_error">Network error. Please check your connection.</string>
    <string name="generic_error">An error occurred. Please try again.</string>
</resources>
*/

// 5. colors.xml
/*
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="purple_200">#FFBB86FC</color>
    <color name="purple_500">#FF6200EE</color>
    <color name="purple_700">#FF3700B3</color>
    <color name="teal_200">#FF03DAC5</color>
    <color name="teal_700">#FF018786</color>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
    
    <!-- Material Design Colors -->
    <color name="md_theme_light_primary">#1976D2</color>
    <color name="md_theme_light_onPrimary">#FFFFFF</color>
    <color name="md_theme_light_secondary">#388E3C</color>
    <color name="md_theme_light_onSecondary">#FFFFFF</color>
    <color name="md_theme_light_background">#FAFAFA</color>
    <color name="md_theme_light_onBackground">#1A1A1A</color>
    <color name="md_theme_light_surface">#FFFFFF</color>
    <color name="md_theme_light_onSurface">#1A1A1A</color>
</resources>
*/

// 6. themes.xml
/*
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.RaseedAssistant" parent="Theme.Material3.DayNight">
        <item name="colorPrimary">@color/md_theme_light_primary</item>
        <item name="colorOnPrimary">@color/md_theme_light_onPrimary</item>
        <item name="colorSecondary">@color/md_theme_light_secondary</item>
        <item name="colorOnSecondary">@color/md_theme_light_onSecondary</item>
        <item name="android:colorBackground">@color/md_theme_light_background</item>
        <item name="colorOnBackground">@color/md_theme_light_onBackground</item>
        <item name="colorSurface">@color/md_theme_light_surface</item>
        <item name="colorOnSurface">@color/md_theme_light_onSurface</item>
    </style>
</resources>
*/

// 7. provider_paths.xml (for file provider)
/*
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-cache-path name="external_cache" path="." />
    <external-files-path name="external_files" path="." />
</paths>
*/

// 8. proguard-rules.pro
/*
# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Retrofit
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# Gson
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Room
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Hilt
-dontwarn dagger.hilt.**
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ApplicationComponentManager { *; }

# Data models
-keep class com.raseed.assistant.data.model.** { *; }
*/

// Instructions for building the APK:
/*
1. Create a new Android Studio project with the following settings:
   - Name: Raseed Assistant
   - Package: com.raseed.assistant
   - Language: Kotlin
   - Minimum SDK: API 24 (Android 7.0)
   - Use Compose Activity template

2. Replace the generated files with the code provided above:
   - MainActivity.kt -> RaseedAndroidApp.kt content
   - Data models -> DataModels.kt content
   - Database & Repository -> DatabaseAndRepository.kt content
   - Network & API -> NetworkAndApi.kt content
   - UI Screens -> DashboardScreen.kt, AddExpenseScreen.kt, ChatAssistantScreen.kt
   - Navigation -> NavigationAndMainApp.kt content

3. Update build.gradle.kts files with the dependencies listed

4. Add the required permissions and configurations to AndroidManifest.xml

5. Add string resources, colors, and themes as shown above

6. Create the provider_paths.xml file for camera functionality

7. Build the project:
   - In Android Studio: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
   - Or use command line: ./gradlew assembleDebug

8. The APK will be generated in: app/build/outputs/apk/debug/app-debug.apk

Key Features of the Android App:
✓ Material Design 3 UI with modern Jetpack Compose
✓ Bottom navigation with Dashboard, Add Expense, and AI Assistant
✓ Camera integration for receipt scanning
✓ AI-powered receipt analysis using your existing backend
✓ Local database storage with Room
✓ Real-time chat interface with AI assistant
✓ Spending analytics with visual charts
✓ Dark/Light theme support
✓ Proper error handling and loading states
✓ Responsive design for various screen sizes

Backend Integration:
- The app connects to your existing Replit backend at localhost:5000
- Uses the same API endpoints (/api/receipts/process, /api/chat, etc.)
- Maintains compatibility with your current Gemini AI integration
- Supports the same data models and response formats

This provides a complete native Android implementation that matches your requirements exactly!
*/