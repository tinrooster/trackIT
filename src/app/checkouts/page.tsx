import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ItemCheckInOut } from '@/components/cabinets/ItemCheckInOut';
import { CheckoutHistory } from '@/components/cabinets/CheckoutHistory';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { logAction } from '@/lib/logging';

// Mock items data - replace with actual data fetching
const mockItems = [
  { id: 'ITEM-001', name: 'Test Equipment A' },
  { id: 'ITEM-002', name: 'Test Equipment B' },
];

export default function CheckoutsPage() {
  const handleCheckIn = async (values: { itemId: string, quantity: number }) => {
    try {
      // Implement check-in logic here
      await logAction({
        action: 'check-in',
        details: {
          itemId: values.itemId,
          quantity: values.quantity,
        },
        status: 'success',
      });
    } catch (error) {
      await logAction({
        action: 'check-in',
        details: {
          itemId: values.itemId,
          quantity: values.quantity,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        status: 'error',
      });
    }
  };

  const handleCheckOut = async (values: { itemId: string, quantity: number }) => {
    try {
      // Implement check-out logic here
      await logAction({
        action: 'check-out',
        details: {
          itemId: values.itemId,
          quantity: values.quantity,
        },
        status: 'success',
      });
    } catch (error) {
      await logAction({
        action: 'check-out',
        details: {
          itemId: values.itemId,
          quantity: values.quantity,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        status: 'error',
      });
    }
  };

  const handleSubmit = (values: { itemId: string, quantity: number, action: 'check-in' | 'check-out' }) => {
    if (values.action === 'check-in') {
      handleCheckIn(values);
    } else {
      handleCheckOut(values);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Checkouts</h1>
        <p className="text-muted-foreground">Manage item check-ins and check-outs across all cabinets</p>
      </div>

      <div className="grid gap-6">
        {/* Quick Actions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Quickly check items in or out of any cabinet</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemCheckInOut
              items={mockItems}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        {/* Activity History Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>View and manage all check-in/out activity</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search activity..." className="pl-8" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Activity</TabsTrigger>
                <TabsTrigger value="checked-out">Checked Out</TabsTrigger>
                <TabsTrigger value="checked-in">Checked In</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <CheckoutHistory
                  cabinetId="all"
                  records={[
                    {
                      id: '1',
                      itemId: 'ITEM-001',
                      itemName: 'Test Equipment A',
                      quantity: 1,
                      timestamp: new Date().toISOString(),
                      userId: 'user1',
                      userName: 'John Doe',
                      type: 'check-out'
                    },
                    {
                      id: '2',
                      itemId: 'ITEM-002',
                      itemName: 'Test Equipment B',
                      quantity: 2,
                      timestamp: new Date(Date.now() - 86400000).toISOString(),
                      userId: 'user2',
                      userName: 'Jane Smith',
                      type: 'check-in'
                    }
                  ]}
                />
              </TabsContent>

              <TabsContent value="checked-out">
                <CheckoutHistory
                  cabinetId="all"
                  records={[
                    {
                      id: '1',
                      itemId: 'ITEM-001',
                      itemName: 'Test Equipment A',
                      quantity: 1,
                      timestamp: new Date().toISOString(),
                      userId: 'user1',
                      userName: 'John Doe',
                      type: 'check-out'
                    }
                  ]}
                />
              </TabsContent>

              <TabsContent value="checked-in">
                <CheckoutHistory
                  cabinetId="all"
                  records={[
                    {
                      id: '2',
                      itemId: 'ITEM-002',
                      itemName: 'Test Equipment B',
                      quantity: 2,
                      timestamp: new Date(Date.now() - 86400000).toISOString(),
                      userId: 'user2',
                      userName: 'Jane Smith',
                      type: 'check-in'
                    }
                  ]}
                />
              </TabsContent>

              <TabsContent value="overdue">
                <p className="text-muted-foreground text-center py-4">No overdue items</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Cabinet Status Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cabinet Status</CardTitle>
            <CardDescription>Current status of secure and tracked cabinets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">E1 Engineering</h3>
                      <p className="text-sm text-muted-foreground">3 items checked out</p>
                    </div>
                    <div className="text-yellow-600 text-sm">Secure</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">E2 Audio</h3>
                      <p className="text-sm text-muted-foreground">No items checked out</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 