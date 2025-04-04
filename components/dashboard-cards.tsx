"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDataContext, type OrderData, type MaterialPriceData } from "@/context/data-context"
import { format, parseISO, addMonths, isValid } from "date-fns"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowDown, TrendingUp } from 'lucide-react'

// Sample data to use if there's an error
const SAMPLE_DEMAND_DATA = [
  { date: "2023-01", quantity: 1200 },
  { date: "2023-02", quantity: 1250 },
  { date: "2023-03", quantity: 1300 },
  { date: "2023-04", quantity: 1280 },
  { date: "2023-05", quantity: 1350 },
  { date: "2023-06", quantity: 1400 },
  { date: "2023-07", quantity: 1450 },
  { date: "2023-08", quantity: 1500 },
  { date: "2023-09", quantity: 1550 },
  { date: "2023-10", quantity: 1600 },
  { date: "2023-11", quantity: 1650 },
  { date: "2023-12", quantity: 1700 },
];

export function DashboardCards() {
  const { ordersData, materialPricesData } = useDataContext()

  // Prepare data for demand prediction
  const demandPredictionData = useMemo(() => {
    try {
      if (ordersData.length === 0) {
        return SAMPLE_DEMAND_DATA;
      }
      
      // Group orders by month
      const monthlyOrders: Record<string, number> = {}

      ordersData.forEach((order) => {
        try {
          const date = parseISO(order["Date"])
          const monthYear = format(date, "yyyy-MM")

          if (!monthlyOrders[monthYear]) {
            monthlyOrders[monthYear] = 0
          }

          monthlyOrders[monthYear] += Number(order["Quantity"]) || 0
        } catch (error) {
          console.error("Error parsing date:", order["Date"])
        }
      })

      // Convert to array and sort by date
      const sortedData = Object.entries(monthlyOrders)
        .map(([date, quantity]) => ({ date, quantity }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Simple linear regression for prediction
      if (sortedData.length < 3) return sortedData

      const historicalData = sortedData.slice(-6) // Last 6 months

      // Calculate average monthly growth
      let totalGrowth = 0
      for (let i = 1; i < historicalData.length; i++) {
        const current = historicalData[i].quantity
        const previous = historicalData[i - 1].quantity

        if (previous > 0) {
          totalGrowth += (current - previous) / previous
        }
      }

      const avgGrowthRate = totalGrowth / (historicalData.length - 1)

      // Generate predictions for next 6 months
      const predictions = []
      const lastDataPoint = historicalData[historicalData.length - 1]
      
      try {
        const lastDate = parseISO(`${lastDataPoint.date}-01`)
        const lastQuantity = lastDataPoint.quantity

        if (isValid(lastDate)) {
          for (let i = 1; i <= 6; i++) {
            const predictionDate = format(addMonths(lastDate, i), "yyyy-MM")
            const predictedQuantity = lastQuantity * Math.pow(1 + avgGrowthRate, i)

            predictions.push({
              date: predictionDate,
              quantity: Math.round(predictedQuantity),
              predicted: true,
            })
          }
        }
      } catch (error) {
        console.error("Error generating predictions:", error)
      }

      return [...sortedData, ...predictions]
    } catch (error) {
      console.error("Error processing demand prediction data:", error)
      return SAMPLE_DEMAND_DATA;
    }
  }, [ordersData])

  // Prepare data for pricing optimization
  const pricingOptimizationData = useMemo(() => {
    try {
      if (ordersData.length === 0) {
        return [];
      }
      
      // Group products by price range and calculate average profit margin
      const productProfitByPrice: Record<string, { count: number; totalProfit: number }> = {}

      ordersData.forEach((order) => {
        const totalSale = Number(order["Total Sale"]) || 0
        const materialCost = Number(order["Raw Materials Cost (INR)"]) || 0
        const shippingCost = Number(order["Shipping Cost"]) || 0
        const tax = Number(order["Tax"]) || 0

        // Simplified profit calculation
        const profit = totalSale - materialCost - shippingCost - tax
        const profitMargin = profit / totalSale

        // Group by price range (in 5000 INR increments)
        const priceRange = Math.floor(totalSale / 5000) * 5000
        const priceRangeLabel = `₹${priceRange.toLocaleString()}-₹${(priceRange + 5000).toLocaleString()}`

        if (!productProfitByPrice[priceRangeLabel]) {
          productProfitByPrice[priceRangeLabel] = { count: 0, totalProfit: 0 }
        }

        productProfitByPrice[priceRangeLabel].count++
        productProfitByPrice[priceRangeLabel].totalProfit += profit
      })

      // Calculate average profit margin for each price range
      return Object.entries(productProfitByPrice)
        .map(([priceRange, data]) => ({
          priceRange,
          avgProfit: data.totalProfit / data.count,
          profitMargin:
            data.totalProfit / data.count / (Number.parseInt(priceRange.split("-")[0].replace(/[₹,]/g, "")) + 2500),
          orderCount: data.count,
        }))
        .sort(
          (a, b) =>
            Number.parseInt(a.priceRange.split("-")[0].replace(/[₹,]/g, "")) -
            Number.parseInt(b.priceRange.split("-")[0].replace(/[₹,]/g, "")),
        )
    } catch (error) {
      console.error("Error processing pricing optimization data:", error)
      return [];
    }
  }, [ordersData])

  // Prepare data for material purchase recommendations
  const materialPurchaseData = useMemo(() => {
    try {
      if (materialPricesData.length < 10) return []

      // Analyze price trends to identify optimal purchase periods
      const materialTrends: Record<string, { prices: number[]; dates: string[] }> = {
        Cement: { prices: [], dates: [] },
        Sand: { prices: [], dates: [] },
        Gravel: { prices: [], dates: [] },
        "Fly Ash": { prices: [], dates: [] },
        Water: { prices: [], dates: [] },
        Admixture: { prices: [], dates: [] },
      }

      // Sort by date
      const sortedPrices = [...materialPricesData].sort((a, b) => {
        return new Date(a["Date"]).getTime() - new Date(b["Date"]).getTime()
      })

      // Collect price data
      sortedPrices.forEach((price) => {
        Object.keys(materialTrends).forEach((material) => {
          materialTrends[material].prices.push(price[material as keyof MaterialPriceData] as number)
          materialTrends[material].dates.push(price["Date"])
        })
      })

      // Identify local minima in price trends (simplified approach)
      const recommendations: { material: string; date: string; price: number; saving: number }[] = []

      Object.entries(materialTrends).forEach(([material, data]) => {
        const { prices, dates } = data

        // Need at least 3 data points to identify trends
        if (prices.length < 3) return

        // Find local minima (a point where price is lower than both neighbors)
        for (let i = 1; i < prices.length - 1; i++) {
          if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
            // Calculate potential savings (difference from average price)
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
            const saving = avgPrice - prices[i]

            if (saving > 0) {
              recommendations.push({
                material,
                date: dates[i],
                price: prices[i],
                saving,
              })
            }
          }
        }
      })

      // Sort by potential savings (highest first)
      return recommendations.sort((a, b) => b.saving - a.saving)
    } catch (error) {
      console.error("Error processing material purchase data:", error)
      return [];
    }
  }, [materialPricesData])

  // Prepare data for operational efficiency
  const operationalEfficiencyData = useMemo(() => {
    try {
      if (ordersData.length === 0) {
        return [];
      }
      
      // Analyze delivery times by region
      const regionDeliveryTimes: Record<string, number[]> = {}

      ordersData.forEach((order) => {
        const region = order["Region"]
        const deliveryTime = Number(order["Delivery Time (days)"]) || 0

        if (!regionDeliveryTimes[region]) {
          regionDeliveryTimes[region] = []
        }

        regionDeliveryTimes[region].push(deliveryTime)
      })

      // Calculate average delivery time by region
      return Object.entries(regionDeliveryTimes)
        .map(([region, times]) => {
          const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
          return {
            region,
            avgDeliveryTime: avgTime,
            orderCount: times.length,
          }
        })
        .sort((a, b) => b.avgDeliveryTime - a.avgDeliveryTime)
    } catch (error) {
      console.error("Error processing operational efficiency data:", error)
      return [];
    }
  }, [ordersData])

  // Prepare data for profit maximization
  const profitMaximizationData = useMemo(() => {
    try {
      if (ordersData.length === 0) {
        return [];
      }
      
      // Calculate profit for each product
      const productProfits: Record<string, { totalSales: number; totalProfit: number; count: number }> = {}

      ordersData.forEach((order) => {
        const product = order["Product"]
        const totalSale = Number(order["Total Sale"]) || 0
        const materialCost = Number(order["Raw Materials Cost (INR)"]) || 0
        const shippingCost = Number(order["Shipping Cost"]) || 0
        const tax = Number(order["Tax"]) || 0

        // Simplified profit calculation
        const profit = totalSale - materialCost - shippingCost - tax

        if (!productProfits[product]) {
          productProfits[product] = { totalSales: 0, totalProfit: 0, count: 0 }
        }

        productProfits[product].totalSales += totalSale
        productProfits[product].totalProfit += profit
        productProfits[product].count++
      })

      // Calculate profit margin and average profit per order
      return Object.entries(productProfits)
        .map(([product, data]) => ({
          product,
          totalProfit: data.totalProfit,
          profitMargin: data.totalProfit / data.totalSales,
          avgProfit: data.totalProfit / data.count,
          orderCount: data.count,
        }))
        .sort((a, b) => b.totalProfit - a.totalProfit)
    } catch (error) {
      console.error("Error processing profit maximization data:", error)
      return [];
    }
  }, [ordersData])

  // Identify potential churn customers
  const churnRiskCustomers = useMemo(() => {
    try {
      if (ordersData.length === 0) {
        return [];
      }
      
      // Group orders by customer
      const customerOrders: Record<string, OrderData[]> = {}

      ordersData.forEach((order) => {
        const customerId = order["Customer ID"]

        if (!customerOrders[customerId]) {
          customerOrders[customerId] = []
        }

        customerOrders[customerId].push(order)
      })

      // Identify customers with declining order frequency or value
      const churnRisk: { customerId: string; customerName: string; riskFactors: string[]; lastOrderDate: string }[] = []

      Object.entries(customerOrders).forEach(([customerId, orders]) => {
        // Sort orders by date
        const sortedOrders = [...orders].sort((a, b) => {
          return new Date(a["Date"]).getTime() - new Date(b["Date"]).getTime()
        })

        const riskFactors = []

        // Check for declining order value
        if (sortedOrders.length >= 2) {
          const firstHalf = sortedOrders.slice(0, Math.floor(sortedOrders.length / 2))
          const secondHalf = sortedOrders.slice(Math.floor(sortedOrders.length / 2))

          const firstHalfAvg = firstHalf.reduce((sum, order) => sum + Number(order["Total Sale"]), 0) / firstHalf.length
          const secondHalfAvg =
            secondHalf.reduce((sum, order) => sum + Number(order["Total Sale"]), 0) / secondHalf.length

          if (secondHalfAvg < firstHalfAvg * 0.8) {
            riskFactors.push("Declining order value")
          }
        }

        // Check for negative reviews
        const lowReviews = orders.filter((order) => Number(order["Review Score"]) <= 2).length
        if (lowReviews > 0 && lowReviews / orders.length > 0.3) {
          riskFactors.push("Low satisfaction ratings")
        }

        // Check for returns
        const returns = orders.filter((order) => order["Return Requested"] === "Yes").length
        if (returns > 0) {
          riskFactors.push("Has requested returns")
        }

        if (riskFactors.length > 0) {
          churnRisk.push({
            customerId,
            customerName: sortedOrders[0]["Customer Name"],
            riskFactors,
            lastOrderDate: sortedOrders[sortedOrders.length - 1]["Date"],
          })
        }
      })

      return churnRisk
    } catch (error) {
      console.error("Error processing churn risk data:", error)
      return [];
    }
  }, [ordersData])

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>AI-Driven Business Insights</CardTitle>
          <CardDescription>Data-driven recommendations to optimize your business operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandPredictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      try {
                        return format(parseISO(`${value}-01`), "MMM yy")
                      } catch (error) {
                        return value;
                      }
                    }} 
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [value, "Quantity"]}
                    labelFormatter={(label) => {
                      try {
                        const item = demandPredictionData.find((d) => d.date === label)
                        return item?.predicted
                          ? `${format(parseISO(`${label}-01`), "MMM yyyy")} (Predicted)`
                          : format(parseISO(`${label}-01`), "MMM yyyy")
                      } catch (error) {
                        return label;
                      }
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Future Demand Insights</h3>
              
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Demand Trend</AlertTitle>
                <AlertDescription>
                  {demandPredictionData.length > 0 && demandPredictionData.filter((d) => d.predicted).length > 0 ? (
                    <>
                      Predicted{" "}
                      {demandPredictionData[demandPredictionData.length - 1].quantity >
                      demandPredictionData[demandPredictionData.length - 7].quantity
                        ? "increase"
                        : "decrease"}{" "}
                      in demand over the next 6 months.
                    </>
                  ) : (
                    "Insufficient data for prediction."
                  )}
                </AlertDescription>
              </Alert>
              
              {demandPredictionData.filter(d => d.predicted).length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm">Predicted demand growth:</p>
                  
                  <div className="border rounded-lg p-4">
                    {(() => {
                      const currentDemand = demandPredictionData.filter(d => !d.predicted).length > 0
                        ? demandPredictionData.filter(d => !d.predicted)[demandPredictionData.filter(d => !d.predicted).length - 1].quantity
                        : 0;
                      
                      const futureDemand = demandPredictionData.filter(d => d.predicted).length > 0
                        ? demandPredictionData[demandPredictionData.length - 1].quantity
                        : 0;
                      
                      const growthPercent = currentDemand > 0
                        ? ((futureDemand - currentDemand) / currentDemand) * 100
                        : 0;
                      
                      return (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Current monthly demand</p>
                          <p className="text-3xl font-bold mb-4">{currentDemand.toLocaleString()}</p>
                          
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-0.5 bg-muted"></div>
                            <div className="mx-4">
                              <p className={`text-lg font-semibold ${growthPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}%
                              </p>
                            </div>
                            <div className="w-16 h-0.5 bg-muted"></div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-4">Predicted in 6 months</p>
                          <p className="text-3xl font-bold">{futureDemand.toLocaleString()}</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Production Planning</AlertTitle>
                <AlertDescription>
                  {demandPredictionData.filter(d => d.predicted).length > 0 ? (
                    demandPredictionData[demandPredictionData.length - 1].quantity >
                    demandPredictionData[demandPredictionData.length - 7].quantity ? (
                      "Consider increasing production capacity to meet rising demand in the coming months."
                    ) : (
                      "Plan for reduced production volumes in the coming months to avoid excess inventory."
                    )
                  ) : (
                    "Upload more order data to receive production planning recommendations."
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Optimal Pricing Strategy</CardTitle>
          <CardDescription>Identify the most profitable price ranges for your products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pricingOptimizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priceRange" />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "profitMargin") return [`${(Number(value) * 100).toFixed(1)}%`, "Profit Margin"]
                      return [`₹${Number(value).toLocaleString()}`, "Avg. Profit"]
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="profitMargin" fill="hsl(var(--chart-1))" name="Profit Margin" />
                  <Bar yAxisId="right" dataKey="avgProfit" fill="hsl(var(--chart-2))" name="Avg. Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing Insights</h3>
              
              <Alert>
                <AlertTitle>Optimal Price Range</AlertTitle>
                <AlertDescription>
                  {pricingOptimizationData.length > 0 ? (
                    <>
                      The {pricingOptimizationData.sort((a, b) => b.profitMargin - a.profitMargin)[0].priceRange}
                      price range has the highest profit margin at{" "}
                      {(
                        pricingOptimizationData.sort((a, b) => b.profitMargin - a.profitMargin)[0].profitMargin *
                        100
                      ).toFixed(1)}
                      %.
                    </>
                  ) : (
                    "Insufficient data for pricing analysis."
                  )}
                </AlertDescription>
              </Alert>
              
              {pricingOptimizationData.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm">Price range performance:</p>
                  
                  {pricingOptimizationData
                    .sort((a, b) => b.profitMargin - a.profitMargin)
                    .slice(0, 3)
                    .map((range, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{range.priceRange}</p>
                          <p className="text-sm text-muted-foreground">
                            {range.orderCount} orders
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{(range.profitMargin * 100).toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{range.avgProfit.toLocaleString(undefined, {maximumFractionDigits: 0})} avg. profit
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Pricing Recommendation</AlertTitle>
                <AlertDescription>
                  {pricingOptimizationData.length > 0 ? (
                    `Consider adjusting your product pricing to target the ${
                      pricingOptimizationData.sort((a, b) => b.profitMargin - a.profitMargin)[0].priceRange
                    } range for maximum profitability.`
                  ) : (
                    "Upload more order data to receive pricing recommendations."
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Material Purchase Recommendations</CardTitle>
          <CardDescription>Identify optimal times to purchase raw materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4 h-[300px] overflow-auto">
              {materialPurchaseData.length > 0 ? (
                materialPurchaseData.slice(0, 5).map((rec, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{rec.material}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(rec.date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{rec.price.toFixed(2)}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        Save ₹{rec.saving.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Recommendations</AlertTitle>
                  <AlertDescription>
                    Insufficient price data to make purchase recommendations.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Purchase Strategy Insights</h3>
              
              <Alert>
                <AlertTitle>Optimal Purchase Timing</AlertTitle>
                <AlertDescription>
                  {materialPurchaseData.length > 0 ? (
                    `Based on historical data, ${materialPurchaseData[0].material} shows the highest potential savings when purchased at the right time.`
                  ) : (
                    "Upload more material price data to receive purchase timing recommendations."
                  )}
                </AlertDescription>
              </Alert>
              
              {materialPurchaseData.length > 0 && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Potential savings summary:</p>
                  
                  <div className="space-y-2">
                    {Object.entries(
                      materialPurchaseData.reduce((acc: Record<string, number>, item) => {
                        if (!acc[item.material]) acc[item.material] = 0;
                        acc[item.material] += item.saving;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([material, totalSaving], index) => (
                        <div key={index} className="flex justify-between">
                          <span>{material}</span>
                          <span className="font-medium">₹{totalSaving.toFixed(2)}</span>
                        </div>
                      ))
                    }
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium">Recommendation:</p>
                    <p className="text-sm text-muted-foreground">
                      Monitor price trends and purchase materials when they reach local price minima to maximize savings.
                    </p>
                  </div>
                </div>
              )}
              
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Bulk Purchase Strategy</AlertTitle>
                <AlertDescription>
                  {materialPurchaseData.length > 0 ? (
                    `Consider bulk purchases of ${materialPurchaseData[0].material} when prices drop below ₹${materialPurchaseData[0].price.toFixed(2)} to maximize cost savings.`
                  ) : (
                    "More historical data needed for bulk purchase recommendations."
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

     )
     )

