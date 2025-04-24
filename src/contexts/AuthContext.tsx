import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { hashPassword, comparePasswords } from '../utils/passwordUtils';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user' | 'viewer';
  securityQuestion?: string;
  securityAnswer?: string;
  phoneExtension?: string;
  phoneNumber?: string;
}

export interface UserWithPassword extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isPersistent: boolean;
  isLoading: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
  setPersistence: (isPersistent: boolean) => void;
  resetPassword: (username: string, securityAnswer: string, newPassword: string) => Promise<boolean>;
  verifySecurityAnswer: (username: string, answer: string) => Promise<boolean>;
  adminResetPassword: (username: string, newPassword: string) => Promise<boolean>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'inventory-user';
const PERSISTENCE_KEY = 'inventory-auth-persistent';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPersistent, setIsPersistent] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        // Check if we have any users, if not create a default admin
        const storedUsers = localStorage.getItem('inventory-users');
        if (!storedUsers) {
          const defaultAdmin: UserWithPassword = {
            id: crypto.randomUUID(),
            username: 'admin',
            displayName: 'Administrator',
            role: 'admin',
            password: 'admin', // Default password
            securityQuestion: 'What is the default password?',
            securityAnswer: 'admin'
          };
          localStorage.setItem('inventory-users', JSON.stringify([defaultAdmin]));
          toast.info('Created default admin account (username: admin, password: admin)');
        }

        // Check if we have a persistent login setting
        const persistentSetting = localStorage.getItem(PERSISTENCE_KEY);
        const shouldPersist = persistentSetting === 'true';
        setIsPersistent(shouldPersist);

        // Try to get stored user
        const storedUser = shouldPersist 
          ? localStorage.getItem(USER_STORAGE_KEY) 
          : sessionStorage.getItem(USER_STORAGE_KEY);

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          console.log('Restored user session:', parsedUser.username);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clear potentially corrupted storage
        localStorage.removeItem(USER_STORAGE_KEY);
        sessionStorage.removeItem(USER_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = async (username: string, password: string, remember: boolean): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Get stored users from localStorage
      const storedUsers = localStorage.getItem('inventory-users');
      if (!storedUsers) {
        // Create default admin if no users exist
        const defaultAdmin: UserWithPassword = {
          id: crypto.randomUUID(),
          username: 'admin',
          displayName: 'Administrator',
          role: 'admin',
          password: 'admin',
          securityQuestion: 'What is the default password?',
          securityAnswer: 'admin'
        };
        localStorage.setItem('inventory-users', JSON.stringify([defaultAdmin]));
        toast.info('Created default admin account (username: admin, password: admin)');
        
        // Try login again with the same credentials
        return login(username, password, remember);
      }

      const users: UserWithPassword[] = JSON.parse(storedUsers);
      const userRecord = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!userRecord) {
        toast.error('Invalid username or password');
        return false;
      }

      // Compare passwords directly since we're not using real hashing in demo
      if (!comparePasswords(password, userRecord.password)) {
        toast.error('Invalid username or password');
        return false;
      }

      // Set persistence preference
      setIsPersistent(remember);
      localStorage.setItem(PERSISTENCE_KEY, String(remember));

      // Store user in appropriate storage (without password)
      const { password: _, ...userWithoutPassword } = userRecord;
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithoutPassword));
      
      // Update state
      setUser(userWithoutPassword);
      toast.success(`Welcome, ${userWithoutPassword.displayName}`);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear user from storage
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    
    // Clear state
    setUser(null);
    toast.info('You have been logged out');
  };

  const setPersistence = (value: boolean) => {
    setIsPersistent(value);
    localStorage.setItem(PERSISTENCE_KEY, String(value));
    
    // If changing to persistent and we have a user, save to localStorage
    if (value && user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      sessionStorage.removeItem(USER_STORAGE_KEY);
    } 
    // If changing to non-persistent and we have a user, save to sessionStorage
    else if (!value && user) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const verifySecurityAnswer = async (username: string, answer: string): Promise<boolean> => {
    try {
      const storedUsers = localStorage.getItem('inventory-users');
      if (!storedUsers) {
        toast.error('No users found in the system');
        return false;
      }

      const users: UserWithPassword[] = JSON.parse(storedUsers);
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!user) {
        toast.error('User not found');
        return false;
      }

      if (!user.securityAnswer) {
        toast.error('No security question set up for this user');
        return false;
      }

      return user.securityAnswer.toLowerCase() === answer.toLowerCase();
    } catch (error) {
      console.error('Security verification error:', error);
      return false;
    }
  };

  const resetPassword = async (username: string, securityAnswer: string, newPassword: string): Promise<boolean> => {
    try {
      const storedUsers = localStorage.getItem('inventory-users');
      if (!storedUsers) {
        toast.error('No users found in the system');
        return false;
      }

      const users: UserWithPassword[] = JSON.parse(storedUsers);
      const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (userIndex === -1) {
        toast.error('User not found');
        return false;
      }

      // Verify security answer
      if (users[userIndex].securityAnswer?.toLowerCase() !== securityAnswer.toLowerCase()) {
        toast.error('Security answer is incorrect');
        return false;
      }

      // Update the user's password
      users[userIndex].password = newPassword;
      localStorage.setItem('inventory-users', JSON.stringify(users));
      
      toast.success('Password reset successful');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to reset password');
      return false;
    }
  };

  const adminResetPassword = async (username: string, newPassword: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      toast.error("Only admin users can reset passwords");
      return false;
    }

    try {
      const storedUsers = localStorage.getItem('inventory-users');
      if (!storedUsers) {
        toast.error('No users found in the system');
        return false;
      }

      const users: UserWithPassword[] = JSON.parse(storedUsers);
      const userIndex = users.findIndex(u => u.username === username);

      if (userIndex === -1) {
        toast.error("User not found");
        return false;
      }

      // Update password
      const hashedPassword = await hashPassword(newPassword);
      users[userIndex] = {
        ...users[userIndex],
        password: hashedPassword
      };

      localStorage.setItem('inventory-users', JSON.stringify(users));
      toast.success(`Password reset for user ${username}`);
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error("Failed to reset password");
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isPersistent,
    isLoading,
    login,
    logout,
    setPersistence,
    resetPassword,
    verifySecurityAnswer,
    adminResetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}