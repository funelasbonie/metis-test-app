// src/contexts/AuthContext.tsx
import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import { User } from 'oidc-client-ts';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setIsLoading(true);
                await authService.initialize();

                const currentUser = await authService.getUser();
                setUser(currentUser);

                // Listen for message from .NET app
                window.addEventListener('message', handleMessage);

                // Notify .NET app if we completed authentication
                if (currentUser && window.opener) {
                    window.opener.postMessage({
                        type: 'SSO_COMPLETE',
                        timestamp: new Date().toISOString()
                    }, '*');
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Authentication failed');
                console.error('Auth initialization error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from our .NET app origin
            if (event.origin === 'https://localhost:5001') {
                if (event.data.type === 'SSO_INITIATED') {
                    console.log('SSO initiated from .NET app');
                }
            }
        };

        initializeAuth();

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const login = async () => {
        try {
            setError(null);
            await authService.login();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            throw err;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Logout failed');
            throw err;
        }
    };

    const getAccessToken = async (): Promise<string | null> => {
        return authService.getAccessToken();
    };

    const clearError = () => {
        setError(null);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        error,
        isAuthenticated: authService.isAuthenticated(),
        login,
        logout,
        getAccessToken,
        clearError,
    };

    return <AuthContext.Provider value={ value }> { children } </AuthContext.Provider>;
};