import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReceiptUploader from "@/components/receipt-uploader";
import ExtractionResults from "@/components/extraction-results";
import { Receipt, ExtractedReceiptData } from "@shared/schema";

export default function Home() {
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);

  const handleReceiptProcessed = (receipt: Receipt, data: ExtractedReceiptData) => {
    setCurrentReceipt(receipt);
    setExtractedData(data);
  };

  return (
    <div className="min-h-screen bg-material-grey-50">
      {/* Header */}
      <header className="bg-white shadow-material-1 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-material-blue-700 rounded-full flex items-center justify-center">
                <span className="material-icons text-white text-xl">receipt</span>
              </div>
              <div>
                <h1 className="text-xl font-medium text-material-grey-900">Raseed</h1>
                <p className="text-sm text-material-grey-600">Receipt to Wallet Pass</p>
              </div>
            </div>
            <button className="material-icons text-material-grey-600 hover:text-material-grey-900 transition-colors">
              more_vert
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Processing Pipeline */}
        <div className="grid lg:grid-cols-2 gap-8">
          <ReceiptUploader onReceiptProcessed={handleReceiptProcessed} />
          <ExtractionResults receipt={currentReceipt} extractedData={extractedData} />
        </div>

        {/* Navigation Cards */}
        <div className="mt-12 bg-white rounded-lg shadow-material-2 p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-material-grey-900 mb-2">Explore Raseed Features</h2>
            <p className="text-material-grey-600">AI-powered financial intelligence at your fingertips</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/chat">
              <Card className="cursor-pointer hover:shadow-material-3 transition-shadow">
                <CardContent className="text-center p-6">
                  <div className="w-16 h-16 bg-material-blue-700 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons text-2xl text-material-blue-700">chat</span>
                  </div>
                  <h3 className="font-medium text-material-grey-900 mb-2">AI Assistant</h3>
                  <p className="text-sm text-material-grey-600 mb-4">Ask questions about your spending patterns and get intelligent insights</p>
                  <Button className="w-full bg-material-blue-700 hover:bg-material-blue-800">
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/analytics">
              <Card className="cursor-pointer hover:shadow-material-3 transition-shadow">
                <CardContent className="text-center p-6">
                  <div className="w-16 h-16 bg-material-green-600 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons text-2xl text-material-green-600">analytics</span>
                  </div>
                  <h3 className="font-medium text-material-grey-900 mb-2">Spending Analytics</h3>
                  <p className="text-sm text-material-grey-600 mb-4">Detailed analysis of your purchase history with smart categorization</p>
                  <Button className="w-full bg-material-green-600 hover:bg-green-700">
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/insights">
              <Card className="cursor-pointer hover:shadow-material-3 transition-shadow">
                <CardContent className="text-center p-6">
                  <div className="w-16 h-16 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons text-2xl text-purple-600">lightbulb</span>
                  </div>
                  <h3 className="font-medium text-material-grey-900 mb-2">Smart Insights</h3>
                  <p className="text-sm text-material-grey-600 mb-4">Receive personalized savings suggestions and spending alerts</p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Get Insights
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-material-grey-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-material-blue-700 rounded-full flex items-center justify-center">
                <span className="material-icons text-white text-sm">receipt</span>
              </div>
              <span className="font-medium text-material-grey-900">Raseed</span>
            </div>
            <div className="text-sm text-material-grey-600">
              <p>Powered by Google Vertex AI & Wallet API</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
