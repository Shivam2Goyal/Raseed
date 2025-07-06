import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Receipt, ExtractedReceiptData } from "@shared/schema";
import CameraModal from "@/components/ui/camera-modal";

interface ReceiptUploaderProps {
  onReceiptProcessed: (receipt: Receipt, extractedData: ExtractedReceiptData) => void;
}

export default function ReceiptUploader({ onReceiptProcessed }: ReceiptUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiRequest('POST', '/api/receipts/process', formData);
      return response.json();
    },
    onSuccess: (data) => {
      onReceiptProcessed(data.receipt, data.extractedData);
      toast({
        title: "Success!",
        description: "Receipt processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: error.message || "Unable to process receipt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    processMutation.mutate(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-material-2">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-material-grey-900 mb-2">Upload Receipt</h2>
          <p className="text-material-grey-600">Take a photo or upload an image of your receipt to get started</p>
        </div>

        {/* Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-material-blue-700 bg-material-blue-700 bg-opacity-5' 
              : 'border-material-grey-100 hover:border-material-blue-700'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <div className="mb-4">
            <span className="material-icons text-6xl text-material-grey-600">cloud_upload</span>
          </div>
          <h3 className="text-lg font-medium text-material-grey-900 mb-2">Drop your receipt here</h3>
          <p className="text-material-grey-600 mb-4">or click to browse files</p>
          <Button 
            className="bg-material-blue-700 hover:bg-material-blue-800 text-white"
            disabled={processMutation.isPending}
          >
            Choose File
          </Button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileInputChange}
          />
        </div>

        {/* Camera Option */}
        <div className="mt-4 pt-4 border-t border-material-grey-100">
          <Button 
            className="w-full bg-material-green-600 hover:bg-green-700 text-white"
            onClick={() => setShowCamera(true)}
            disabled={processMutation.isPending}
          >
            <span className="material-icons mr-2">camera_alt</span>
            Take Photo
          </Button>
        </div>

        {/* Processing State */}
        {processMutation.isPending && (
          <div className="mt-6">
            <div className="bg-material-blue-700 bg-opacity-10 border border-material-blue-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin">
                  <span className="material-icons text-material-blue-700">autorenew</span>
                </div>
                <div>
                  <p className="font-medium text-material-blue-700">Processing Receipt</p>
                  <p className="text-sm text-material-grey-600">AI is extracting data from your receipt...</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-material-grey-100 rounded-full h-2">
                  <div className="bg-material-blue-700 h-2 rounded-full w-3/4 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {processMutation.isError && (
          <div className="mt-6">
            <div className="bg-material-red-700 bg-opacity-10 border border-material-red-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="material-icons text-material-red-700 mt-0.5">error</span>
                <div>
                  <p className="font-medium text-material-red-700">Processing Failed</p>
                  <p className="text-sm text-material-grey-600 mt-1">
                    {processMutation.error?.message || "Unable to extract data from the receipt. Please try again with a clearer image."}
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-3 text-material-blue-700 hover:text-material-blue-800 p-0 h-auto font-medium text-sm"
                    onClick={() => processMutation.reset()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <CameraModal 
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          onCapture={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}
