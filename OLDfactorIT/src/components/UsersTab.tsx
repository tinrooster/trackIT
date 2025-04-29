import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { STORAGE_KEYS } from "@/lib/storageService";

export function UsersTab() {
  const [users, setUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState("");

  useEffect(() => {
    const loadUsers = () => {
      try {
        const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
        }
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Failed to load users");
      }
    };
    
    loadUsers();
  }, []);

  const addUser = () => {
    if (!newUser.trim()) {
      toast.warning("Please enter a username");
      return;
    }
    
    if (users.includes(newUser.trim())) {
      toast.warning(`"${newUser}" already exists`);
      return;
    }
    
    const updatedUsers = [...users, newUser.trim()].sort();
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setNewUser("");
    toast.success(`Added "${newUser}"`);
  };

  const removeUser = (user: string) => {
    const updatedUsers = users.filter(u => u !== user);
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    toast.success(`Removed "${user}"`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="New username"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUser()}
          />
          <Button onClick={addUser}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No users defined yet
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user}>
                  <TableCell>{user}</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUser(user)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 