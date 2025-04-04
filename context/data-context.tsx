"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type OrderData = {
  "Order ID": string
  "Customer ID": string
  "Customer Name": string
  Product: string
  Category: string
  Size: string
  Location: string
  Region: string
  "Total Sale": number
  Quantity: number
  "Payment Method": string
  "Payment Confirmation": string
  Date: string
  "Process Timestamp": string
  Status: string
  "Customer Type": string
  "Order Source": string
  "Discount Applied": string
  "Discount Amount": string
  "Shipping Cost": number
  Tax: number
  "Delivery Time (days)": number
  "Employee Assigned": string
  "Warranty Period (days)": string
  "Return Requested": string
  "Review Score": number
  Feedback: string
  "Raw Materials Used": string
  "Raw Materials Cost (INR)": number
}

export type MaterialPriceData = {
  Date: string
  Cement: number
  Sand: number
  Gravel: number
  "Fly Ash": number
  Water: number
  Admixture: number
}

type DataContextType = {
  ordersData: OrderData[]
  setOrdersData: (data: OrderData[]) => void
  materialPricesData: MaterialPriceData[]
  setMaterialPricesData: (data: MaterialPriceData[]) => void
  summaryStats: {
    totalOrders: number
    totalRevenue: number
    avgMaterialCost: number
    totalCustomers: number
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [ordersData, setOrdersData] = useState<OrderData[]>([])
  const [materialPricesData, setMaterialPricesData] = useState<MaterialPriceData[]>([])

  // Calculate summary statistics
  const summaryStats = {
    totalOrders: ordersData.length,
    totalRevenue: ordersData.reduce((sum, order) => sum + (Number(order["Total Sale"]) || 0), 0),
    avgMaterialCost: ordersData.length
      ? ordersData.reduce((sum, order) => sum + (Number(order["Raw Materials Cost (INR)"]) || 0), 0) / ordersData.length
      : 0,
    totalCustomers: new Set(ordersData.map((order) => order["Customer ID"])).size,
  }

  return (
    <DataContext.Provider
      value={{
        ordersData,
        setOrdersData,
        materialPricesData,
        setMaterialPricesData,
        summaryStats,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useDataContext() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useDataContext must be used within a DataProvider")
  }
  return context
}

