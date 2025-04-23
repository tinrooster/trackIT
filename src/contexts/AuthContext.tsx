import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isPersistent: boolean;
  isLoading: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
  setPersistence: (isPersistent: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'inventory-user';
const PERSISTENCE_KEY = 'inventory-auth-persistent';

// Mock users for demo purposes
const MOCK_USERS: Record<string, { password: string, user: User }> = {
  'admin': {
    password: 'admin123',
    user: { id: '1', username: 'admin', displayName: 'Administrator', role: 'admin' }
  },
  'user': {
    password: 'user123',
    user: { id: '2', username: 'user', displayName: 'Regular User', role: 'user' }
  },
  'viewer': {
    password: 'viewer123',
    user: { id: '3', username: 'viewer', displayName: 'View Only', role: 'viewer' }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPersistent, setIsPersistent] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check credentials against mock users
      const userRecord = MOCK_USERS[username.toLowerCase()];
      
      if (!userRecord || userRecord.password !== password) {
        toast.error('Invalid username or password');
        return false;
      }

      // Set persistence preference
      setIsPersistent(remember);
      localStorage.setItem(PERSISTENCE_KEY, String(remember));

      // Store user in appropriate storage
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(userRecord.user));
      
      // Update state
      setUser(userRecord.user);
      toast.success(`Welcome, ${userRecord.user.displayName}`);
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

  const value = {
    user,
    isAuthenticated: !!user,
    isPersistent,
    isLoading,
    login,
    logout,
    setPersistence
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};