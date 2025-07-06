import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Receipt, Store, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ReceiptInfo {
  id: number;
  storeName: string;
  date: string;
  total: string;
}

export default function ReceiptChat() {
  const { id } = useParams();
  const receiptId = parseInt(id || '0');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Get receipt details
  const { data: receipt, isLoading: receiptLoading } = useQuery({
    queryKey: ['/api/receipts', receiptId],
    enabled: !!receiptId
  });

  // Chat mutation for receipt-specific conversations
  const chatMutation = useMutation({
    mutationFn: async (chatMessage: string) => {
      const response = await apiRequest(`/api/receipts/${receiptId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: chatMessage,
          userId: 1 // Default user for now
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString() + '-assistant',
          content: data.response,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add welcome message when component loads
  useEffect(() => {
    if (receipt?.storeName) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: `Hi! I'm here to help you with your receipt from ${receipt.storeName}. You can ask me about specific items, spending patterns, or get insights about this purchase. What would you like to know?`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [receipt]);

  if (receiptLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">Loading receipt details...</div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                Receipt not found. Please check the receipt ID and try again.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Receipt Info Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Receipt Chat</CardTitle>
                <CardDescription>
                  Chat with AI about your receipt from {receipt.storeName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{receipt.storeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{receipt.transactionDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold">${receipt.totalAmount}</span>
              </div>
            </div>
            
            {receipt.lineItems && receipt.lineItems.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Items Purchased:</h4>
                <div className="flex flex-wrap gap-2">
                  {receipt.lineItems.slice(0, 6).map((item: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {item.description} ({item.quantity}x)
                    </Badge>
                  ))}
                  {receipt.lineItems.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{receipt.lineItems.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </div>
            <Separator />
          </CardHeader>
          
          {/* Messages Area */}
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'assistant' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {msg.sender === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          You
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {chatMutation.isPending && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about this receipt..."
                  disabled={chatMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={chatMutation.isPending || !message.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Try asking: "What did I buy?", "How much did I spend on groceries?", or "Give me insights about this purchase"
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}