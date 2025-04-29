import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from 'sonner';
import type { User } from '@/contexts/AuthContext';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: Omit<User, 'id'>) => void;
}

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
];

export default function AddUserDialog({ open, onOpenChange, onAdd }: AddUserDialogProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [phoneExtension, setPhoneExtension] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!username.trim() || !displayName.trim() || !password.trim() || !securityQuestion.trim() || !securityAnswer.trim() || !phoneExtension.trim()) {
      toast.error('All fields are required.');
      return;
    }
    setIsSubmitting(true);
    onAdd({
      username: username.trim(),
      displayName: displayName.trim(),
      password: password.trim(),
      role: role as 'admin' | 'user' | 'viewer',
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim(),
      phoneExtension: phoneExtension.trim(),
    });
    setIsSubmitting(false);
    setUsername('');
    setDisplayName('');
    setPassword('');
    setRole('user');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setPhoneExtension('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Fill in all fields to add a new user. Phone extension can be used for password reset.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" autoComplete="off" value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
          </div>
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" autoComplete="off" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select id="role" value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded px-2 py-1">
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="securityQuestion">Security Question</Label>
            <Input id="securityQuestion" autoComplete="off" value={securityQuestion} onChange={e => setSecurityQuestion(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="securityAnswer">Security Answer</Label>
            <Input id="securityAnswer" autoComplete="off" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phoneExtension">Phone Extension (for password reset)</Label>
            <Input id="phoneExtension" autoComplete="off" value={phoneExtension} onChange={e => setPhoneExtension(e.target.value)} required />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 