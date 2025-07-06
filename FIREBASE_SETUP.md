# Firebase Integration Setup Guide

## Overview
This guide explains how to configure Firebase Firestore for the Raseed receipt management application.

## Firebase Configuration Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "raseed-receipt-manager")
4. Enable/disable Google Analytics as needed
5. Click "Create project"

### 2. Enable Firestore Database
1. In your Firebase project, navigate to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in production mode"
4. Select a location for your database
5. Click "Done"

### 3. Generate Service Account Key
1. Go to "Project Settings" (gear icon)
2. Navigate to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file (keep it secure!)
5. Convert the JSON content to a single-line string

### 4. Configure Environment Variables

Add these environment variables to your Replit Secrets:

```bash
# Enable Firebase usage
USE_FIREBASE=true

# Firebase Service Account (JSON as single line string)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### 5. Firestore Collections Structure

The application creates these collections automatically:

#### Users Collection (`users`)
```javascript
{
  username: string,
  password: string,
  createdAt: timestamp
}
```

#### Receipts Collection (`receipts`)
```javascript
{
  userId: number,
  storeName: string,
  transactionDate: string,
  totalAmount: string,
  taxAmount: string,
  subtotal: string,
  lineItems: array,
  walletPassId: string,
  walletPassUrl: string,
  status: string,
  createdAt: timestamp
}
```

#### Spending Categories Collection (`spending_categories`)
```javascript
{
  userId: number,
  receiptId: number,
  itemDescription: string,
  category: string,
  amount: string,
  confidence: string,
  createdAt: timestamp
}
```

#### Insights Collection (`insights`)
```javascript
{
  userId: number,
  insightText: string,
  insightType: string,
  walletPassId: string,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Security Rules (Production)

For production deployment, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /receipts/{receiptId} {
      allow read, write: if resource.data.userId == request.auth.uid;
    }
    
    match /spending_categories/{categoryId} {
      allow read, write: if resource.data.userId == request.auth.uid;
    }
    
    match /insights/{insightId} {
      allow read, write: if resource.data.userId == request.auth.uid;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## Features Enabled by Firebase

### 1. Real-time Data Sync
- Receipts update across devices in real-time
- AI insights sync automatically

### 2. Enhanced AI Context
- Assistant accesses comprehensive spending history
- Personalized recommendations based on purchase patterns
- Context-aware receipt analysis

### 3. Advanced Analytics
- Cross-device spending tracking
- Historical trend analysis
- Category-based insights

### 4. Scalability
- Automatic scaling for multiple users
- Global data distribution
- Offline support (when implemented)

## API Changes

### New Endpoints
- `POST /api/receipts/:id/chat` - Chat about specific receipts
- Enhanced context in existing chat endpoints

### Enhanced Features
- Date defaults to current date if missing from receipts
- Comprehensive user context for AI responses
- Receipt-specific deep linking from wallet passes

## Wallet Pass Integration

Enhanced wallet passes now include:
- Deep links to receipt-specific chat
- Complete receipt details in pass content
- QR codes linking back to the app
- Enhanced visual design with receipt information

## Testing

1. Set `USE_FIREBASE=false` to use in-memory storage for testing
2. Set `USE_FIREBASE=true` to use Firebase Firestore
3. Monitor logs for Firebase connection status
4. Test receipt upload and AI chat functionality