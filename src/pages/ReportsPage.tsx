import React, { useState, useMemo } from 'react'
import { useInventory } from '@/hooks/useInventory'
import { InventoryHistory } from '@/components/InventoryHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategorySummary } from '@/components/CategorySummary'
import { ProjectSummary } from '@/components/ProjectSummary'
import { ProjectDetailedReport } from '@/components/ProjectDetailedReport'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { exportToExcel } from '@/lib/exportUtils'
import { toast } from 'sonner'

export default function ReportsPage() {
  const { items, history } = useInventory()
  const [selectedProject, setSelectedProject] = useState<string>('all')
  
  // Get unique projects from inventory items
  const projects = useMemo(() => {
    const projectSet = new Set<string>()
    items.forEach(item => {
      if (item.project) {
        projectSet.add(item.project)
      }
    })
    return Array.from(projectSet).sort()
  }, [items])
  
  // Filter items by selected project
  const projectItems = useMemo(() => {
    if (selectedProject === 'all') return items
    return items.filter(item => item.project === selectedProject)
  }, [items, selectedProject])
  
  // Generate project report data
  const projectReportData = useMemo(() => {
    // Group by supplier and item name
    const supplierGroups: Record<string, any> = {}
    
    projectItems.forEach(item => {
      const supplier = item.supplier || 'Unknown Supplier'
      if (!supplierGroups[supplier]) {
        supplierGroups[supplier] = {}
      }
      
      const itemKey = `${item.name} (${item.unit})`
      if (!supplierGroups[supplier][itemKey]) {
        supplierGroups[supplier][itemKey] = {
          name: item.name,
          unit: item.unit,
          quantity: 0,
          costPerUnit: item.costPerUnit,
          totalCost: 0,
          items: []
        }
      }
      
      supplierGroups[supplier][itemKey].quantity += item.quantity
      supplierGroups[supplier][itemKey].totalCost += 
        item.costPerUnit !== undefined ? item.quantity * item.costPerUnit : 0
      supplierGroups[supplier][itemKey].items.push(item)
    })
    
    return supplierGroups
  }, [projectItems])
  
  const handleExportProjectReport = () => {
    const reportData: any[] = []
    
    // Flatten the nested structure for export
    Object.entries(projectReportData).forEach(([supplier, items]) => {
      Object.entries(items as Record<string, any>).forEach(([itemKey, data]: [string, any]) => {
        reportData.push({
          'Project': selectedProject === 'all' ? 'All Projects' : selectedProject,
          'Supplier': supplier,
          'Item': data.name,
          'Unit': data.unit,
          'Quantity': data.quantity,
          'Cost Per Unit': data.costPerUnit !== undefined ? `$${data.costPerUnit.toFixed(2)}` : 'N/A',
          'Total Cost': data.totalCost > 0 ? `$${data.totalCost.toFixed(2)}` : 'N/A'
        })
      })
    })
    
    if (reportData.length === 0) {
      toast.warning('No data to export')
      return
    }
    
    const projectName = selectedProject === 'all' ? 'All_Projects' : selectedProject.replace(/\s+/g, '_')
    exportToExcel(reportData, `Project_Report_${projectName}`, 'Project Report')
    toast.success('Project report exported successfully')
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Project Reports</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="projectSummary">Project Summary</TabsTrigger>
          <TabsTrigger value="history">Inventory History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Project Detailed Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Project:</span>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project} value={project}>{project}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" size="sm" onClick={handleExportProjectReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
              
              <ProjectDetailedReport 
                projectName={selectedProject === 'all' ? 'All Projects' : selectedProject}
                reportData={projectReportData}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Category Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CategorySummary items={items} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projectSummary" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Project Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectSummary items={items} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Inventory History</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryHistory history={history} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}