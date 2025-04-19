"use client"

import { useEffect, useState } from "react"
import Papa from "papaparse"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, Trash2 } from "lucide-react"
import { useDataContext, type OrderData, type MaterialPriceData } from "@/context/data-context"

// Define the URLs
const ordersFileUrl = "https://raw.githubusercontent.com/adarshpandey515/nextSIMS/main/Complex_Integrations_Tasks_With_RawMaterials_and_Cost.csv";
// const ordersFileUrl = "https://analytics515.blob.core.windows.net/analyticsblob/Complex_Integrations_Tasks_With_RawMaterials_and_Cost.csv"
const materialsFileUrl = "https://raw.githubusercontent.com/adarshpandey515/nextSIMS/main/Historical_RawMaterial_Prices_OneYear.csv";

export function DataUpload() {
  const { ordersData, setOrdersData, materialPricesData, setMaterialPricesData } = useDataContext()

  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [materialsError, setMaterialsError] = useState<string | null>(null)

  // Fetch and process orders data
  useEffect(() => {
    fetch(ordersFileUrl)
      .then((response) => response.text())
      .then((csvString) => {
        Papa.parse(csvString, {
          header: true,
          complete: (results:any) => {
            try {
              if (results.data.length === 0) {
                setOrdersError("The orders file appears to be empty")
                return
              }
              setOrdersData(results.data.map((row: any) => ({
                ...row,
                "Total Sale": Number(row["Total Sale"]) || 0,
                Quantity: Number(row["Quantity"]) || 0,
                "Shipping Cost": Number(row["Shipping Cost"]) || 0,
                Tax: Number(row["Tax"]) || 0,
                "Delivery Time (days)": Number(row["Delivery Time (days)"]) || 0,
                "Review Score": Number(row["Review Score"]) || 0,
                "Raw Materials Cost (INR)": Number(row["Raw Materials Cost (INR)"]) || 0,
              })))
            } catch (error:any) {
              setOrdersError("Error processing the orders file.")
              console.error(error)
            }
          },
          error: (error:any) => {
            setOrdersError(`Error parsing the orders file: ${error.message}`)
          },
        })
      })
      .catch((error) => {
        setOrdersError(`Error fetching the orders file: ${error.message}`)
      })
  }, [])

  // Fetch and process materials data
  useEffect(() => {
    fetch(materialsFileUrl)
      .then((response) => response.text())
      .then((csvString) => {
        Papa.parse(csvString, {
          header: true,
          complete: (results:any) => {
            try {
              if (results.data.length === 0) {
                setMaterialsError("The materials file appears to be empty")
                return
              }
              setMaterialPricesData(results.data.map((row: any) => ({
                ...row,
                Cement: Number(row["Cement"]) || 0,
                Sand: Number(row["Sand"]) || 0,
                Gravel: Number(row["Gravel"]) || 0,
                "Fly Ash": Number(row["Fly Ash"]) || 0,
                Water: Number(row["Water"]) || 0,
                Admixture: Number(row["Admixture"]) || 0,
              })))
            } catch (error) {
              setMaterialsError("Error processing the materials file.")
              console.error(error)
            }
          },
          error: (error:any) => {
            setMaterialsError(`Error parsing the materials file: ${error.message}`)
          },
        })
      })
      .catch((error) => {
        setMaterialsError(`Error fetching the materials file: ${error.message}`)
      })
  }, [])

  // Export data to CSV
  const exportData = (data: any[], filename: string) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Data Upload & Management</CardTitle>
        <CardDescription>View and manage construction materials data from CSV files</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Orders Data</TabsTrigger>
            <TabsTrigger value="materials">Raw Material Prices</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {ordersError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{ordersError}</AlertDescription>
              </Alert>
            )}

            {ordersData.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Orders Data Preview</h3>
                  <Button variant="outline" size="sm" onClick={() => exportData(ordersData, "orders_data_export.csv")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setOrdersData([])}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total Sale</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData.slice(0, 5).map((order, index) => (
                      <TableRow key={index}>
                        <TableCell>{order["Order ID"]}</TableCell>
                        <TableCell>{order["Customer Name"]}</TableCell>
                        <TableCell>{order["Product"]}</TableCell>
                        <TableCell>{order["Date"]}</TableCell>
                        <TableCell className="text-right">₹{order["Total Sale"].toLocaleString()}</TableCell>
                        <TableCell>{order["Status"]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            {materialsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{materialsError}</AlertDescription>
              </Alert>
            )}

            {materialPricesData.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Material Prices Data Preview</h3>
                  <Button variant="outline" size="sm" onClick={() => exportData(materialPricesData, "material_prices_export.csv")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setMaterialPricesData([])}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Cement</TableHead>
                      <TableHead className="text-right">Sand</TableHead>
                      <TableHead className="text-right">Gravel</TableHead>
                      <TableHead className="text-right">Fly Ash</TableHead>
                      <TableHead className="text-right">Water</TableHead>
                      <TableHead className="text-right">Admixture</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialPricesData.slice(0, 5).map((price, index) => (
                      <TableRow key={index}>
                        <TableCell>{price["Date"]}</TableCell>
                        <TableCell className="text-right">₹{price["Cement"].toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{price["Sand"].toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{price["Gravel"].toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{price["Fly Ash"].toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{price["Water"].toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{price["Admixture"].toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
// The DataUpload component fetches and displays orders data and raw material prices from CSV files.
// It allows users to preview the data, export it as CSV, and clear the data from the state.
// The component uses the PapaParse library to parse CSV data and the useDataContext hook to manage the state.
// It also includes error handling for data fetching and parsing, displaying alerts when errors occur.
// The component is structured using a card layout with tabs for easy navigation between orders data and material prices.
// The data is displayed in a table format, with options to export and clear the data.
// The component is designed to be reusable and can be integrated into a larger application for data management.  
