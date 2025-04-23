import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/types/inventory';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [items] = useLocalStorage<InventoryItem[]>('inventoryItems', []);
  const [activeView, setActiveView] = useState<'project' | 'location'>('project');

  // Project data for pie chart
  const projectData = useMemo(() => {
    const projects: Record<string, { count: number; items: InventoryItem[] }> = {};
    
    items.forEach(item => {
      const project = item.project || 'Unassigned';
      if (!projects[project]) {
        projects[project] = { count: 0, items: [] };
      }
      
      projects[project].count += 1;
      projects[project].items.push(item);
    });
    
    return Object.entries(projects)
      .map(([name, data]) => ({
        name,
        value: data.count,
        items: data.items
      }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  // Location data for pie chart
  const locationData = useMemo(() => {
    const locations: Record<string, { count: number; items: InventoryItem[] }> = {};
    
    items.forEach(item => {
      const location = item.location || 'Unspecified';
      if (!locations[location]) {
        locations[location] = { count: 0, items: [] };
      }
      
      locations[location].count += 1;
      locations[location].items.push(item);
    });
    
    return Object.entries(locations)
      .map(([name, data]) => ({
        name,
        value: data.count,
        items: data.items
      }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  // Colors for pie chart
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
    '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1',
    '#a4de6c', '#d0ed57', '#83a6ed', '#8884d8',
    '#f5222d', '#fa8c16', '#faad14', '#fadb14',
    '#a0d911', '#52c41a', '#13c2c2', '#1890ff'
  ];

  const handleItemClick = (data: { name: string }) => {
    if (activeView === 'project') {
      navigate(`/inventory?project=${encodeURIComponent(data.name)}`);
    } else {
      navigate(`/inventory?location=${encodeURIComponent(data.name)}`);
    }
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const activeData = activeView === 'project' ? projectData : locationData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate('/inventory')}>
          <Plus className="mr-2 h-4 w-4" />
          Manage Inventory
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to TEd_Inventory Track</CardTitle>
            <CardDescription>
              Get started by adding your first inventory items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Your inventory is currently empty. Start by adding some items to track.</p>
            <Button onClick={() => navigate('/inventory')}>
              <Plus className="mr-2 h-4 w-4" />
              Go to Inventory
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'project' | 'location')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">By Project</TabsTrigger>
              <TabsTrigger value="location">By Location</TabsTrigger>
            </TabsList>
            
            <TabsContent value="project">
              <Card>
                <CardHeader>
                  <CardTitle>Items by Project</CardTitle>
                  <CardDescription>
                    Distribution of inventory items across projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex flex-col md:flex-row">
                    <div className="w-full md:w-2/3 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={projectData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            onClick={handleItemClick}
                            isAnimationActive={true}
                          >
                            {projectData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                style={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value} items`, 'Count']}
                            labelFormatter={(name) => `Project: ${name}`}
                          />
                          <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            onClick={handleItemClick}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/3 h-full overflow-auto mt-4 md:mt-0">
                      <h3 className="text-sm font-medium mb-2">Project Details</h3>
                      <div className="space-y-2">
                        {projectData.map((project, index) => (
                          <div 
                            key={project.name}
                            className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                            onClick={() => handleItemClick(project)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 truncate">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.value} items</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>Items by Location</CardTitle>
                  <CardDescription>
                    Distribution of inventory items across locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex flex-col md:flex-row">
                    <div className="w-full md:w-2/3 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={locationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            onClick={handleItemClick}
                            isAnimationActive={true}
                          >
                            {locationData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                style={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value} items`, 'Count']}
                            labelFormatter={(name) => `Location: ${name}`}
                          />
                          <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            onClick={handleItemClick}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/3 h-full overflow-auto mt-4 md:mt-0">
                      <h3 className="text-sm font-medium mb-2">Location Details</h3>
                      <div className="space-y-2">
                        {locationData.map((location, index) => (
                          <div 
                            key={location.name}
                            className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                            onClick={() => handleItemClick(location)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 truncate">{location.name}</div>
                            <div className="text-sm text-muted-foreground">{location.value} items</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Filters</CardTitle>
                <CardDescription>
                  Jump to filtered inventory views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/inventory')}
                    className="flex items-center"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    All Items
                  </Button>
                  
                  {activeView === 'project' && projectData.slice(0, 5).map(project => (
                    <Button 
                      key={project.name}
                      variant="outline" 
                      onClick={() => navigate(`/inventory?project=${encodeURIComponent(project.name)}`)}
                    >
                      {project.name}
                    </Button>
                  ))}
                  
                  {activeView === 'location' && locationData.slice(0, 5).map(location => (
                    <Button 
                      key={location.name}
                      variant="outline" 
                      onClick={() => navigate(`/inventory?location=${encodeURIComponent(location.name)}`)}
                    >
                      {location.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}