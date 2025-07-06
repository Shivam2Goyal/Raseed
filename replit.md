# Raseed - Receipt to Wallet Pass Application

## Overview

Raseed is a comprehensive AI-powered financial assistant that follows a four-phase development approach. It converts receipt photos into Google Wallet passes, provides intelligent spending analytics, offers conversational AI assistance, and generates proactive financial insights. The application demonstrates the complete roadmap from basic receipt processing to advanced AI-driven financial intelligence.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and data layers:

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with Material Design color scheme
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile Support**: Responsive design with camera integration for receipt capture

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with file upload support using Multer
- **AI Integration**: Google Gemini AI for receipt data extraction
- **Wallet Integration**: Google Wallet API for pass creation

### Database Layer
- **Primary Database**: Firebase Firestore for production data storage
- **Fallback Database**: PostgreSQL with Drizzle ORM for development
- **Schema**: Type-safe database schema with Zod validation
- **Storage**: Dual storage implementation - Firebase Firestore (production) and MemStorage (development/testing)
- **Real-time Features**: Firebase enables real-time data synchronization across devices

## Key Components

### 1. Receipt Processing Pipeline
- **Image Upload**: Multi-part form data handling with file validation
- **AI Extraction**: Gemini AI processes receipt images to extract structured data
- **Data Validation**: Zod schemas ensure type safety throughout the pipeline
- **Wallet Pass Creation**: Integration with Google Wallet API to generate passes

### 2. Database Schema
- **Users Table**: Basic user management (prepared for future authentication)
- **Receipts Table**: Stores receipt metadata, extracted data, and wallet pass information
- **Line Items**: JSON field storing array of purchased items with descriptions, quantities, and prices

### 3. AI Service Layer
- **Gemini Integration**: Uses Google's Gemini 2.5 Pro model for receipt data extraction
- **Structured Output**: AI configured to return JSON with specific schema for receipt data
- **Error Handling**: Robust error handling for AI service failures

### 4. Frontend Components
- **Receipt Uploader**: Drag-and-drop interface with camera integration
- **Extraction Results**: Display extracted data and wallet pass generation
- **Camera Modal**: Mobile-optimized camera interface for receipt capture

## Data Flow

1. **Image Capture**: User uploads receipt image via file input or camera
2. **Processing**: Backend receives image, validates format, and processes with Gemini AI
3. **Extraction**: AI extracts structured data (store name, date, amounts, line items)
4. **Storage**: Receipt data saved to database with processing status
5. **Wallet Pass**: Google Wallet pass created and URL returned to user
6. **Display**: Frontend shows extracted data and provides wallet pass link

## External Dependencies

### AI Services
- **Google Gemini AI**: Receipt data extraction using Gemini 2.5 Pro model
- **API Integration**: Direct integration with Google GenAI SDK

### Google Services
- **Google Wallet API**: Digital pass creation and management
- **Neon Database**: PostgreSQL hosting service

### Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Backend bundling for production deployment

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with hot reloading
- **Backend**: tsx for TypeScript execution with file watching
- **Database**: Local PostgreSQL or Neon Database connection
- **Environment Variables**: Database URL, Gemini API key, Google Wallet credentials

### Production Build
- **Frontend**: Static assets built with Vite to `dist/public`
- **Backend**: Bundled with ESBuild to `dist/index.js`
- **Database**: Migrations applied via Drizzle Kit
- **Deployment**: Single Node.js process serving both API and static files

### Configuration Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini AI API key
- `GOOGLE_WALLET_API_KEY`: Google Wallet service credentials
- `GOOGLE_WALLET_ISSUER_ID`: Wallet pass issuer identifier

## Implementation Status

### Phase 1: Core Pipeline ✅ COMPLETE
- Receipt image upload and processing
- Gemini AI data extraction
- Google Wallet pass generation
- Basic receipt storage and management

### Phase 2: Data & Intelligence ✅ COMPLETE  
- Item categorization using Gemini AI
- Spending categories storage
- Analytics API endpoints
- Spending analysis by category and time period

### Phase 3: Conversational Agent ✅ COMPLETE
- AI chat assistant powered by Gemini
- Context-aware responses using user spending data
- Natural language query processing
- Chat interface with conversation history

### Phase 4: Proactive Insights ✅ COMPLETE
- AI-generated spending insights
- Insight storage and management
- Trend analysis and savings recommendations
- Proactive financial intelligence

## Application Features

### Core Receipt Processing
- Camera and file upload support
- Real-time AI data extraction
- Google Wallet pass integration
- Automatic item categorization

### Analytics Dashboard
- Spending breakdown by category
- Time-based filtering (week/month/year)
- Transaction summaries
- Visual spending analytics

### AI Assistant Chat
- Natural language financial queries
- Context-aware responses
- Spending pattern analysis
- Interactive conversation interface

### Smart Insights
- AI-generated financial insights
- Trend detection and alerts
- Savings opportunity identification
- Personalized recommendations

## Recent Changes
- January 06, 2025: Successfully migrated project to Replit environment
- Fixed CSS import order warnings in index.css
- Created PostgreSQL database with proper schema migrations
- Configured Google Gemini AI API key for receipt processing and chat features
- Fixed API key configuration in gemini.ts service (GOOGLE_API_KEY)
- Server properly configured to bind to 0.0.0.0:5000 for Replit compatibility
- **MAJOR UPDATE**: Integrated Firebase Firestore as primary database
- Enhanced Google Wallet passes with deep links and comprehensive receipt details
- Added context-aware AI assistant with access to complete Firebase data
- Implemented receipt-specific chat endpoints for wallet pass deep linking
- Enhanced AI prompts to provide personalized financial insights
- Added comprehensive user context service for better AI responses
- Created Firebase setup documentation and configuration examples

## Changelog
- July 06, 2025: Complete implementation of phased development roadmap

## User Preferences

Preferred communication style: Simple, everyday language.