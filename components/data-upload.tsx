"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import Papa from "papaparse"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, FileUp, Trash2 } from "lucide-react"
import { useDataContext, type OrderData, type MaterialPriceData } from "@/context/data-context"
import { DashboardCards } from "@/components/dashboard-cards"

export function DataUpload() {
  const { ordersData, setOrdersData, materialPricesData, setMaterialPricesData, summaryStats } = useDataContext()

  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [materialsError, setMaterialsError] = useState<string | null>(null)

  const ordersDropzone = useDropzone({
    accept: {
      "text/csv": [".csv"],
    },
    onDrop: (acceptedFiles) => {
      setOrdersError(null)
      const file = acceptedFiles[0]
      if (file) {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            try {
              // Basic validation
              if (results.data.length === 0) {
                setOrdersError("The file appears to be empty")
                return
              }

              const firstRow = results.data[0] as any
              if (!firstRow["Order ID"] || !firstRow["Product"]) {
                setOrdersError("The file doesn't match the expected format for orders data")
                return
              }

              // Convert numeric fields
              const processedData = results.data.map((row: any) => ({
                ...row,
                "Total Sale": Number(row["Total Sale"]) || 0,
                Quantity: Number(row["Quantity"]) || 0,
                "Shipping Cost": Number(row["Shipping Cost"]) || 0,
                Tax: Number(row["Tax"]) || 0,
                "Delivery Time (days)": Number(row["Delivery Time (days)"]) || 0,
                "Review Score": Number(row["Review Score"]) || 0,
                "Raw Materials Cost (INR)": Number(row["Raw Materials Cost (INR)"]) || 0,
              }))

              setOrdersData(processedData as OrderData[])
            } catch (error) {
              setOrdersError("Error processing the file. Please check the format.")
              console.error(error)
            }
          },
          error: (error) => {
            setOrdersError(`Error parsing the file: ${error.message}`)
          },
        })
      }
    },
  })

  const materialsDropzone = useDropzone({
    accept: {
      "text/csv": [".csv"],
    },
    onDrop: (acceptedFiles) => {
      setMaterialsError(null)
      const file = acceptedFiles[0]
      if (file) {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            try {
              // Basic validation
              if (results.data.length === 0) {
                setMaterialsError("The file appears to be empty")
                return
              }

              const firstRow = results.data[0] as any
              if (!firstRow["Date"] || !firstRow["Cement"]) {
                setMaterialsError("The file doesn't match the expected format for material prices data")
                return
              }

              // Convert numeric fields
              const processedData = results.data.map((row: any) => ({
                ...row,
                Cement: Number(row["Cement"]) || 0,
                Sand: Number(row["Sand"]) || 0,
                Gravel: Number(row["Gravel"]) || 0,
                "Fly Ash": Number(row["Fly Ash"]) || 0,
                Water: Number(row["Water"]) || 0,
                Admixture: Number(row["Admixture"]) || 0,
              }))

              setMaterialPricesData(processedData as MaterialPriceData[])
            } catch (error) {
              setMaterialsError("Error processing the file. Please check the format.")
              console.error(error)
            }
          },
          error: (error) => {
            setMaterialsError(`Error parsing the file: ${error.message}`)
          },
        })
      }
    },
  })

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
    <>
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Data Upload & Management</CardTitle>
          <CardDescription>Upload your CSV files to analyze your construction materials data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Orders Data</TabsTrigger>
              <TabsTrigger value="materials">Raw Material Prices</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="space-y-4">
              <div
                {...ordersDropzone.getRootProps()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input {...ordersDropzone.getInputProps()} />
                <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-semibold">Upload Orders CSV File</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop your orders CSV file here, or click to select
                </p>
              </div>

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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportData(ordersData, "orders_data_export.csv")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setOrdersData([])}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border">
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
                            <TableCell className="font-medium">{order["Order ID"]}</TableCell>
                            <TableCell>{order["Customer Name"]}</TableCell>
                            <TableCell>{order["Product"]}</TableCell>
                            <TableCell>{order["Date"]}</TableCell>
                            <TableCell className="text-right">₹{order["Total Sale"].toLocaleString()}</TableCell>
                            <TableCell>{order["Status"]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Showing 5 of {ordersData.length} rows
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <div
                {...materialsDropzone.getRootProps()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input {...materialsDropzone.getInputProps()} />
                <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-semibold">Upload Material Prices CSV File</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop your material prices CSV file here, or click to select
                </p>
              </div>

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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportData(materialPricesData, "material_prices_export.csv")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setMaterialPricesData([])}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border">
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
                            <TableCell className="font-medium">{price["Date"]}</TableCell>
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
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Showing 5 of {materialPricesData.length} rows
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

     
    </>
  )
}

