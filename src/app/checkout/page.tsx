import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemCheckInOut } from '@/components/cabinets/ItemCheckInOut';
import { CheckoutHistory } from '@/components/cabinets/CheckoutHistory';

export default function CheckoutPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Checkout Management</h1>
        <p className="text-muted-foreground">Manage item check-ins and check-outs across all cabinets</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Scan</CardTitle>
            <CardDescription>
              Quickly check items in or out by scanning their QR codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemCheckInOut
              cabinetId="all"
              cabinetName="All Cabinets"
              isSecure={false}
              onCheckIn={(itemId, quantity) => {
                console.log('Check in:', itemId, quantity);
                // Implement check-in logic
              }}
              onCheckOut={(itemId, quantity) => {
                console.log('Check out:', itemId, quantity);
                // Implement check-out logic
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              View and manage recent check-ins and check-outs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Activity</TabsTrigger>
                <TabsTrigger value="pending">Pending Returns</TabsTrigger>
                <TabsTrigger value="overdue">Overdue Items</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4">
                <CheckoutHistory
                  cabinetId="all"
                  records={[
                    // Add sample records or fetch from API
                  ]}
                />
              </TabsContent>
              <TabsContent value="pending">
                <p className="text-muted-foreground py-4">No pending returns</p>
              </TabsContent>
              <TabsContent value="overdue">
                <p className="text-muted-foreground py-4">No overdue items</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cabinet Status</CardTitle>
            <CardDescription>
              View current status and availability of secure cabinets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Add cabinet status cards here */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">E1 cab Engineering</h3>
                        <p className="text-sm text-muted-foreground">3 items checked out</p>
                      </div>
                      <div className="text-yellow-600 text-sm">Secure</div>
                    </div>
                  </CardContent>
                </Card>
                {/* Add more cabinet status cards */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 