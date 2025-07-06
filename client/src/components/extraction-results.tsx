import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Receipt, ExtractedReceiptData } from "@shared/schema";
import { useState } from "react";

interface ExtractionResultsProps {
  receipt: Receipt | null;
  extractedData: ExtractedReceiptData | null;
}

export default function ExtractionResults({ receipt, extractedData }: ExtractionResultsProps) {
  const [walletPassUrl, setWalletPassUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const walletMutation = useMutation({
    mutationFn: async (receiptId: number) => {
      const response = await apiRequest('POST', `/api/receipts/${receiptId}/wallet-pass`);
      return response.json();
    },
    onSuccess: (data) => {
      setWalletPassUrl(data.walletPass.addToWalletUrl);
      toast({
        title: "Success!",
        description: "Wallet pass created successfully",
      });
      
      // Open the wallet pass URL
      window.open(data.walletPass.addToWalletUrl, '_blank');
    },
    onError: (error) => {
      toast({
        title: "Wallet Pass Failed",
        description: error.message || "Unable to create wallet pass",
        variant: "destructive",
      });
    },
  });

  const handleGenerateWalletPass = () => {
    if (receipt?.id) {
      walletMutation.mutate(receipt.id);
    }
  };

  if (!receipt || !extractedData) {
    return (
      <Card className="shadow-material-2">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-material-grey-900 mb-2">Extracted Data</h2>
            <p className="text-material-grey-600">AI-powered receipt analysis results</p>
          </div>

          <div className="text-center py-12">
            <span className="material-icons text-6xl text-material-grey-600 mb-4">receipt_long</span>
            <h3 className="text-lg font-medium text-material-grey-900 mb-2">No Receipt Processed</h3>
            <p className="text-material-grey-600">Upload a receipt to see extracted data here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-material-2">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-material-grey-900 mb-2">Extracted Data</h2>
          <p className="text-material-grey-600">AI-powered receipt analysis results</p>
        </div>

        {/* Store Information */}
        <div className="mb-6 p-4 bg-material-grey-50 rounded-lg">
          <h3 className="font-medium text-material-grey-900 mb-3 flex items-center">
            <span className="material-icons text-material-blue-700 mr-2">store</span>
            Store Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-material-grey-600">Store Name</label>
              <p className="font-medium">{extractedData.store_name || "Unknown Store"}</p>
            </div>
            <div>
              <label className="text-sm text-material-grey-600">Date</label>
              <p className="font-medium">{extractedData.transaction_date || "Unknown Date"}</p>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="mb-6 p-4 bg-material-grey-50 rounded-lg">
          <h3 className="font-medium text-material-grey-900 mb-3 flex items-center">
            <span className="material-icons text-material-green-600 mr-2">attach_money</span>
            Transaction Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-material-grey-600">Subtotal</label>
              <p className="font-medium">
                {extractedData.total_amount && extractedData.tax_amount 
                  ? `$${(extractedData.total_amount - extractedData.tax_amount).toFixed(2)}`
                  : extractedData.total_amount 
                  ? `$${extractedData.total_amount.toFixed(2)}`
                  : "Unknown"
                }
              </p>
            </div>
            <div>
              <label className="text-sm text-material-grey-600">Tax</label>
              <p className="font-medium">
                {extractedData.tax_amount ? `$${extractedData.tax_amount.toFixed(2)}` : "Unknown"}
              </p>
            </div>
            <div className="col-span-2 pt-2 border-t border-material-grey-100">
              <label className="text-sm text-material-grey-600">Total Amount</label>
              <p className="text-xl font-medium text-material-green-600">
                {extractedData.total_amount ? `$${extractedData.total_amount.toFixed(2)}` : "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        {extractedData.line_items && extractedData.line_items.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-material-grey-900 mb-3 flex items-center">
              <span className="material-icons text-material-blue-700 mr-2">list</span>
              Items Purchased
            </h3>
            <div className="space-y-3">
              {extractedData.line_items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-material-grey-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-material-grey-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Pass Generation */}
        <div className="pt-4 border-t border-material-grey-100">
          <Button 
            className="w-full bg-material-blue-700 hover:bg-material-blue-800 text-white shadow-material-1"
            onClick={handleGenerateWalletPass}
            disabled={walletMutation.isPending}
          >
            {walletMutation.isPending ? (
              <>
                <span className="material-icons mr-2 animate-spin">autorenew</span>
                Creating Pass...
              </>
            ) : (
              <>
                <span className="material-icons mr-2">account_balance_wallet</span>
                Add to Google Wallet
              </>
            )}
          </Button>
          
          {/* Success message for wallet pass creation */}
          {walletPassUrl && (
            <div className="mt-3">
              <div className="bg-material-green-600 bg-opacity-10 border border-material-green-600 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-material-green-600">check_circle</span>
                  <p className="text-sm font-medium text-material-green-600">Pass created successfully!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
