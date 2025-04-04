"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataUpload } from "@/components/data-upload"
import { SalesAnalytics } from "@/components/sales-analytics"
import { MaterialCostTrends } from "@/components/material-cost-trends"
import { GrowthInsights } from "@/components/growth-insights"
import { DashboardHeader } from "@/components/dashboard-header"
import { useDataContext } from "@/context/data-context"
import { DataProvider } from "@/context/data-context"

function DashboardContent() {
  const { ordersData, materialPricesData } = useDataContext()
  const [activeTab, setActiveTab] = useState("upload")

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader />
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Data Upload & Management</TabsTrigger>
            <TabsTrigger
              value="sales"
              disabled={!ordersData.length}
              title={!ordersData.length ? "Upload orders data first" : ""}
            >
              Sales & Business Analytics
            </TabsTrigger>
            <TabsTrigger
              value="materials"
              disabled={!materialPricesData.length}
              title={!materialPricesData.length ? "Upload material prices data first" : ""}
            >
              Material Cost Trends
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              disabled={!ordersData.length || !materialPricesData.length}
              title={!ordersData.length || !materialPricesData.length ? "Upload both datasets first" : ""}
            >
              Growth & Optimization
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-4">
            <DataUpload />
          </TabsContent>
          <TabsContent value="sales" className="space-y-4">
            <SalesAnalytics />
          </TabsContent>
          <TabsContent value="materials" className="space-y-4">
            <MaterialCostTrends />
          </TabsContent>
          <TabsContent value="insights" className="space-y-4">
            <GrowthInsights />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  )
}

