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
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { 
                    height: 100%; 
                    width: 100%; 
                    margin: 0; 
                    padding: 0; 
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #E5E7EB;
                }
                #map { 
                    height: 100vh; 
                    width: 100vw; 
                    position: absolute;
                    top: 0;
                    left: 0;
                    background-color: #E5E7EB;
                }
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
                .popup-role {
                    font-size: 10px;
                    color: #6B7280;
                    text-transform: uppercase;
                    font-weight: 500;
                    margin-bottom: 2px;
                    letter-spacing: 0.5px;
                }
                .popup-info {
                    font-size: 11px;
                    color: #374151;
                    margin-bottom: 4px;
                    font-style: italic;
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
                // Initialize map with proper zoom settings
                const map = L.map('map', {
                    zoomControl: true,
                    attributionControl: false,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    touchZoom: true,
                    dragging: true,
                    maxZoom: 19,
                    minZoom: 10
                }).setView([${latitude}, ${longitude}], Math.max(15, 16));

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
                            \${marker.role ? '<div class="popup-role">' + marker.role.charAt(0).toUpperCase() + marker.role.slice(1) + '</div>' : ''}
                            \${marker.additional_info ? '<div class="popup-info">' + marker.additional_info + '</div>' : ''}
                            <div class="popup-status status-\${marker.status || 'completed'}">\${marker.status || 'completed'}</div>
                        \`);
                });

                // Set initial high zoom focused on user location
                setTimeout(() => {
                    const targetZoom = 16; // High zoom for precise location viewing
                    map.setView([${latitude}, ${longitude}], targetZoom, { animate: false });
                }, 500);

                // Only fit bounds if there are many markers and they're far apart
                if (markers.length > 3) {
                    setTimeout(() => {
                        const userLatLng = L.latLng(${latitude}, ${longitude});
                        const nearbyMarkers = markers.filter(marker => {
                            const markerLatLng = L.latLng(marker.latitude, marker.longitude);
                            const distance = userLatLng.distanceTo(markerLatLng);
                            return distance < 3000; // 3km radius
                        });
                        
                        if (nearbyMarkers.length > 0) {
                            const group = new L.featureGroup([
                                L.marker([${latitude}, ${longitude}]),
                                ...nearbyMarkers.map(m => L.marker([m.latitude, m.longitude]))
                            ]);
                            const bounds = group.getBounds().pad(0.2);
                            
                            // Ensure minimum zoom level for location detail
                            const boundsZoom = map.getBoundsZoom(bounds);
                            const finalZoom = Math.max(boundsZoom, 14);
                            
                            map.fitBounds(bounds, { 
                                maxZoom: finalZoom,
                                animate: true,
                                duration: 1
                            });
                        }
                    }, 2000);
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
        backgroundColor: '#E5E7EB', // Lighter gray fallback
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    webView: {
        flex: 1,
        backgroundColor: '#E5E7EB', // Match container background
        opacity: 0.99, // Helps with rendering issues on some devices
    },
});

export default MapView;