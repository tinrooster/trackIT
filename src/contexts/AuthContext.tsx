import React, { createContext, useContext, useState, useEffect } from 'react';
import { comparePasswords } from '../utils/passwordUtils';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  username: string;
  displayName: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
  securityQuestion: string;
  securityAnswer: string;
  phoneExtension?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  resetPassword: (username: string, securityAnswer: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get the correct store object (for compatibility)
function getStore() {
  if (window.electron && window.electron.store) return window.electron.store;
  if (window.electronStore) return {
    get: async (key: string) => window.electronStore.getData(key),
    set: async (key: string, value: any) => window.electronStore.setData(key, value),
    delete: async (key: string) => window.electronStore.deleteData(key),
  };
  throw new Error('No Electron store found');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const store = getStore();
        let storedUsers = await store.get('users');
        if (!storedUsers) {
          // Create default admin account if no users exist
          const defaultAdmin: User = {
            id: crypto.randomUUID(),
            username: 'admin',
            displayName: 'Administrator',
            password: 'admin',
            role: 'admin',
            securityQuestion: 'What is the default password?',
            securityAnswer: 'admin',
          };
          await store.set('users', [defaultAdmin]);
          storedUsers = [defaultAdmin];
          toast.success('Default admin account created. Username: admin, Password: admin');
          logger.info('Created default admin account');
        }

        const rememberedUser = await store.get('rememberedUser');
        if (rememberedUser) {
          setCurrentUser(rememberedUser);
          logger.info('Restored remembered user session');
        }
      } catch (error) {
        logger.error('Error initializing auth: ' + String(error));
        toast.error('Error initializing authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    logger.info(`Login attempt for user: ${username}`);
    setLoading(true);
    try {
      const store = getStore();
      const users = await store.get('users') as User[];
      console.log('Retrieved users:', users);

      const userRecord = users.find(u => u.username === username);
      if (!userRecord) {
        logger.warn('Login failed: User not found');
        toast.error('Invalid username or password');
        return false;
      }

      const passwordMatch = await comparePasswords(password, userRecord.password);
      console.log('Password match result:', passwordMatch);

      if (passwordMatch) {
        setCurrentUser(userRecord);
        if (rememberMe) {
          await store.set('rememberedUser', userRecord);
          logger.info('User session remembered');
        }
        logger.info('Login successful');
        toast.success('Login successful');
        return true;
      } else {
        logger.warn('Login failed: Invalid password');
        toast.error('Invalid username or password');
        return false;
      }
    } catch (error) {
      logger.error('Login error: ' + String(error));
      toast.error('An error occurred during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const store = getStore();
    setCurrentUser(null);
    await store.delete('rememberedUser');
    logger.info('User logged out');
    toast.success('Logged out successfully');
  };

  const resetPassword = async (username: string, securityAnswer: string, newPassword: string): Promise<boolean> => {
    try {
      const store = getStore();
      const users = await store.get('users') as User[];
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        logger.warn('Password reset failed: User not found');
        toast.error('User not found');
        return false;
      }

      if (users[userIndex].securityAnswer !== securityAnswer) {
        logger.warn('Password reset failed: Incorrect security answer');
        toast.error('Incorrect security answer');
        return false;
      }

      users[userIndex].password = newPassword;
      await store.set('users', users);
      
      logger.info('Password reset successful');
      toast.success('Password reset successful');
      return true;
    } catch (error) {
      logger.error('Password reset error: ' + String(error));
      toast.error('An error occurred during password reset');
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}