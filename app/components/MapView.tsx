import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapViewProps {
    latitude?: number;
    longitude?: number;
    markers?: Array<{
        id: string;
        latitude: number;
        longitude: number;
        title: string;
        status?: 'active' | 'pending' | 'completed';
    }>;
    height?: number;
    onMapReady?: () => void;
}

const MapView: React.FC<MapViewProps> = ({
    latitude = 37.7749,
    longitude = -122.4194,
    markers = [],
    height = 300,
    onMapReady
}) => {
    const webViewRef = useRef<WebView>(null);

    const generateMapHTML = () => {
        const markersJS = markers.map(marker => ({
            ...marker,
            color: marker.status === 'active' ? '#10B981' : 
                   marker.status === 'pending' ? '#F59E0B' : '#6B7280'
        }));

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Map</title>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <style>
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                #map { height: 100vh; width: 100%; }
                .custom-marker {
                    background: white;
                    border-radius: 50%;
                    border: 3px solid;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                .marker-active { border-color: #10B981; background: #ECFDF5; }
                .marker-pending { border-color: #F59E0B; background: #FFFBEB; }
                .marker-completed { border-color: #6B7280; background: #F9FAFB; }
                .custom-popup {
                    font-size: 12px;
                    border-radius: 8px;
                    padding: 8px;
                }
                .popup-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: #1F2937;
                }
                .popup-status {
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    display: inline-block;
                    text-transform: uppercase;
                    font-weight: 500;
                }
                .status-active { background: #ECFDF5; color: #065F46; }
                .status-pending { background: #FFFBEB; color: #92400E; }
                .status-completed { background: #F9FAFB; color: #374151; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script>
                // Initialize map
                const map = L.map('map', {
                    zoomControl: true,
                    attributionControl: false,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    touchZoom: true,
                    dragging: true
                }).setView([${latitude}, ${longitude}], 12);

                // Add tile layer with modern dark style
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                    attribution: ''
                }).addTo(map);

                // Add user location marker
                const userIcon = L.divIcon({
                    className: 'custom-marker marker-active',
                    html: '<div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%;"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                L.marker([${latitude}, ${longitude}], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('<div class="popup-title">Your Location</div><div class="popup-status status-active">Current</div>');

                // Add other markers
                const markers = ${JSON.stringify(markersJS)};
                markers.forEach(marker => {
                    const icon = L.divIcon({
                        className: \`custom-marker marker-\${marker.status || 'completed'}\`,
                        html: '<div style="width: 6px; height: 6px; background: ' + marker.color + '; border-radius: 50%;"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });

                    L.marker([marker.latitude, marker.longitude], { icon: icon })
                        .addTo(map)
                        .bindPopup(\`
                            <div class="popup-title">\${marker.title}</div>
                            <div class="popup-status status-\${marker.status || 'completed'}">\${marker.status || 'completed'}</div>
                        \`);
                });

                // Fit map to show all markers
                if (markers.length > 0) {
                    const group = new L.featureGroup([
                        L.marker([${latitude}, ${longitude}]),
                        ...markers.map(m => L.marker([m.latitude, m.longitude]))
                    ]);
                    map.fitBounds(group.getBounds().pad(0.1));
                }

                // Notify React Native when map is ready
                setTimeout(() => {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
                    }
                }, 1000);
            </script>
        </body>
        </html>
        `;
    };

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'mapReady' && onMapReady) {
                onMapReady();
            }
        } catch (error) {
            console.log('Error parsing map message:', error);
        }
    };

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                ref={webViewRef}
                source={{ html: generateMapHTML() }}
                style={styles.webView}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                scrollEnabled={false}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        elevation: 4,
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});

export default MapView;