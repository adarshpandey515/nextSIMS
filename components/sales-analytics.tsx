"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataContext } from "@/context/data-context"
import { format, parseISO } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export function SalesAnalytics() {
  const { ordersData } = useDataContext()
  const [revenueView, setRevenueView] = useState<"monthly" | "regional">("monthly")

  // Prepare data for monthly revenue chart
  const monthlyRevenueData = useMemo(() => {
    const monthlyData: Record<string, number> = {}

    ordersData.forEach((order) => {
      try {
        const date = parseISO(order["Date"])
        const monthYear = format(date, "MMM yyyy")

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = 0
        }

        monthlyData[monthYear] += Number(order["Total Sale"]) || 0
      } catch (error) {
        console.error("Error parsing date:", order["Date"])
      }
    })

    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => {
        // Sort by date
        const monthA = a.month.split(" ")[0]
        const yearA = a.month.split(" ")[1]
        const monthB = b.month.split(" ")[0]
        const yearB = b.month.split(" ")[1]

        if (yearA !== yearB) return Number(yearA) - Number(yearB)

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return months.indexOf(monthA) - months.indexOf(monthB)
      })
  }, [ordersData])

  // Prepare data for regional revenue chart
  const regionalRevenueData = useMemo(() => {
    const regionalData: Record<string, number> = {}

    ordersData.forEach((order) => {
      const region = order["Region"] || "Unknown"

      if (!regionalData[region]) {
        regionalData[region] = 0
      }

      regionalData[region] += Number(order["Total Sale"]) || 0
    })

    return Object.entries(regionalData)
      .map(([region, revenue]) => ({ region, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [ordersData])

  // Prepare data for customer type chart
  const customerTypeData = useMemo(() => {
    const customerTypes: Record<string, number> = {}

    ordersData.forEach((order) => {
      const type = order["Customer Type"] || "Unknown"

      if (!customerTypes[type]) {
        customerTypes[type] = 0
      }

      customerTypes[type]++
    })

    return Object.entries(customerTypes).map(([name, value]) => ({ name, value }))
  }, [ordersData])

  // Prepare data for top products chart
  const topProductsData = useMemo(() => {
    const products: Record<string, number> = {}

    ordersData.forEach((order) => {
      const product = order["Product"] || "Unknown"

      if (!products[product]) {
        products[product] = 0
      }

      products[product] += Number(order["Total Sale"]) || 0
    })

    return Object.entries(products)
      .map(([product, revenue]) => ({ product, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [ordersData])

  // Prepare data for order status chart
  const orderStatusData = useMemo(() => {
    const statuses: Record<string, number> = {}

    ordersData.forEach((order) => {
      const status = order["Status"] || "Unknown"

      if (!statuses[status]) {
        statuses[status] = 0
      }

      statuses[status]++
    })

    return Object.entries(statuses).map(([name, value]) => ({ name, value }))
  }, [ordersData])

  // Prepare data for delivery time chart
  const deliveryTimeData = useMemo(() => {
    const deliveryTimes: Record<string, number[]> = {}

    ordersData.forEach((order) => {
      try {
        const date = parseISO(order["Date"])
        const monthYear = format(date, "MMM yyyy")

        if (!deliveryTimes[monthYear]) {
          deliveryTimes[monthYear] = []
        }

        deliveryTimes[monthYear].push(Number(order["Delivery Time (days)"]) || 0)
      } catch (error) {
        console.error("Error parsing date:", order["Date"])
      }
    })

    return Object.entries(deliveryTimes)
      .map(([month, times]) => {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
        return { month, avgDeliveryTime: avgTime }
      })
      .sort((a, b) => {
        // Sort by date
        const monthA = a.month.split(" ")[0]
        const yearA = a.month.split(" ")[1]
        const monthB = b.month.split(" ")[0]
        const yearB = b.month.split(" ")[1]

        if (yearA !== yearB) return Number(yearA) - Number(yearB)

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return months.indexOf(monthA) - months.indexOf(monthB)
      })
  }, [ordersData])

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Revenue Analysis</CardTitle>
          <CardDescription>Track your revenue trends over time and across regions</CardDescription>
          <Tabs value={revenueView} onValueChange={(v) => setRevenueView(v as any)} className="mt-2">
            <TabsList>
              <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
              <TabsTrigger value="regional">Regional Distribution</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {revenueView === "monthly" ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                    label={{ value: "Revenue (₹)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                    label={{ value: "Revenue (₹)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#0088FE">
                    {regionalRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Analysis</CardTitle>
          <CardDescription>New vs. Returning Customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {customerTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Customers"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Products generating the most revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="product" width={150} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#00C49F">
                  {topProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
          <CardDescription>Distribution of order statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Orders"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Average Delivery Time</CardTitle>
          <CardDescription>Average delivery time in days by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deliveryTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} days`, "Avg. Delivery Time"]} />
                <Line type="monotone" dataKey="avgDeliveryTime" stroke="#FF8042" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

