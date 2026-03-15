import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Box, TextField, List, ListItem, ListItemText, Paper, CircularProgress, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

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

const LocationPicker = ({ lat, lng, onLocationChange }) => {
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState(lat && lng ? [lat, lng] : [10.762622, 106.660172]); // Default to HCM city

    useEffect(() => {
        if (lat && lng) {
            setPosition([lat, lng]);
        }
    }, [lat, lng]);

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                onLocationChange(lat, lng);
                reverseGeocode(lat, lng);
            },
        });

        return position ? <Marker position={position} /> : null;
    };

    const ChangeView = ({ center }) => {
        const map = useMap();
        useEffect(() => {
            map.setView(center, map.getZoom());
        }, [center]);
        return null;
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await resp.json();
            if (data && data.display_name) {
                onLocationChange(lat, lng, data.display_name);
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    };

    const handleSearch = async (val) => {
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

    const selectSuggestion = (s) => {
        const lat = parseFloat(s.lat);
        const lng = parseFloat(s.lon);
        setPosition([lat, lng]);
        onLocationChange(lat, lng, s.display_name);
        setSuggestions([]);
        setSearch(s.display_name);
    };

    return (
        <Box sx={{ width: "100%", height: "400px", position: "relative" }}>
            <Box sx={{ position: "absolute", top: 10, left: 10, right: 10, zIndex: 1000 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Tìm kiếm địa chỉ..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoComplete="off"
                    sx={{ bgcolor: "white", borderRadius: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: loading && <CircularProgress size={20} />,
                    }}
                />
                {suggestions.length > 0 && (
                    <Paper sx={{ mt: 1, maxHeight: 200, overflow: "auto" }}>
                        <List size="small">
                            {suggestions.map((s) => (
                                <ListItem key={s.place_id} component="button" onClick={() => selectSuggestion(s)} sx={{ textAlign: "left", width: "100%", border: "none", bgcolor: "transparent", cursor: "pointer", "&:hover": { bgcolor: "#f5f5f5" } }}>
                                    <ListItemText primary={s.display_name} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>

            <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "8px" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker />
                <ChangeView center={position} />
            </MapContainer>
        </Box>
    );
};

export default LocationPicker;
