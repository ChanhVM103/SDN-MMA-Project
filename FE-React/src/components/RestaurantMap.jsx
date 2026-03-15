import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Box, Typography, Paper } from "@mui/material";

// Fix for default marker icon in Leaflet + Webpack/Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const RestaurantMap = ({ lat, lng, restaurantName, address }) => {
    if (!lat || !lng) return null;

    const position = [lat, lng];

    return (
        <Paper elevation={0} sx={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #f9fafb" }}>
                <Typography variant="subtitle1" fontWeight={800} color="#1a1a1a" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    📍 Vị trí cửa hàng
                </Typography>
            </Box>
            <Box sx={{ height: "300px", width: "100%" }}>
                <MapContainer center={position} zoom={16} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>
                            <strong>{restaurantName}</strong> <br /> {address}
                        </Popup>
                    </Marker>
                </MapContainer>
            </Box>
            <Box sx={{ p: 2, bgcolor: "#f9fafb" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
                    Địa chỉ:
                </Typography>
                <Typography variant="body2" color="#4b5563" sx={{ fontSize: 13, lineHeight: 1.5 }}>
                    {address}
                </Typography>
            </Box>
        </Paper>
    );
};

export default RestaurantMap;
