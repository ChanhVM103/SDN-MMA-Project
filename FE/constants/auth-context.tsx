import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: string;
    authProvider: string;
    address?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (user: User, token: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
    updateUser: async () => { },
});

const AUTH_STORAGE_KEY = '@foodiehub_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load stored auth on app start
    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) {
                const { user: storedUser, token: storedToken } = JSON.parse(stored);
                setUser(storedUser);
                setToken(storedToken);
            }
        } catch (error) {
            console.error('Failed to load auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData: User, authToken: string) => {
        try {
            await AsyncStorage.setItem(
                AUTH_STORAGE_KEY,
                JSON.stringify({ user: userData, token: authToken })
            );
            setUser(userData);
            setToken(authToken);
        } catch (error) {
            console.error('Failed to save auth:', error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
            setToken(null);
        } catch (error) {
            console.error('Failed to clear auth:', error);
        }
    };

    const updateUser = async (updatedUser: User) => {
        try {
            await AsyncStorage.setItem(
                AUTH_STORAGE_KEY,
                JSON.stringify({ user: updatedUser, token })
            );
            setUser(updatedUser);
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
