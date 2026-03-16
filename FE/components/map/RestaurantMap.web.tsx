import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface RestaurantMapProps {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
}

export default function RestaurantMap({ latitude, longitude, name, address }: RestaurantMapProps) {
    // Tọa độ mặc định (TP.HCM) nếu quán chưa được cài đặt vị trí
    const displayLat = latitude || 10.762622;
    const displayLng = longitude || 106.660172;

    // Sử dụng Google Maps embed (không cần API key cho dạng search)
    const mapUrl = `https://maps.google.com/maps?q=${displayLat},${displayLng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Vị trí cửa hàng (Web View)</Text>
            <View style={styles.mapContainer}>
                <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={mapUrl}
                    style={{ border: 0 }}
                />
            </View>
            <Text style={styles.addressText}>{address}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
        paddingHorizontal: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222',
        marginBottom: 10,
    },
    mapContainer: {
        height: 250,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    addressText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});
