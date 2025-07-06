import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm Raseed, your AI financial assistant. I can help you understand your spending patterns, categorize purchases, and provide insights about your financial habits. What would you like to know?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat', {
        message,
        userId: 1
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        content: data.response,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-material-grey-50">
      {/* Header */}
      <header className="bg-white shadow-material-1 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-material-blue-700 rounded-full flex items-center justify-center">
                <span className="material-icons text-white text-xl">chat</span>
              </div>
              <div>
                <h1 className="text-xl font-medium text-material-grey-900">AI Assistant</h1>
                <p className="text-sm text-material-grey-600">Chat with Raseed about your finances</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-material-2 h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="border-b border-material-grey-100">
            <CardTitle className="text-lg text-material-grey-900 flex items-center">
              <span className="material-icons mr-2 text-material-blue-700">psychology</span>
              Raseed AI Assistant
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.sender === 'user'
                        ? 'bg-material-blue-700 text-white ml-4'
                        : 'bg-white border border-material-grey-100 mr-4'
                    }`}
                  >
                    {message.sender === 'assistant' && (
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-material-blue-700 rounded-full flex items-center justify-center mr-2">
                          <span className="material-icons text-white text-sm">psychology</span>
                        </div>
                        <span className="text-sm font-medium text-material-grey-900">Raseed</span>
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${
                      message.sender === 'user' ? 'text-white' : 'text-material-grey-900'
                    }`}>
                      {message.content}
                    </p>
                    <p className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-material-grey-600'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-material-grey-100 rounded-lg p-4 mr-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-material-blue-700 rounded-full flex items-center justify-center">
                        <span className="material-icons text-white text-sm">psychology</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-material-grey-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-material-grey-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-material-grey-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-material-grey-100 p-4">
              <div className="flex space-x-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your spending, request insights, or get financial advice..."
                  className="flex-1"
                  disabled={chatMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatMutation.isPending}
                  className="bg-material-blue-700 hover:bg-material-blue-800"
                >
                  {chatMutation.isPending ? (
                    <span className="material-icons animate-spin">autorenew</span>
                  ) : (
                    <span className="material-icons">send</span>
                  )}
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "How much did I spend on groceries this month?",
                  "What are my spending patterns?",
                  "Create a shopping list for pasta dinner",
                  "Show me my biggest expenses"
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputMessage(suggestion)}
                    disabled={chatMutation.isPending}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}