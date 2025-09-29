import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Map, Layers, Navigation } from 'lucide-react-native';

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
    showControls?: boolean;
    zoom?: number;
    enableFullscreen?: boolean;
}

type MapType = 'roadmap' | 'satellite' | 'hybrid' | '3d';

const EnhancedMapView: React.FC<MapViewProps> = ({
    latitude = 37.7749,
    longitude = -122.4194,
    markers = [],
    height = 300,
    onMapReady,
    showControls = false,
    zoom = 20,
    enableFullscreen = false
}) => {
    const webViewRef = useRef<WebView>(null);
    const [mapType, setMapType] = useState<MapType>('roadmap');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const getMapTileUrl = (type: MapType) => {
        switch (type) {
            case 'satellite':
                return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            case 'hybrid':
                return 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
            case '3d':
                return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
            case 'roadmap':
            default:
                return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        }
    };

    const generateMapHTML = () => {
        const markersJS = markers.map(marker => ({
            ...marker,
            color: marker.status === 'active' ? '#10B981' : 
                   marker.status === 'pending' ? '#F59E0B' : '#6B7280'
        }));

        const tileUrl = getMapTileUrl(mapType);
        const attribution = mapType === 'satellite' ? 
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' :
            '';

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enhanced Map</title>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    overflow: hidden;
                }
                #map { 
                    height: 100vh;
                    width: 100%; 
                    position: relative;
                }
                

                .zoom-controls {
                    position: absolute;
                    top: 114px;
                    left: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .zoom-button {
                    background: rgba(255, 255, 255, 0.95);
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    font-size: 18px;
                    font-weight: bold;
                    color: #374151;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                
                .zoom-button:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: translateY(-1px);
                }
                
                .location-button {
                    position: absolute;
                    bottom: 440px;
                    left: 20px;
                    z-index: 1000;
                    background: rgba(255, 255, 255, 0.95);
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 20px;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                
                .location-button:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: scale(1.1);
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
                    transition: all 0.2s;
                }
                
                .custom-marker:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                
                .marker-active { border-color: #10B981; background: #ECFDF5; }
                .marker-pending { border-color: #F59E0B; background: #FFFBEB; }
                .marker-completed { border-color: #6B7280; background: #F9FAFB; }
                
                .user-marker {
                    background: #3B82F6;
                    border: 4px solid white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    box-shadow: 0 2px 12px rgba(59, 130, 246, 0.4);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { box-shadow: 0 2px 12px rgba(59, 130, 246, 0.4); }
                    50% { box-shadow: 0 2px 20px rgba(59, 130, 246, 0.7); }
                    100% { box-shadow: 0 2px 12px rgba(59, 130, 246, 0.4); }
                }

                .custom-popup {
                    font-size: 12px;
                    border-radius: 8px;
                    padding: 8px;
                    min-width: 120px;
                }
                
                .popup-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: #1F2937;
                    font-size: 14px;
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
                    padding: 2px 8px;
                    border-radius: 12px;
                    display: inline-block;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                
                .status-active { background: #ECFDF5; color: #065F46; }
                .status-pending { background: #FFFBEB; color: #92400E; }
                .status-completed { background: #F9FAFB; color: #374151; }
                
                ${mapType === '3d' ? `
                .leaflet-tile-container {
                    filter: contrast(1.1) saturate(1.2);
                }
                ` : ''}
            </style>
        </head>
        <body>
            <div id="map"></div>
            ${showControls ? `
            <div class="zoom-controls">
                <button class="zoom-button" onclick="map.zoomIn()">+</button>
                <button class="zoom-button" onclick="map.zoomOut()">−</button>
            </div>
            <button class="location-button" onclick="centerOnUser()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            </button>
            ` : ''}
            
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script>
                let currentTileLayer;
                
                // Initialize map with proper zoom settings
                const map = L.map('map', {
                    zoomControl: false,
                    attributionControl: false,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    touchZoom: true,
                    dragging: true,
                    preferCanvas: true,
                    maxZoom: 19,
                    minZoom: 8
                }).setView([${latitude}, ${longitude}], Math.max(${zoom}, 16));

                // Add initial tile layer
                function addTileLayer(url) {
                    if (currentTileLayer) {
                        map.removeLayer(currentTileLayer);
                    }
                    
                    currentTileLayer = L.tileLayer(url, {
                        maxZoom: 19,
                        attribution: '${attribution}',
                        subdomains: 'abcd'
                    });
                    
                    currentTileLayer.addTo(map);
                }
                
                addTileLayer('${tileUrl}');

                // Change map type function
                function changeMapType(type) {
                    let url;
                    switch(type) {
                        case 'satellite':
                            url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                            break;
                        case 'hybrid':
                            url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
                            break;
                        case '3d':
                            url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
                            break;
                        default:
                            url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
                    }
                    
                    addTileLayer(url);
                    
                    // Update button states
                    document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
                    document.querySelector(\`[onclick="changeMapType('\${type}')"]\`).classList.add('active');
                    
                    // Send message to React Native
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ 
                            type: 'mapTypeChanged', 
                            mapType: type 
                        }));
                    }
                }

                // Add user location marker with enhanced styling
                const userIcon = L.divIcon({
                    className: 'user-marker',
                    html: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                const userMarker = L.marker([${latitude}, ${longitude}], { icon: userIcon })
                    .addTo(map)
                    .bindPopup(\`
                        <div class="custom-popup">
                            <div class="popup-title">📍 Your Location</div>
                            <div class="popup-status status-active">Live</div>
                        </div>
                    \`);

                // Add other markers
                const markers = ${JSON.stringify(markersJS)};
                const markerObjects = [];
                
                markers.forEach(marker => {
                    const icon = L.divIcon({
                        className: \`custom-marker marker-\${marker.status || 'completed'}\`,
                        html: \`<div style="width: 8px; height: 8px; background: \${marker.color}; border-radius: 50%;"></div>\`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });

                    const markerObj = L.marker([marker.latitude, marker.longitude], { icon: icon })
                        .addTo(map)
                        .bindPopup(\`
                            <div class="custom-popup">
                                <div class="popup-title">\${marker.title}</div>
                                \${marker.role ? '<div class="popup-role">' + marker.role.charAt(0).toUpperCase() + marker.role.slice(1) + '</div>' : ''}
                                \${marker.additional_info ? '<div class="popup-info">' + marker.additional_info + '</div>' : ''}
                                <div class="popup-status status-\${marker.status || 'completed'}">
                                    \${marker.status || 'completed'}
                                </div>
                            </div>
                        \`);
                    
                    markerObjects.push(markerObj);
                });

                // Center on user location with offset to show at 1/3 from top
                function centerOnUser() {
                    const offsetY = window.innerHeight * 0.17; // Offset to position at 1/3 from top
                    const targetPoint = map.latLngToContainerPoint([${latitude}, ${longitude}]);
                    targetPoint.y -= offsetY;
                    const targetLatLng = map.containerPointToLatLng(targetPoint);
                    
                    // Use optimal zoom for clear visibility while maintaining context
                    const targetZoom = Math.max(17, ${zoom} + 2);
                    map.setView(targetLatLng, targetZoom, { animate: true, duration: 1 });
                    userMarker.openPopup();
                }

                // Set initial view with user location focused and optimal zoom
                setTimeout(() => {
                    // Ensure minimum zoom level for clear visibility on screen
                    const targetZoom = ${zoom} < 16 ? 16 : Math.min(${zoom}, 18);
                    
                    // Position user location at 1/3 from top of screen
                    const offsetY = window.innerHeight * 0.17;
                    const targetPoint = map.latLngToContainerPoint([${latitude}, ${longitude}]);
                    targetPoint.y -= offsetY;
                    const targetLatLng = map.containerPointToLatLng(targetPoint);
                    
                    map.setView(targetLatLng, targetZoom, { animate: false });
                    
                    // Only fit bounds if there are many distant markers
                    if (markers.length > 5) {
                        setTimeout(() => {
                            const userLatLng = L.latLng(${latitude}, ${longitude});
                            const nearbyMarkers = markerObjects.filter(marker => {
                                const markerLatLng = marker.getLatLng();
                                const distance = userLatLng.distanceTo(markerLatLng);
                                return distance < 5000; // 5km radius
                            });
                            
                            if (nearbyMarkers.length > 0) {
                                const group = new L.featureGroup([userMarker, ...nearbyMarkers]);
                                const bounds = group.getBounds().pad(0.3);
                                
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
                }, 500);

                // Enhanced map interactions
                map.on('zoomend', function() {
                    const zoom = map.getZoom();
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ 
                            type: 'zoomChanged', 
                            zoom: zoom 
                        }));
                    }
                });

                map.on('moveend', function() {
                    const center = map.getCenter();
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ 
                            type: 'centerChanged', 
                            lat: center.lat,
                            lng: center.lng
                        }));
                    }
                });

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
            } else if (data.type === 'mapTypeChanged') {
                setMapType(data.mapType);
            }
        } catch (error) {
            console.log('Error parsing map message:', error);
        }
    };

    const MapTypeControls = () => (
        <View style={styles.mapTypeControls}>
            <TouchableOpacity
                style={[styles.mapTypeButton, mapType === 'roadmap' && styles.activeMapType]}
                onPress={() => {
                    setMapType('roadmap');
                    webViewRef.current?.postMessage(JSON.stringify({ type: 'changeMapType', mapType: 'roadmap' }));
                }}
            >
                <Map size={16} color={mapType === 'roadmap' ? '#FFFFFF' : '#3B82F6'} />
                <Text style={[styles.mapTypeText, mapType === 'roadmap' && styles.activeMapTypeText]}>Road</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[styles.mapTypeButton, mapType === 'satellite' && styles.activeMapType]}
                onPress={() => {
                    setMapType('satellite');
                    webViewRef.current?.postMessage(JSON.stringify({ type: 'changeMapType', mapType: 'satellite' }));
                }}
            >
                <Layers size={16} color={mapType === 'satellite' ? '#FFFFFF' : '#3B82F6'} />
                <Text style={[styles.mapTypeText, mapType === 'satellite' && styles.activeMapTypeText]}>Satellite</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[styles.mapTypeButton, mapType === '3d' && styles.activeMapType]}
                onPress={() => {
                    setMapType('3d');
                    webViewRef.current?.postMessage(JSON.stringify({ type: 'changeMapType', mapType: '3d' }));
                }}
            >
                <Navigation size={16} color={mapType === '3d' ? '#FFFFFF' : '#3B82F6'} />
                <Text style={[styles.mapTypeText, mapType === '3d' && styles.activeMapTypeText]}>3D</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { height: isFullscreen ? '100%' : height }]}>
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
                allowsFullscreenVideo={true}
            />
            
            {showControls && <MapTypeControls />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    mapTypeControls: {
        position: 'absolute',
        top: 110,
        right: 16,
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 4,
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
        elevation: 4,
        zIndex: 1000,
    },
    mapTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginHorizontal: 2,
    },
    activeMapType: {
        backgroundColor: '#3B82F6',
    },
    mapTypeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3B82F6',
        marginLeft: 4,
    },
    activeMapTypeText: {
        color: '#FFFFFF',
    },
});

export default EnhancedMapView;