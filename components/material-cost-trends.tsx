"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataContext } from "@/context/data-context"
import { format, addMonths, isValid } from "date-fns"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowDown, ArrowUp, TrendingUp } from "lucide-react"

// Sample data to use if there's an error
const SAMPLE_MATERIAL_DATA = [
  { date: "2023-01-01", Cement: 290, Sand: 60, Gravel: 75, "Fly Ash": 220, Water: 10, Admixture: 440 },
  { date: "2023-02-01", Cement: 295, Sand: 62, Gravel: 78, "Fly Ash": 225, Water: 11, Admixture: 445 },
  { date: "2023-03-01", Cement: 300, Sand: 65, Gravel: 80, "Fly Ash": 230, Water: 12, Admixture: 450 },
  { date: "2023-04-01", Cement: 305, Sand: 63, Gravel: 82, "Fly Ash": 235, Water: 11, Admixture: 455 },
  { date: "2023-05-01", Cement: 310, Sand: 64, Gravel: 79, "Fly Ash": 240, Water: 12, Admixture: 460 },
  { date: "2023-06-01", Cement: 315, Sand: 66, Gravel: 81, "Fly Ash": 245, Water: 13, Admixture: 465 },
  { date: "2023-07-01", Cement: 320, Sand: 68, Gravel: 83, "Fly Ash": 250, Water: 12, Admixture: 470 },
  { date: "2023-08-01", Cement: 325, Sand: 67, Gravel: 85, "Fly Ash": 255, Water: 13, Admixture: 475 },
  { date: "2023-09-01", Cement: 330, Sand: 69, Gravel: 87, "Fly Ash": 260, Water: 14, Admixture: 480 },
  { date: "2023-10-01", Cement: 335, Sand: 70, Gravel: 89, "Fly Ash": 265, Water: 13, Admixture: 485 },
  { date: "2023-11-01", Cement: 340, Sand: 72, Gravel: 91, "Fly Ash": 270, Water: 14, Admixture: 490 },
  { date: "2023-12-01", Cement: 345, Sand: 74, Gravel: 93, "Fly Ash": 275, Water: 15, Admixture: 495 },
]

export function MaterialCostTrends() {
  const { materialPricesData, ordersData } = useDataContext()
  const [materialView, setMaterialView] = useState<"trends" | "comparison">("trends")
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all")

  // Prepare data for material price trends
  const materialTrendsData = useMemo(() => {
    try {
      if (materialPricesData.length === 0) {
        return SAMPLE_MATERIAL_DATA
      }

      return materialPricesData
        .map((price) => {
          const date = price["Date"]
          return {
            date,
            Cement: price["Cement"],
            Sand: price["Sand"],
            Gravel: price["Gravel"],
            "Fly Ash": price["Fly Ash"],
            Water: price["Water"],
            Admixture: price["Admixture"],
          }
        })
        .sort((a, b) => {
          try {
            // Safely parse dates with error handling
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)

            // Check if dates are valid before comparing
            if (isValid(dateA) && isValid(dateB)) {
              return dateA.getTime() - dateB.getTime()
            }
            return 0
          } catch (error) {
            console.error("Error sorting dates:", error)
            return 0
          }
        })
    } catch (error) {
      console.error("Error processing material trends data:", error)
      return SAMPLE_MATERIAL_DATA
    }
  }, [materialPricesData])

  // Prepare data for material cost breakdown per product
  const materialCostBreakdownData = useMemo(() => {
    try {
      if (ordersData.length === 0) {
        return []
      }

      const productMaterialCosts: Record<string, Record<string, number>> = {}

      ordersData.forEach((order) => {
        const product = order["Product"]
        // Check if Raw Materials Used exists and is a string before splitting
        const rawMaterialsString = order["Raw Materials Used"] || ""
        const rawMaterials =
          typeof rawMaterialsString === "string" ? rawMaterialsString.split(",").map((m) => m.trim()) : []

        if (!productMaterialCosts[product]) {
          productMaterialCosts[product] = {
            Cement: 0,
            Sand: 0,
            Gravel: 0,
            "Fly Ash": 0,
            Water: 0,
            Admixture: 0,
          }
        }

        // Estimate material costs based on the raw materials used
        const totalMaterialCost = order["Raw Materials Cost (INR)"]
        const costPerMaterial = rawMaterials.length > 0 ? totalMaterialCost / rawMaterials.length : 0

        rawMaterials.forEach((material) => {
          if (material === "Cement") productMaterialCosts[product]["Cement"] += costPerMaterial
          else if (material === "Sand") productMaterialCosts[product]["Sand"] += costPerMaterial
          else if (material === "Gravel") productMaterialCosts[product]["Gravel"] += costPerMaterial
          else if (material === "Fly Ash") productMaterialCosts[product]["Fly Ash"] += costPerMaterial
          else if (material === "Water") productMaterialCosts[product]["Water"] += costPerMaterial
          else if (material === "Admixture") productMaterialCosts[product]["Admixture"] += costPerMaterial
        })
      })

      return Object.entries(productMaterialCosts)
        .map(([product, costs]) => ({
          product,
          ...costs,
          total: Object.values(costs).reduce((sum, cost) => sum + cost, 0),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    } catch (error) {
      console.error("Error processing material cost breakdown data:", error)
      return []
    }
  }, [ordersData])

  // Prepare data for cost fluctuations over time
  const costFluctuationsData = useMemo(() => {
    try {
      // Calculate month-over-month percentage changes
      const fluctuations = []

      for (let i = 1; i < materialTrendsData.length; i++) {
        const currentMonth = materialTrendsData[i]
        const previousMonth = materialTrendsData[i - 1]

        const changes: Record<string, number> = {
          date: currentMonth.date,
        }

        // Calculate percentage change for each material
        Object.keys(currentMonth).forEach((key) => {
          if (key !== "date") {
            const current = currentMonth[key as keyof typeof currentMonth] as number
            const previous = previousMonth[key as keyof typeof previousMonth] as number

            if (previous > 0) {
              changes[key] = ((current - previous) / previous) * 100
            } else {
              changes[key] = 0
            }
          }
        })

        fluctuations.push(changes)
      }

      return fluctuations
    } catch (error) {
      console.error("Error processing cost fluctuations data:", error)
      return []
    }
  }, [materialTrendsData])

  // Simple price prediction (linear extrapolation)
  const pricePredictionData = useMemo(() => {
    try {
      if (materialTrendsData.length < 10) return materialTrendsData

      const historicalData = materialTrendsData.slice(-12) // Last 12 months

      // Calculate average monthly change for each material
      const avgMonthlyChanges: Record<string, number> = {
        Cement: 0,
        Sand: 0,
        Gravel: 0,
        "Fly Ash": 0,
        Water: 0,
        Admixture: 0,
      }

      for (let i = 1; i < historicalData.length; i++) {
        const current = historicalData[i]
        const previous = historicalData[i - 1]

        Object.keys(avgMonthlyChanges).forEach((material) => {
          const currentPrice = current[material as keyof typeof current] as number
          const previousPrice = previous[material as keyof typeof previous] as number

          avgMonthlyChanges[material] += currentPrice - previousPrice
        })
      }

      // Calculate average
      Object.keys(avgMonthlyChanges).forEach((material) => {
        avgMonthlyChanges[material] /= historicalData.length - 1
      })

      // Generate predictions for next 6 months
      const predictions = []
      const lastDataPoint = historicalData[historicalData.length - 1]

      try {
        // Safely parse the last date with error handling
        const lastDateStr = lastDataPoint.date
        const lastDate = new Date(lastDateStr)

        // Only proceed if the date is valid
        if (isValid(lastDate)) {
          for (let i = 1; i <= 6; i++) {
            try {
              const nextDate = addMonths(lastDate, i)
              const predictionDate = format(nextDate, "yyyy-MM-dd")

              const prediction: Record<string, any> = {
                date: predictionDate,
                predicted: true,
              }

              Object.keys(avgMonthlyChanges).forEach((material) => {
                const lastPrice = lastDataPoint[material as keyof typeof lastDataPoint] as number
                prediction[material] = lastPrice + avgMonthlyChanges[material] * i

                // Ensure no negative prices
                if (prediction[material] < 0) prediction[material] = 0
              })

              predictions.push(prediction)
            } catch (error) {
              console.error("Error generating prediction for month", i, error)
            }
          }
        } else {
          console.error("Invalid last date:", lastDateStr)
        }
      } catch (error) {
        console.error("Error processing last date:", error)
      }

      // Combine historical and prediction data
      return [...historicalData, ...predictions]
    } catch (error) {
      console.error("Error processing price prediction data:", error)
      return materialTrendsData
    }
  }, [materialTrendsData])

  // Colors for charts
  const materialColors: Record<string, string> = {
    Cement: "hsl(var(--chart-1))",
    Sand: "hsl(var(--chart-2))",
    Gravel: "hsl(var(--chart-3))",
    "Fly Ash": "hsl(var(--chart-4))",
    Water: "hsl(var(--chart-5))",
    Admixture: "hsl(var(--chart-6))",
  }

  // Calculate insights
  const insights = useMemo(() => {
    try {
      if (materialTrendsData.length < 2) {
        return {
          trendingSummary: "Insufficient data for trend analysis",
          highestPrice: "N/A",
          lowestPrice: "N/A",
          volatileMaterial: "N/A",
          stableMaterial: "N/A",
          prediction: "More data needed for accurate predictions",
        }
      }

      // Get first and last data points
      const firstData = materialTrendsData[0]
      const lastData = materialTrendsData[materialTrendsData.length - 1]

      // Calculate overall trends
      const trends: Record<string, number> = {}
      Object.keys(materialColors).forEach((material) => {
        if (firstData[material as keyof typeof firstData] && lastData[material as keyof typeof lastData]) {
          const firstPrice = firstData[material as keyof typeof firstData] as number
          const lastPrice = lastData[material as keyof typeof lastData] as number
          trends[material] = ((lastPrice - firstPrice) / firstPrice) * 100
        }
      })

      // Find highest and lowest priced materials
      const latestPrices: Record<string, number> = {}
      Object.keys(materialColors).forEach((material) => {
        latestPrices[material] = lastData[material as keyof typeof lastData] as number
      })

      const highestMaterial = Object.entries(latestPrices).sort((a, b) => b[1] - a[1])[0]
      const lowestMaterial = Object.entries(latestPrices).sort((a, b) => a[1] - b[1])[0]

      // Calculate volatility (using standard deviation of percentage changes)
      const volatility: Record<string, number> = {}
      Object.keys(materialColors).forEach((material) => {
        const changes: number[] = []
        for (let i = 1; i < materialTrendsData.length; i++) {
          const current = materialTrendsData[i][material as keyof (typeof materialTrendsData)[0]] as number
          const previous = materialTrendsData[i - 1][material as keyof (typeof materialTrendsData)[0]] as number
          if (previous > 0) {
            changes.push(((current - previous) / previous) * 100)
          }
        }

        if (changes.length > 0) {
          const mean = changes.reduce((sum, val) => sum + val, 0) / changes.length
          const squaredDiffs = changes.map((val) => Math.pow(val - mean, 2))
          volatility[material] = Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / changes.length)
        } else {
          volatility[material] = 0
        }
      })

      const volatileMaterial = Object.entries(volatility).sort((a, b) => b[1] - a[1])[0]
      const stableMaterial = Object.entries(volatility).sort((a, b) => a[1] - b[1])[0]

      // Overall trend summary
      const avgTrend = Object.values(trends).reduce((sum, val) => sum + val, 0) / Object.values(trends).length
      const trendingSummary =
        avgTrend > 5
          ? "Material prices are trending upward"
          : avgTrend < -5
            ? "Material prices are trending downward"
            : "Material prices are relatively stable"

      // Prediction summary
      const predictionData = pricePredictionData.filter((d) => d.predicted)
      let prediction = "Insufficient data for predictions"

      if (predictionData.length > 0) {
        const firstPrediction = predictionData[0]
        const lastPrediction = predictionData[predictionData.length - 1]
        const predictionTrends: Record<string, number> = {}

        Object.keys(materialColors).forEach((material) => {
          const firstPrice = firstPrediction[material as keyof typeof firstPrediction] as number
          const lastPrice = lastPrediction[material as keyof typeof lastPrediction] as number
          predictionTrends[material] = ((lastPrice - firstPrice) / firstPrice) * 100
        })

        const avgPredictionTrend =
          Object.values(predictionTrends).reduce((sum, val) => sum + val, 0) / Object.values(predictionTrends).length

        prediction =
          avgPredictionTrend > 10
            ? "Prices expected to rise significantly in the next 6 months"
            : avgPredictionTrend > 5
              ? "Moderate price increases expected in the next 6 months"
              : avgPredictionTrend < -5
                ? "Price decreases expected in the next 6 months"
                : "Prices expected to remain stable in the next 6 months"
      }

      return {
        trendingSummary,
        highestPrice: `${highestMaterial[0]} (₹${highestMaterial[1].toFixed(2)})`,
        lowestPrice: `${lowestMaterial[0]} (₹${lowestMaterial[1].toFixed(2)})`,
        volatileMaterial: `${volatileMaterial[0]} (${volatileMaterial[1].toFixed(2)}% std dev)`,
        stableMaterial: `${stableMaterial[0]} (${stableMaterial[1].toFixed(2)}% std dev)`,
        prediction,
      }
    } catch (error) {
      console.error("Error calculating insights:", error)
      return {
        trendingSummary: "Error analyzing trends",
        highestPrice: "N/A",
        lowestPrice: "N/A",
        volatileMaterial: "N/A",
        stableMaterial: "N/A",
        prediction: "Error generating predictions",
      }
    }
  }, [materialTrendsData, pricePredictionData, materialColors])

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Raw Material Price Trends</CardTitle>
          <CardDescription>Track price changes of construction materials over time</CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Tabs value={materialView} onValueChange={(v) => setMaterialView(v as any)}>
              <TabsList>
                <TabsTrigger value="trends">Price Trends</TabsTrigger>
                <TabsTrigger value="comparison">Material Comparison</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <TabsList>
                <TabsTrigger value="all">All Materials</TabsTrigger>
                <TabsTrigger value="Cement">Cement</TabsTrigger>
                <TabsTrigger value="Sand">Sand</TabsTrigger>
                <TabsTrigger value="Gravel">Gravel</TabsTrigger>
                <TabsTrigger value="Fly Ash">Fly Ash</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              {materialView === "trends" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={materialTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        try {
                          const date = new Date(value)
                          return isValid(date) ? format(date, "MMM yyyy") : value
                        } catch (e) {
                          return value
                        }
                      }}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${value.toFixed(0)}`}
                      label={{ value: "Price (₹)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toFixed(2)}`, ""]}
                      labelFormatter={(label) => {
                        try {
                          const date = new Date(label)
                          return isValid(date) ? format(date, "dd MMM yyyy") : label
                        } catch (e) {
                          return label
                        }
                      }}
                    />
                    <Legend />
                    {selectedMaterial === "all" ? (
                      Object.keys(materialColors).map((material) => (
                        <Line
                          key={material}
                          type="monotone"
                          dataKey={material}
                          stroke={materialColors[material]}
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          name={material}
                        />
                      ))
                    ) : (
                      <Line
                        type="monotone"
                        dataKey={selectedMaterial}
                        stroke={materialColors[selectedMaterial] || "hsl(var(--chart-1))"}
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        name={selectedMaterial}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={materialTrendsData.filter((_, i) => i % 3 === 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        try {
                          const date = new Date(value)
                          return isValid(date) ? format(date, "MMM yyyy") : value
                        } catch (e) {
                          return value
                        }
                      }}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${value.toFixed(0)}`}
                      label={{ value: "Price (₹)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toFixed(2)}`, ""]}
                      labelFormatter={(label) => {
                        try {
                          const date = new Date(label)
                          return isValid(date) ? format(date, "dd MMM yyyy") : label
                        } catch (e) {
                          return label
                        }
                      }}
                    />
                    <Legend />
                    {selectedMaterial === "all" ? (
                      Object.keys(materialColors).map((material) => (
                        <Bar key={material} dataKey={material} fill={materialColors[material]} name={material} />
                      ))
                    ) : (
                      <Bar
                        dataKey={selectedMaterial}
                        fill={materialColors[selectedMaterial] || "hsl(var(--chart-1))"}
                        name={selectedMaterial}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Material Price Insights</h3>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Price Trend</AlertTitle>
                <AlertDescription>{insights.trendingSummary}</AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium">Highest Price</p>
                  <p className="text-lg">{insights.highestPrice}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium">Lowest Price</p>
                  <p className="text-lg">{insights.lowestPrice}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium">Most Volatile</p>
                  <p className="text-lg">{insights.volatileMaterial}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium">Most Stable</p>
                  <p className="text-lg">{insights.stableMaterial}</p>
                </div>
              </div>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Future Outlook</AlertTitle>
                <AlertDescription>{insights.prediction}</AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Material Cost Breakdown by Product</CardTitle>
          <CardDescription>Cost distribution of raw materials for top products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialCostBreakdownData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="product" width={150} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, ""]} />
                  <Legend />
                  {Object.keys(materialColors).map((material) => (
                    <Bar
                      key={material}
                      dataKey={material}
                      stackId="a"
                      fill={materialColors[material]}
                      name={material}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cost Breakdown Insights</h3>

              <Alert>
                <AlertTitle>Material Usage</AlertTitle>
                <AlertDescription>
                  {materialCostBreakdownData.length > 0
                    ? `${materialCostBreakdownData[0].product} uses the most raw materials by cost, with a total material cost of ₹${materialCostBreakdownData[0].total.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`
                    : "No product data available for analysis."}
                </AlertDescription>
              </Alert>

              {materialCostBreakdownData.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm">Top materials by product:</p>

                  {materialCostBreakdownData.slice(0, 3).map((product, index) => {
                    // Find the most used material for this product
                    const materials = Object.entries(product)
                      .filter(([key]) => key !== "product" && key !== "total")
                      .sort((a, b) => (b[1] as number) - (a[1] as number))

                    const topMaterial = materials.length > 0 ? materials[0] : null

                    return (
                      <div key={index} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{product.product}</p>
                          {topMaterial && (
                            <p className="text-sm text-muted-foreground">
                              Main material: {topMaterial[0]} (₹
                              {(topMaterial[1] as number).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₹{product.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-sm text-muted-foreground">Total material cost</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Optimization Opportunity</AlertTitle>
                <AlertDescription>
                  {materialCostBreakdownData.length > 0
                    ? `Consider reviewing the ${
                        Object.entries(materialCostBreakdownData[0])
                          .filter(([key]) => key !== "product" && key !== "total")
                          .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
                      } usage in ${materialCostBreakdownData[0].product} for potential cost savings.`
                    : "Upload product data to identify optimization opportunities."}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Cost Fluctuations</CardTitle>
          <CardDescription>Month-over-month price changes (%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costFluctuationsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      try {
                        const date = new Date(value)
                        return isValid(date) ? format(date, "MMM yyyy") : value
                      } catch (e) {
                        return value
                      }
                    }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                    label={{ value: "Change (%)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(2)}%`, ""]}
                    labelFormatter={(label) => {
                      try {
                        const date = new Date(label)
                        return isValid(date) ? format(date, "MMM yyyy") : label
                      } catch (e) {
                        return label
                      }
                    }}
                  />
                  <Legend />
                  {selectedMaterial === "all" ? (
                    Object.keys(materialColors).map((material) => (
                      <Line
                        key={material}
                        type="monotone"
                        dataKey={material}
                        stroke={materialColors[material]}
                        strokeWidth={2}
                        name={material}
                      />
                    ))
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={selectedMaterial}
                      stroke={materialColors[selectedMaterial] || "hsl(var(--chart-1))"}
                      strokeWidth={2}
                      name={selectedMaterial}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fluctuation Insights</h3>

              <Alert>
                <AlertTitle>Price Volatility</AlertTitle>
                <AlertDescription>
                  {costFluctuationsData.length > 0
                    ? `Material prices show ${insights.volatileMaterial.includes("N/A") ? "moderate" : "significant"} volatility, with ${insights.volatileMaterial.split(" ")[0]} being the most volatile.`
                    : "Insufficient data to analyze price volatility."}
                </AlertDescription>
              </Alert>

              {costFluctuationsData.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm">Recent price changes:</p>

                  {Object.keys(materialColors)
                    .slice(0, 4)
                    .map((material, index) => {
                      const latestChange =
                        costFluctuationsData.length > 0
                          ? (costFluctuationsData[costFluctuationsData.length - 1][material] as number) || 0
                          : 0

                      return (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{material}</p>
                          </div>
                          <div className="text-right flex items-center">
                            {latestChange > 0 ? (
                              <ArrowUp className="h-4 w-4 text-red-500 mr-1" />
                            ) : latestChange < 0 ? (
                              <ArrowDown className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <span className="w-4 mr-1">—</span>
                            )}
                            <p
                              className={`font-medium ${latestChange > 0 ? "text-red-500" : latestChange < 0 ? "text-green-500" : ""}`}
                            >
                              {latestChange.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Purchasing Strategy</AlertTitle>
                <AlertDescription>
                  {costFluctuationsData.length > 0
                    ? `Consider timing purchases of ${insights.volatileMaterial.split(" ")[0]} to take advantage of price dips, while maintaining regular purchasing schedules for ${insights.stableMaterial.split(" ")[0]}.`
                    : "Upload more price data to receive purchasing strategy recommendations."}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Future Price Prediction (6 Months)</CardTitle>
          <CardDescription>Simple linear extrapolation based on historical trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pricePredictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      try {
                        const date = new Date(value)
                        return isValid(date) ? format(date, "MMM yyyy") : value
                      } catch (e) {
                        return value
                      }
                    }}
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${value.toFixed(0)}`}
                    label={{ value: "Price (₹)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      return [`₹${Number(value).toFixed(2)}`, name]
                    }}
                    labelFormatter={(label) => {
                      try {
                        const date = new Date(label)
                        const item = pricePredictionData.find((d) => d.date === label)
                        return isValid(date)
                          ? item?.predicted
                            ? `${format(date, "dd MMM yyyy")} (Predicted)`
                            : format(date, "dd MMM yyyy")
                          : label
                      } catch (e) {
                        return label
                      }
                    }}
                  />
                  <Legend />
                  {selectedMaterial === "all" ? (
                    Object.keys(materialColors).map((material, index) => (
                      <Area
                        key={material}
                        type="monotone"
                        dataKey={material}
                        stroke={materialColors[material]}
                        fill={materialColors[material]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                        name={material}
                        activeDot={{ r: 8 }}
                      />
                    ))
                  ) : (
                    <Area
                      type="monotone"
                      dataKey={selectedMaterial}
                      stroke={materialColors[selectedMaterial] || "hsl(var(--chart-1))"}
                      fill={materialColors[selectedMaterial] || "hsl(var(--chart-1))"}
                      fillOpacity={0.3}
                      strokeWidth={2}
                      name={selectedMaterial}
                      activeDot={{ r: 8 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prediction Insights</h3>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Future Outlook</AlertTitle>
                <AlertDescription>{insights.prediction}</AlertDescription>
              </Alert>

              {pricePredictionData.filter((d) => d.predicted).length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm">Predicted prices (6 months):</p>

                  {Object.keys(materialColors)
                    .slice(0, 4)
                    .map((material, index) => {
                      const currentPrice =
                        materialTrendsData.length > 0
                          ? (materialTrendsData[materialTrendsData.length - 1][
                              material as keyof (typeof materialTrendsData)[0]
                            ] as number)
                          : 0

                      const predictedPrice =
                        pricePredictionData.filter((d) => d.predicted).length > 0
                          ? (pricePredictionData[pricePredictionData.length - 1][
                              material as keyof (typeof pricePredictionData)[0]
                            ] as number)
                          : 0

                      const changePercent =
                        currentPrice > 0 ? ((predictedPrice - currentPrice) / currentPrice) * 100 : 0

                      return (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{material}</p>
                            <p className="text-sm text-muted-foreground">Current: ₹{currentPrice.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{predictedPrice.toFixed(2)}</p>
                            <p
                              className={`text-sm ${changePercent > 0 ? "text-red-500" : changePercent < 0 ? "text-green-500" : "text-muted-foreground"} flex items-center justify-end`}
                            >
                              {changePercent > 0 ? (
                                <ArrowUp className="h-3 w-3 mr-1" />
                              ) : changePercent < 0 ? (
                                <ArrowDown className="h-3 w-3 mr-1" />
                              ) : null}
                              {changePercent.toFixed(1)}% in 6 months
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Planning Recommendation</AlertTitle>
                <AlertDescription>
                  {pricePredictionData.filter((d) => d.predicted).length > 0
                    ? `Based on predictions, consider ${insights.prediction.toLowerCase().includes("increase") ? "stocking up on materials now" : insights.prediction.toLowerCase().includes("decrease") ? "delaying major purchases" : "maintaining regular purchasing schedules"} to optimize costs.`
                    : "More historical data is needed for accurate planning recommendations."}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

