import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth-context';
import { userAPI } from './api';

interface FavoritesContextType {
    favorites: string[];
    toggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
    refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    toggleFavorite: () => { },
    isFavorite: () => false,
    refreshFavorites: async () => { },
});

const FAVORITES_KEY = '@foodiehub_favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        if (user && token) {
            refreshFavorites();
        } else {
            loadLocalFavorites();
        }
    }, [user, token]);

    const loadLocalFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem(FAVORITES_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load favorites:', error);
        }
    };

    const refreshFavorites = async () => {
        if (!token) return;
        try {
            const res = await userAPI.getFavorites(token);
            if (res.success && Array.isArray(res.data)) {
                const ids = res.data.map((r: any) => r._id || r.id);
                setFavorites(ids);
                await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
            }
        } catch (error) {
            console.error('Failed to refresh favorites from backend:', error);
            loadLocalFavorites();
        }
    };

    const toggleFavorite = async (id: string) => {
        // Optimistic update
        const isCurrentlyFavorited = favorites.includes(id);
        const newFavorites = isCurrentlyFavorited
            ? favorites.filter((fid) => fid !== id)
            : [...favorites, id];

        setFavorites(newFavorites);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));

        // Sync with backend if logged in
        if (token) {
            try {
                await userAPI.toggleFavorite(token, id);
            } catch (error) {
                console.error('Failed to sync favorite toggle with backend:', error);
            }
        }
    };

    const isFavorite = (id: string) => favorites.includes(id);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, refreshFavorites }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export const useFavorites = () => useContext(FavoritesContext);
