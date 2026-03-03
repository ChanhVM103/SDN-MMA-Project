import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesContextType {
    favorites: string[];
    toggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    toggleFavorite: () => { },
    isFavorite: () => false,
});

const FAVORITES_KEY = '@foodiehub_favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem(FAVORITES_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load favorites:', error);
        }
    };

    const saveFavorites = async (newFavorites: string[]) => {
        try {
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    };

    const toggleFavorite = (id: string) => {
        setFavorites((prev) => {
            const newFavorites = prev.includes(id)
                ? prev.filter((fid) => fid !== id)
                : [...prev, id];
            saveFavorites(newFavorites);
            return newFavorites;
        });
    };

    const isFavorite = (id: string) => favorites.includes(id);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export const useFavorites = () => useContext(FavoritesContext);
