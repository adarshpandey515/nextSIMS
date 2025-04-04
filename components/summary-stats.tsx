"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDataContext } from "@/context/data-context"
import { BarChart3, Package, TrendingUp, Users } from "lucide-react"

export function SummaryStats() {
  const { summaryStats, ordersData, materialPricesData } = useDataContext()

  // Calculate additional stats
  const avgOrderValue = summaryStats.totalOrders ? summaryStats.totalRevenue / summaryStats.totalOrders : 0

  const uniqueProducts = new Set(ordersData.map((order) => order["Product"])).size

  const avgMaterialPrice =
    materialPricesData.length > 0
      ? materialPricesData.reduce((sum, item) => {
          const totalForDay =
            item["Cement"] + item["Sand"] + item["Gravel"] + item["Fly Ash"] + item["Water"] + item["Admixture"]
          return sum + totalForDay / 6 // Average of all materials for this day
        }, 0) / materialPricesData.length
      : 0

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{summaryStats.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Avg. ₹{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} per order
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryStats.totalOrders.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{uniqueProducts} unique products</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Material Costs</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{summaryStats.avgMaterialCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">Avg. cost per order</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryStats.totalCustomers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {ordersData.filter((order) => order["Customer Type"] === "Returning").length} returning customers
          </p>
        </CardContent>
      </Card>
    </>
  )
}

