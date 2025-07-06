import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Insight {
  id: number;
  insightText: string;
  insightType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Insights() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: insightsData, isLoading } = useQuery({
    queryKey: ['/api/insights'],
    select: (data: any) => data?.insights || []
  });

  const generateInsightMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/insights/generate', { userId: 1 });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/insights'] });
      toast({
        title: "New Insight Generated!",
        description: data.insight ? "Check out your latest spending insight" : data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate new insights",
        variant: "destructive",
      });
    },
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return 'trending_up';
      case 'savings':
        return 'savings';
      case 'alert':
        return 'warning';
      default:
        return 'lightbulb';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'bg-material-blue-700';
      case 'savings':
        return 'bg-material-green-600';
      case 'alert':
        return 'bg-material-red-700';
      default:
        return 'bg-purple-600';
    }
  };

  return (
    <div className="min-h-screen bg-material-grey-50">
      {/* Header */}
      <header className="bg-white shadow-material-1 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="material-icons text-white text-xl">lightbulb</span>
              </div>
              <div>
                <h1 className="text-xl font-medium text-material-grey-900">Smart Insights</h1>
                <p className="text-sm text-material-grey-600">AI-powered financial insights</p>
              </div>
            </div>
            <Button 
              onClick={() => generateInsightMutation.mutate()}
              disabled={generateInsightMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateInsightMutation.isPending ? (
                <>
                  <span className="material-icons mr-2 animate-spin text-sm">autorenew</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">psychology</span>
                  Generate Insight
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Intro Card */}
        <Card className="shadow-material-2 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center">
                <span className="material-icons text-3xl text-purple-600">psychology</span>
              </div>
              <div>
                <h2 className="text-xl font-medium text-material-grey-900 mb-1">AI-Powered Financial Insights</h2>
                <p className="text-material-grey-600">
                  Get personalized insights about your spending patterns, trends, and opportunities to save money.
                  Our AI analyzes your receipts to provide actionable recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-icons animate-spin text-purple-600 text-4xl">autorenew</span>
          </div>
        ) : insightsData.length > 0 ? (
          <div className="grid gap-6">
            {insightsData.map((insight: Insight) => (
              <Card key={insight.id} className="shadow-material-2">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${getInsightColor(insight.insightType)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="material-icons text-white text-xl">
                        {getInsightIcon(insight.insightType)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="capitalize">
                          {insight.insightType} Insight
                        </Badge>
                        <span className="text-sm text-material-grey-600">
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-material-grey-900 leading-relaxed">
                        {insight.insightText}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-material-2">
            <CardContent className="text-center py-12">
              <span className="material-icons text-6xl text-material-grey-600 mb-4">lightbulb</span>
              <h3 className="text-lg font-medium text-material-grey-900 mb-2">No Insights Yet</h3>
              <p className="text-material-grey-600 mb-6">
                Upload some receipts and generate insights to see AI-powered recommendations about your spending.
              </p>
              <Button 
                onClick={() => generateInsightMutation.mutate()}
                disabled={generateInsightMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generateInsightMutation.isPending ? (
                  <>
                    <span className="material-icons mr-2 animate-spin text-sm">autorenew</span>
                    Generating First Insight...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">psychology</span>
                    Generate Your First Insight
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Overview */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="shadow-material-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-material-blue-700 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-material-blue-700">trending_up</span>
              </div>
              <h3 className="font-medium text-material-grey-900 mb-2">Spending Trends</h3>
              <p className="text-sm text-material-grey-600">
                Identify patterns in your spending habits over time
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-material-green-600 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-material-green-600">savings</span>
              </div>
              <h3 className="font-medium text-material-grey-900 mb-2">Savings Opportunities</h3>
              <p className="text-sm text-material-grey-600">
                Discover ways to save money based on your purchase history
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-material-red-700 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-material-red-700">warning</span>
              </div>
              <h3 className="font-medium text-material-grey-900 mb-2">Spending Alerts</h3>
              <p className="text-sm text-material-grey-600">
                Get notified about unusual spending patterns
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}