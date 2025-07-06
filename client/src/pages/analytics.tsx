import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Analytics() {
  const [timePeriod, setTimePeriod] = useState("last_month");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data: spendingData, isLoading } = useQuery({
    queryKey: ['/api/spending/analysis', { timePeriod, category: selectedCategory }],
    enabled: !!timePeriod,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['/api/spending/categories'],
  });

  const totalSpent = spendingData?.data?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;

  return (
    <div className="min-h-screen bg-material-grey-50">
      {/* Header */}
      <header className="bg-white shadow-material-1 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-material-green-600 rounded-full flex items-center justify-center">
                <span className="material-icons text-white text-xl">analytics</span>
              </div>
              <div>
                <h1 className="text-xl font-medium text-material-grey-900">Spending Analytics</h1>
                <p className="text-sm text-material-grey-600">Track your spending patterns</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Groceries">Groceries</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Clothing">Clothing</SelectItem>
              <SelectItem value="Restaurants">Restaurants</SelectItem>
              <SelectItem value="Subscriptions">Subscriptions</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="General Merchandise">General Merchandise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-material-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-material-grey-900">Total Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-material-green-600">
                ${totalSpent.toFixed(2)}
              </div>
              <p className="text-sm text-material-grey-600 capitalize">{timePeriod.replace('_', ' ')}</p>
            </CardContent>
          </Card>

          <Card className="shadow-material-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-material-grey-900">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-material-blue-700">
                {spendingData?.data?.length || 0}
              </div>
              <p className="text-sm text-material-grey-600">Active spending categories</p>
            </CardContent>
          </Card>

          <Card className="shadow-material-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-material-grey-900">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {spendingData?.data?.reduce((sum: number, item: any) => sum + item.count, 0) || 0}
              </div>
              <p className="text-sm text-material-grey-600">Total purchases</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="shadow-material-2">
          <CardHeader>
            <CardTitle className="text-xl text-material-grey-900">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-icons animate-spin text-material-blue-700 text-4xl">autorenew</span>
              </div>
            ) : spendingData?.data?.length > 0 ? (
              <div className="space-y-4">
                {spendingData.data.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-material-grey-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-material-blue-700 bg-opacity-10 rounded-full flex items-center justify-center">
                        <span className="material-icons text-material-blue-700">category</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-material-grey-900">{item.category}</h3>
                        <p className="text-sm text-material-grey-600">{item.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-material-grey-900">${item.total.toFixed(2)}</p>
                      <p className="text-sm text-material-grey-600">
                        {totalSpent > 0 ? Math.round((item.total / totalSpent) * 100) : 0}% of total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-icons text-6xl text-material-grey-600 mb-4">pie_chart</span>
                <h3 className="text-lg font-medium text-material-grey-900 mb-2">No Spending Data</h3>
                <p className="text-material-grey-600">Upload some receipts to see your spending analytics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}