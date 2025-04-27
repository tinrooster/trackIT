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
import { toast } from 'sonner';
import { DebugLogsButton } from '@/components/DebugLogsButton';
import { logger } from '@/utils/logger';

// Initialize logger with login context
logger.setContext('login');

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
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<LoginFormValues>({
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
    console.log('Form submitted with:', { username: data.username, remember: data.remember });
    logger.log(`Login attempt for user: ${data.username}`);
    setIsLoading(true);
    setLoginError(null);

    try {
      console.log('Attempting login...');
      const success = await login(data.username, data.password, data.remember);
      console.log('Login result:', success);
      logger.log(`Login ${success ? 'successful' : 'failed'} for user: ${data.username}`);

      if (!success) {
        console.log('Login failed, setting error state');
        setLoginError('Invalid username or password. Please try again.');
        toast.error('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      logger.error('Login error', error);
      setLoginError('An error occurred during login. Please try again.');
      toast.error('Login failed. Please try again.');
    } finally {
      console.log('Login attempt completed');
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordValues) => {
    logger.log(`Password reset attempt for user: ${data.username}`);
    setIsResetting(true);
    setResetError(null);
    try {
      const success = await resetPassword(data.username, data.securityAnswer, data.newPassword);
      if (success) {
        logger.log(`Password reset successful for user: ${data.username}`);
        setShowResetDialog(false);
        toast.success('Password has been reset successfully. Please log in with your new password.');
      } else {
        logger.log(`Password reset failed for user: ${data.username} - Incorrect security answer`);
        setResetError('Incorrect security answer. Please try again.');
        toast.error('Incorrect security answer');
      }
    } catch (error) {
      logger.error('Password reset error', error);
      setResetError('An error occurred while resetting password. Please try again.');
      toast.error('Password reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="relative min-h-[400px] p-6 bg-white rounded-lg shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {loginError && (
          <div className="p-4 mb-4 text-sm border rounded-md bg-destructive/10 text-destructive border-destructive flex items-center space-x-2">
            <div>
              <p className="font-medium">Login Failed</p>
              <p>{loginError}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            {...register('username')}
            disabled={isLoading}
            className={`h-10 ${loginError ? 'border-destructive' : ''}`}
          />
          {errors.username && (
            <p className="text-sm font-medium text-destructive mt-1">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register('password')}
            disabled={isLoading}
            className={`h-10 ${loginError ? 'border-destructive' : ''}`}
          />
          {errors.password && (
            <p className="text-sm font-medium text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" {...register('remember')} disabled={isLoading} />
            <Label htmlFor="remember" className="text-sm flex items-center">
              Remember me
              <span className="ml-1 text-xs text-muted-foreground">(Keeps you logged in on this device)</span>
            </Label>
          </div>
          <Button
            type="button"
            variant="link"
            className="text-sm"
            onClick={() => {
              setShowResetDialog(true);
              setResetError(null);
            }}
            disabled={isLoading}
          >
            Forgot password?
          </Button>
        </div>

        <Button 
          type="submit" 
          className="w-full h-10" 
          disabled={isLoading}
          variant={loginError ? "destructive" : "default"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              {loginError ? 'Try Again' : 'Log In'}
            </>
          )}
        </Button>
      </form>

      {/* Debug logs button */}
      <div className="absolute bottom-2 left-2">
        <DebugLogsButton 
          onDownload={() => {
            logger.log('Debug logs downloaded');
            logger.downloadLogs();
          }} 
          context="login"
        />
      </div>

      {/* Revision number */}
      <div className="absolute bottom-2 right-2 text-sm text-muted-foreground/80 font-mono">
        rev.005
      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your username and security answer to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
            {resetError && (
              <div className="p-4 text-sm border rounded-md bg-destructive/10 text-destructive border-destructive flex items-center space-x-2">
                <div className="w-1 h-full bg-destructive rounded-full" />
                <div>
                  <p className="font-medium">Reset Failed</p>
                  <p>{resetError}</p>
                </div>
              </div>
            )}
            
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
                className={resetError ? 'border-destructive' : ''}
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
    </div>
  );
}