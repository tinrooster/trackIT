import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { InventoryItem } from '@/types/inventory';
import { Plus, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function DashboardPage() {
  const navigate = useNavigate();
  const [items, setItems] = useLocalStorage<InventoryItem[]>('inventoryItems', []);
  const [activeView, setActiveView] = useState<'project' | 'location'>('project');
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Add storage event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inventoryItems') {
        const newItems = e.newValue ? JSON.parse(e.newValue) : [];
        setItems(newItems);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setItems]);

  // Add periodic refresh
  useEffect(() => {
    const checkStorage = () => {
      const storedItems = localStorage.getItem('inventoryItems');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        if (JSON.stringify(parsedItems) !== JSON.stringify(items)) {
          setItems(parsedItems);
        }
      }
    };

    const interval = setInterval(checkStorage, 1000);
    return () => clearInterval(interval);
  }, [items, setItems]);

  // Get project statistics
  const projectStats = useMemo(() => {
    const stats = items.reduce((acc, item) => {
      const project = item.project || 'Unassigned';
      if (!acc[project]) {
        acc[project] = { count: 0, items: [], totalValue: 0 };
      }
      acc[project].count += 1;
      acc[project].items.push(item);
      acc[project].totalValue += (item.quantity || 0) * (item.costPerUnit || 0);
      return acc;
    }, {} as Record<string, { count: number; items: InventoryItem[]; totalValue: number }>);

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        value: data.count,
        items: data.items,
        percentage: (data.count / items.length * 100).toFixed(1),
        totalValue: data.totalValue.toFixed(2),
        totalQuantity: data.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  // Get location statistics
  const locationStats = useMemo(() => {
    const stats = items.reduce((acc, item) => {
      const location = item.location || 'Unspecified';
      if (!acc[location]) {
        acc[location] = { count: 0, items: [], totalValue: 0 };
      }
      acc[location].count += 1;
      acc[location].items.push(item);
      acc[location].totalValue += (item.quantity || 0) * (item.costPerUnit || 0);
      return acc;
    }, {} as Record<string, { count: number; items: InventoryItem[]; totalValue: number }>);

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        value: data.count,
        items: data.items,
        percentage: (data.count / items.length * 100).toFixed(1),
        totalValue: data.totalValue.toFixed(2),
        totalQuantity: data.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const activeStats = activeView === 'project' ? projectStats : locationStats;
  const colors = [
    '#3B82F6', // 2024:NAB - bright blue
    '#10B981', // REMOTE_KIT_BUILD - emerald green
    '#F59E0B', // STUDIO_UPGRADE - amber
    '#F97316', // INFRASTRUCTURE - orange
    '#A78BFA', // Unassigned - purple
    '#84CC16', // 2025:SUTRO - lime green
    '#FCD34D'  // MAINTENANCE - yellow
  ];

  const getTooltipContent = (stat: any) => {
    return `${stat.name}\n${stat.value} items\nTotal Quantity: ${stat.totalQuantity}\nTotal Value: $${stat.totalValue}`;
  };

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
            <CardTitle>Welcome to TEd_trackIT</CardTitle>
            <CardDescription>Get started by adding your first inventory items</CardDescription>
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

            <TabsContent value="project" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Items by Project</CardTitle>
                  <CardDescription>Distribution of inventory items across projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-12">
                    <div className="w-[300px] h-[300px] relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {activeStats.map((stat, index) => {
                            const startAngle = activeStats
                              .slice(0, index)
                              .reduce((sum, s) => sum + (Number(s.value) / items.length) * 360, 0);
                            const endAngle = startAngle + (stat.value / items.length) * 360;
                            const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                            const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                            const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                            const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                            const largeArc = endAngle - startAngle > 180 ? 1 : 0;

                            // Calculate position for the text
                            const midAngle = (startAngle + endAngle) / 2;
                            const textX = 50 + 30 * Math.cos((midAngle - 90) * Math.PI / 180);
                            const textY = 50 + 30 * Math.sin((midAngle - 90) * Math.PI / 180);

                            return (
                              <g key={stat.name}>
                                <title>{getTooltipContent(stat)}</title>
                                <path
                                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={colors[index % colors.length]}
                                  className="cursor-pointer hover:opacity-90 transition-opacity"
                                  onMouseEnter={() => setActiveSegment(stat.name)}
                                  onMouseLeave={() => setActiveSegment(null)}
                                  onClick={() => navigate(`/inventory?${activeView}=${encodeURIComponent(stat.name)}`)}
                                  opacity="0"
                                >
                                  <animate
                                    attributeName="opacity"
                                    from="0"
                                    to="1"
                                    dur="0.3s"
                                    begin={`${index * 0.1}s`}
                                    fill="freeze"
                                    calcMode="spline"
                                    keySplines="0.4 0 0.2 1"
                                  />
                                </path>
                                <text
                                  x={textX}
                                  y={textY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="white"
                                  fontSize="4"
                                  className="select-none pointer-events-none font-medium"
                                  opacity="0"
                                >
                                  {stat.value}
                                  <animate
                                    attributeName="opacity"
                                    from="0"
                                    to="1"
                                    dur="0.3s"
                                    begin={`${index * 0.1 + 0.15}s`}
                                    fill="freeze"
                                    calcMode="spline"
                                    keySplines="0.4 0 0.2 1"
                                  />
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex gap-16">
                        <div className="flex-1">
                          {activeStats.slice(0, Math.ceil(activeStats.length / 2)).map((stat, index) => (
                            <div
                              key={stat.name}
                              className={`flex items-center gap-3 mb-4 cursor-pointer ${
                                activeSegment === stat.name ? 'opacity-100' : 'opacity-80'
                              }`}
                              onClick={() => navigate(`/inventory?${activeView}=${encodeURIComponent(stat.name)}`)}
                              onMouseEnter={() => setActiveSegment(stat.name)}
                              onMouseLeave={() => setActiveSegment(null)}
                            >
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span 
                                    className="font-medium truncate"
                                    style={{ color: colors[index % colors.length] }}
                                  >
                                    {stat.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {stat.value} items
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex-1">
                          {activeStats.slice(Math.ceil(activeStats.length / 2)).map((stat, index) => (
                            <div
                              key={stat.name}
                              className={`flex items-center gap-3 mb-4 cursor-pointer ${
                                activeSegment === stat.name ? 'opacity-100' : 'opacity-80'
                              }`}
                              onClick={() => navigate(`/inventory?${activeView}=${encodeURIComponent(stat.name)}`)}
                              onMouseEnter={() => setActiveSegment(stat.name)}
                              onMouseLeave={() => setActiveSegment(null)}
                            >
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: colors[(index + Math.ceil(activeStats.length / 2)) % colors.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span 
                                    className="font-medium truncate"
                                    style={{ color: colors[(index + Math.ceil(activeStats.length / 2)) % colors.length] }}
                                  >
                                    {stat.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {stat.value} items
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Items by Location</CardTitle>
                  <CardDescription>Distribution of inventory items across locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-12">
                    <div className="w-[300px] h-[300px] relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {activeStats.map((stat, index) => {
                            const startAngle = activeStats
                              .slice(0, index)
                              .reduce((sum, s) => sum + (Number(s.value) / items.length) * 360, 0);
                            const endAngle = startAngle + (stat.value / items.length) * 360;
                            const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                            const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                            const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                            const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                            const largeArc = endAngle - startAngle > 180 ? 1 : 0;

                            // Calculate position for the text
                            const midAngle = (startAngle + endAngle) / 2;
                            const textX = 50 + 30 * Math.cos((midAngle - 90) * Math.PI / 180);
                            const textY = 50 + 30 * Math.sin((midAngle - 90) * Math.PI / 180);

                            return (
                              <g key={stat.name}>
                                <title>{getTooltipContent(stat)}</title>
                                <path
                                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={colors[index % colors.length]}
                                  className="cursor-pointer hover:opacity-90 transition-opacity"
                                  onMouseEnter={() => setActiveSegment(stat.name)}
                                  onMouseLeave={() => setActiveSegment(null)}
                                  onClick={() => navigate(`/inventory?${activeView}=${encodeURIComponent(stat.name)}`)}
                                  opacity="0"
                                >
                                  <animate
                                    attributeName="opacity"
                                    from="0"
                                    to="1"
                                    dur="0.3s"
                                    begin={`${index * 0.1}s`}
                                    fill="freeze"
                                    calcMode="spline"
                                    keySplines="0.4 0 0.2 1"
                                  />
                                </path>
                                <text
                                  x={textX}
                                  y={textY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="white"
                                  fontSize="4"
                                  className="select-none pointer-events-none font-medium"
                                  opacity="0"
                                >
                                  {stat.value}
                                  <animate
                                    attributeName="opacity"
                                    from="0"
                                    to="1"
                                    dur="0.3s"
                                    begin={`${index * 0.1 + 0.15}s`}
                                    fill="freeze"
                                    calcMode="spline"
                                    keySplines="0.4 0 0.2 1"
                                  />
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex gap-16">
                        <div className="flex-1">
                          {activeStats.slice(0, Math.ceil(activeStats.length / 2)).map((stat, index) => (
                            <div
                              key={stat.name}
                              className={`flex items-center gap-3 mb-4 cursor-pointer ${
                                activeSegment === stat.name ? 'opacity-100' : 'opacity-80'
                              }`}
                              onClick={() => navigate(`/inventory?${activeView}=${encodeURIComponent(stat.name)}`)}
                              onMouseEnter={() => setActiveSegment(stat.name)}
                              onMouseLeave={() => setActiveSegment(null)}
                            >
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span 
                                    className="font-medium truncate"
                                    style={{ color: colors[index % colors.length] }}
                                  >
                                    {stat.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {stat.value} items
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex-1">
                          {activeStats.slice(Math.ceil(activeStats.length / 2)).map((stat, index) => (
                            <div
                              key={stat.name}
                              className={`flex items-center gap-3 mb-4 cursor-pointer ${
                                activeSegment === stat.name ? 'opacity-100' : 'opacity-80'
                              }`}
                              onClick={() => navigate(`/inventory?${activeView}=${encodeURIComponent(stat.name)}`)}
                              onMouseEnter={() => setActiveSegment(stat.name)}
                              onMouseLeave={() => setActiveSegment(null)}
                            >
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: colors[(index + Math.ceil(activeStats.length / 2)) % colors.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span 
                                    className="font-medium truncate"
                                    style={{ color: colors[(index + Math.ceil(activeStats.length / 2)) % colors.length] }}
                                  >
                                    {stat.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {stat.value} items
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Quick Filters</CardTitle>
              <CardDescription>Jump to filtered inventory views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/inventory')}>
                  <Filter className="h-4 w-4" />
                  All Items
                </Button>
                {activeStats.slice(0, 5).map((stat, index) => (
                  <Button
                    key={stat.name}
                    variant="outline"
                    className="flex items-center gap-2 relative pl-6"
                    onClick={() => navigate(`/inventory?${activeView}=${encodeURIComponent(stat.name)}`)}
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-2 rounded-l-md"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    {stat.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}