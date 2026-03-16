import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationChange: (lat: number, lng: number, address?: string) => void;
}

export default function LocationPicker({ initialLat, initialLng, onLocationChange }: LocationPickerProps) {
    const [lat, setLat] = useState(initialLat || 10.762622);
    const [lng, setLng] = useState(initialLng || 106.660172);
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialLat && initialLng) {
            setLat(parseFloat(initialLat.toString()));
            setLng(parseFloat(initialLng.toString()));
        }
    }, [initialLat, initialLng]);

    const handleSearch = async (val: string) => {
        setSearch(val);
        if (val.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&countrycodes=vn&limit=5`);
            const data = await resp.json();
            setSuggestions(data);
        } catch (error) {
            console.error("Geocoding search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectSuggestion = (s: any) => {
        const newLat = parseFloat(s.lat);
        const newLng = parseFloat(s.lon);
        setLat(newLat);
        setLng(newLng);
        onLocationChange(newLat, newLng, s.display_name);
        setSuggestions([]);
        setSearch(s.display_name);
    };

    const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm địa chỉ (Bản Web)..."
                        value={search}
                        onChangeText={handleSearch}
                    />
                    {loading && <ActivityIndicator size="small" color="#ee4d2d" />}
                </View>

                {suggestions.length > 0 && (
                    <View style={styles.suggestionsList}>
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item) => item.place_id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => selectSuggestion(item)}
                                >
                                    <Text style={styles.suggestionText} numberOfLines={2}>
                                        {item.display_name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
            </View>

            <View style={styles.mapContainer}>
                <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={mapUrl}
                    style={{ border: 0 }}
                />
            </View>

            <View style={styles.coordInfo}>
                <Text style={styles.coordText}>Tọa độ: {lat.toFixed(6)}, {lng.toFixed(6)}</Text>
                <Text style={styles.hint}>Trên Web vui lòng dùng ô tìm kiếm để chọn vị trí</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 350,
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        position: 'relative',
    },
    mapContainer: {
        flex: 1,
        marginTop: 60,
    },
    searchContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        zIndex: 2000,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 45,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },
    suggestionsList: {
        backgroundColor: '#fff',
        marginTop: 5,
        borderRadius: 8,
        maxHeight: 180,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 5,
    },
    suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    suggestionText: { fontSize: 13, color: '#444' },
    coordInfo: {
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    coordText: { fontSize: 12, color: '#666', fontWeight: 'bold' },
    hint: { fontSize: 10, color: '#ee4d2d', marginTop: 2 },
});
