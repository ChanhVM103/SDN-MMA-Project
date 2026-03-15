import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationChange: (lat: number, lng: number, address?: string) => void;
}

export default function LocationPicker({ initialLat, initialLng, onLocationChange }: LocationPickerProps) {
    const [region, setRegion] = useState({
        latitude: initialLat || 10.762622,
        longitude: initialLng || 106.660172,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [markerPosition, setMarkerPosition] = useState({
        latitude: initialLat || 10.762622,
        longitude: initialLng || 106.660172,
    });
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialLat && initialLng) {
            const newPos = { latitude: parseFloat(initialLat.toString()), longitude: parseFloat(initialLng.toString()) };
            setMarkerPosition(newPos);
            setRegion({
                ...newPos,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    }, [initialLat, initialLng]);

    const handleMapPress = (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkerPosition({ latitude, longitude });
        onLocationChange(latitude, longitude);
        reverseGeocode(latitude, longitude);
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await resp.json();
            if (data && data.display_name) {
                onLocationChange(lat, lng, data.display_name);
                setSearch(data.display_name);
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    };

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
        const lat = parseFloat(s.lat);
        const lng = parseFloat(s.lon);
        const newPos = { latitude: lat, longitude: lng };
        setMarkerPosition(newPos);
        setRegion({
            ...newPos,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        onLocationChange(lat, lng, s.display_name);
        setSuggestions([]);
        setSearch(s.display_name);
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm địa chỉ..."
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

            <MapView
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                region={region}
                onPress={handleMapPress}
                onRegionChangeComplete={setRegion}
            >
                <Marker coordinate={markerPosition} draggable />
            </MapView>

            <Text style={styles.hint}>Chạm vào bản đồ để chọn vị trí chính xác</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 350,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    searchContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        zIndex: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 45,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    suggestionsList: {
        backgroundColor: '#fff',
        marginTop: 5,
        borderRadius: 8,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionText: {
        fontSize: 13,
        color: '#444',
    },
    hint: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontSize: 11,
    },
});
