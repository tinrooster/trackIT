import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, LogIn, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { UserWithPassword } from '@/contexts/AuthContext';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().default(false),
});

const resetPasswordSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  securityAnswer: z.string().min(1, 'Security answer is required'),
  newPassword: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function LoginForm() {
  const { login, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      remember: false,
    },
  });

  const { register: registerReset, handleSubmit: handleResetSubmit, formState: { errors: resetErrors }, watch } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      username: '',
      securityAnswer: '',
      newPassword: '',
    },
  });

  const [securityQuestion, setSecurityQuestion] = useState<string>('');
  const username = watch('username');

  // Fetch security question when username changes
  useEffect(() => {
    const fetchSecurityQuestion = async () => {
      if (!username) {
        setSecurityQuestion('');
        return;
      }

      const storedUsers = localStorage.getItem('inventory-users');
      if (!storedUsers) return;

      const users: UserWithPassword[] = JSON.parse(storedUsers);
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      setSecurityQuestion(user?.securityQuestion || '');
    };

    fetchSecurityQuestion();
  }, [username]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password, data.remember);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordValues) => {
    setIsResetting(true);
    try {
      const success = await resetPassword(data.username, data.securityAnswer, data.newPassword);
      if (success) {
        setShowResetDialog(false);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            {...register('username')}
            disabled={isLoading}
          />
          {errors.username && (
            <p className="text-sm font-medium text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" {...register('remember')} disabled={isLoading} />
            <Label htmlFor="remember" className="text-sm">Remember me</Label>
          </div>
          <Button
            type="button"
            variant="link"
            className="text-sm"
            onClick={() => setShowResetDialog(true)}
            disabled={isLoading}
          >
            Forgot password?
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </>
          )}
        </Button>
      </form>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your username and security answer to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-username">Username</Label>
              <Input
                id="reset-username"
                type="text"
                placeholder="Enter your username"
                {...registerReset('username')}
                disabled={isResetting}
              />
              {resetErrors.username && (
                <p className="text-sm font-medium text-destructive">{resetErrors.username.message}</p>
              )}
            </div>

            {securityQuestion && (
              <div className="space-y-2">
                <Label>Security Question</Label>
                <p className="text-sm text-muted-foreground">{securityQuestion}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="security-answer">Security Answer</Label>
              <Input
                id="security-answer"
                type="text"
                placeholder="Enter your security answer"
                {...registerReset('securityAnswer')}
                disabled={isResetting}
              />
              {resetErrors.securityAnswer && (
                <p className="text-sm font-medium text-destructive">{resetErrors.securityAnswer.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (minimum 4 characters)"
                {...registerReset('newPassword')}
                disabled={isResetting}
              />
              {resetErrors.newPassword && (
                <p className="text-sm font-medium text-destructive">{resetErrors.newPassword.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}