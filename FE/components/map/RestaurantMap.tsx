import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

interface RestaurantMapProps {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
}

export default function RestaurantMap({ latitude, longitude, name, address }: RestaurantMapProps) {
    // Default to HCM City center if no coordinates
    const displayLat = latitude || 10.762622;
    const displayLng = longitude || 106.660172;

    const region = {
        latitude: parseFloat(displayLat.toString()),
        longitude: parseFloat(displayLng.toString()),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Vị trí cửa hàng</Text>
            <View style={styles.mapContainer}>
                <MapView
                    provider={PROVIDER_DEFAULT}
                    style={styles.map}
                    initialRegion={region}
                    scrollEnabled={false}
                    zoomEnabled={false}
                >
                    <Marker
                        coordinate={{
                            latitude: parseFloat(displayLat.toString()),
                            longitude: parseFloat(displayLng.toString()),
                        }}
                        title={name}
                        description={address}
                    />
                </MapView>
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
        height: 200,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    addressText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});
