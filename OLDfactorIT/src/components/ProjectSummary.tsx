import React, { useMemo } from 'react'
import { InventoryItem } from '@/types/inventory'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'

interface ProjectSummaryProps {
  items: InventoryItem[]
}

export function ProjectSummary({ items }: ProjectSummaryProps) {
  const navigate = useNavigate()

  const projectData = useMemo(() => {
    // Group items by project
    const projectGroups: Record<string, InventoryItem[]> = {}

    items.forEach(item => {
      const project = item.project || 'Unassigned'
      if (!projectGroups[project]) {
        projectGroups[project] = []
      }
      projectGroups[project].push(item)
    })

    // Calculate total items, quantities, and costs per project
    return Object.entries(projectGroups).map(([project, projectItems]) => {
      const totalCost = projectItems.reduce((sum, item) => {
        return sum + (item.costPerUnit !== undefined ? item.quantity * item.costPerUnit : 0)
      }, 0)
      
      return {
        name: project,
        itemCount: projectItems.length,
        totalQuantity: projectItems.reduce((sum, item) => sum + item.quantity, 0),
        totalCost: totalCost,
        value: projectItems.length, // For the pie chart
      }
    })
    .sort((a, b) => b.itemCount - a.itemCount) // Sort by item count descending
  }, [items])

  // Generate colors for the pie chart - enhanced color palette
  const COLORS = [
    '#3498db', // Blue
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#e74c3c', // Red
    '#1abc9c', // Teal
    '#34495e', // Dark Blue
    '#d35400', // Dark Orange
    '#8e44ad', // Dark Purple
    '#16a085', // Dark Teal
    '#c0392b', // Dark Red
    '#27ae60'  // Dark Green
  ]

  const handleProjectClick = (project: string) => {
    navigate(`/inventory?project=${encodeURIComponent(project)}`)
  }

  return (
    <div className="space-y-6">
      {projectData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No project data available. Assign items to projects in the inventory.
        </div>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [`${value} items`, props.payload.name]}
                  labelFormatter={() => 'Project'}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Project Details</h3>
            <div className="grid gap-2">
              {projectData.map((project, index) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted cursor-pointer"
                  style={{ backgroundColor: `${COLORS[index % COLORS.length]}15` }}
                  onClick={() => handleProjectClick(project.name)}
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <span className="font-medium">{project.name}</span>
                      <div className="text-sm text-muted-foreground">
                        {project.itemCount} items ({project.totalQuantity} units)
                      </div>
                    </div>
                  </div>
                  {project.totalCost > 0 && (
                    <div className="text-sm font-medium">
                      {formatCurrency(project.totalCost)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}