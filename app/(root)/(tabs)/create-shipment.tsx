import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import {
    Plus,
    Package,
    MapPin,
    Truck,
    Calendar,
    DollarSign,
    ArrowRight,
    Users,
    Weight,
    Ruler,
    Phone,
    Navigation,
    RefreshCw,
} from 'lucide-react-native';
import { Platform } from 'react-native';

// Platform-specific imports for maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
    try {
        const Maps = require('react-native-maps');
        MapView = Maps.default;
        Marker = Maps.Marker;
        PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    } catch (error) {
        console.warn('react-native-maps not available:', error);
    }
}
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { fetchAPI } from '../../lib/fetch';
import { testAPIEndpoints } from '../../lib/api-test';

const { width } = Dimensions.get('window');

// Location tracking task name
const LOCATION_TASK_NAME = 'background-location-task';

interface AvailableDriver {
    id: string;
    name: string;
    vehicle_type: string;
    vehicle_number: string;
    current_latitude: number;
    current_longitude: number;
    average_rating: number;
    is_available: boolean;
}

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
}

interface MapRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

// Define the background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
        console.error('Background location task error:', error);
        return;
    }
    if (data) {
        const { locations } = data;
        console.log('Background location update:', locations);
        // You can process location updates here
    }
});

const CreateShipmentScreen = () => {
    const router = useRouter();
    const { user } = useUser();
    const mapRef = useRef<any>(null);
    
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<AvailableDriver | null>(null);
    const [estimatedCost, setEstimatedCost] = useState<number>(0);
    
    // Location tracking states
    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
    const [isTrackingLocation, setIsTrackingLocation] = useState(false);
    const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
    const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
    
    // Form data
    const [formData, setFormData] = useState({
        pickupAddress: '',
        pickupLatitude: 0,
        pickupLongitude: 0,
        deliveryAddress: '',
        deliveryLatitude: 0,
        deliveryLongitude: 0,
        packageDescription: '',
        packageWeight: '',
        packageDimensions: '',
        packageValue: '',
        receiverName: '',
        receiverPhone: '',
        preferredPickupTime: '',
        specialInstructions: '',
        shipmentType: 'regular', // regular, express, fragile
    });

    // Initialize location tracking and fetch drivers
    useEffect(() => {
        initializeLocationServices();
        fetchAvailableDrivers();
        
        return () => {
            // Cleanup location tracking when component unmounts
            stopLocationTracking();
        };
    }, []);

    // Initialize location services
    const initializeLocationServices = async () => {
        try {
            const permission = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(permission);
            
            if (permission.status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required for accurate pickup location');
                return;
            }

            await getCurrentLocation();
            startLocationTracking();
        } catch (error) {
            console.error('Error initializing location services:', error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const locationData: LocationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || undefined,
                timestamp: location.timestamp,
            };

            setCurrentLocation(locationData);

            // Update form data with current location
            const address = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (address[0]) {
                const fullAddress = `${address[0].street || ''} ${address[0].city || ''} ${address[0].region || ''}`.trim();
                setFormData(prev => ({
                    ...prev,
                    pickupAddress: fullAddress,
                    pickupLatitude: location.coords.latitude,
                    pickupLongitude: location.coords.longitude,
                }));
            }

            // Set initial map region
            setMapRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });

        } catch (error) {
            console.error('Error getting current location:', error);
            Alert.alert('Location Error', 'Unable to get current location. Please try again.');
        }
    };

    // Start real-time location tracking
    const startLocationTracking = async () => {
        if (isTrackingLocation) return;

        try {
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000, // Update every 5 seconds
                    distanceInterval: 10, // Update when moved 10 meters
                },
                (location) => {
                    const locationData: LocationData = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy || undefined,
                        timestamp: location.timestamp,
                    };

                    setCurrentLocation(locationData);

                    // Update pickup location in form if it's still the current location
                    if (formData.pickupLatitude === currentLocation?.latitude && 
                        formData.pickupLongitude === currentLocation?.longitude) {
                        setFormData(prev => ({
                            ...prev,
                            pickupLatitude: location.coords.latitude,
                            pickupLongitude: location.coords.longitude,
                        }));
                    }

                    // Update map region to follow user
                    setMapRegion({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    });
                }
            );

            setLocationSubscription(subscription);
            setIsTrackingLocation(true);
        } catch (error) {
            console.error('Error starting location tracking:', error);
        }
    };

    // Stop location tracking
    const stopLocationTracking = () => {
        if (locationSubscription) {
            locationSubscription.remove();
            setLocationSubscription(null);
            setIsTrackingLocation(false);
        }
    };

    // Toggle location tracking
    const toggleLocationTracking = () => {
        if (isTrackingLocation) {
            stopLocationTracking();
        } else {
            startLocationTracking();
        }
    };

    // Refresh current location
    const refreshLocation = async () => {
        setLoading(true);
        await getCurrentLocation();
        setLoading(false);
    };

    const fetchAvailableDrivers = async () => {
        try {
            console.log('🚛 Fetching available drivers...');
            const response = await fetchAPI('/drivers?role=transporter&available=true');
            console.log('🚛 Drivers API response:', response);
            if (response.success) {
                setAvailableDrivers(response.data || []);
                console.log('✅ Available drivers set:', response.data?.length || 0);
            } else {
                console.warn('⚠️ Drivers API returned success: false', response);
            }
        } catch (error) {
            console.error('❌ Error fetching drivers:', error);
            // Set empty array as fallback
            setAvailableDrivers([]);
        }
    };

    const geocodeAddress = async (address: string) => {
        try {
            const geocoded = await Location.geocodeAsync(address);
            if (geocoded.length > 0) {
                return {
                    latitude: geocoded[0].latitude,
                    longitude: geocoded[0].longitude,
                };
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
        return null;
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; // Distance in kilometers
        return d;
    };

    const calculateEstimatedCost = () => {
        if (formData.pickupLatitude && formData.deliveryLatitude) {
            const distance = calculateDistance(
                formData.pickupLatitude,
                formData.pickupLongitude,
                formData.deliveryLatitude,
                formData.deliveryLongitude
            );
            
            let baseCost = distance * 15; // ₹15 per km base rate
            const weight = parseFloat(formData.packageWeight) || 1;
            const value = parseFloat(formData.packageValue) || 0;
            
            // Add weight multiplier
            if (weight > 10) baseCost *= 1.5;
            
            // Add express shipping cost
            if (formData.shipmentType === 'express') baseCost *= 1.8;
            if (formData.shipmentType === 'fragile') baseCost *= 1.3;
            
            // Add insurance cost
            baseCost += (value * 0.02);
            
            setEstimatedCost(Math.round(baseCost));
        }
    };

    useEffect(() => {
        calculateEstimatedCost();
    }, [formData.pickupLatitude, formData.deliveryLatitude, formData.packageWeight, formData.packageValue, formData.shipmentType]);

    const handleAddressChange = async (field: 'pickupAddress' | 'deliveryAddress', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (value.length > 10) {
            const coords = await geocodeAddress(value);
            if (coords) {
                if (field === 'pickupAddress') {
                    setFormData(prev => ({
                        ...prev,
                        pickupLatitude: coords.latitude,
                        pickupLongitude: coords.longitude,
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        deliveryLatitude: coords.latitude,
                        deliveryLongitude: coords.longitude,
                    }));
                }
            }
        }
    };

    const createShipment = async () => {
        if (!selectedDriver) {
            Alert.alert('Error', 'Please select a driver');
            return;
        }

        setLoading(true);
        try {
            console.log('👤 Fetching user data for:', user?.id);
            const userResponse = await fetchAPI(`/user?clerkUserId=${user?.id}`);
            console.log('👤 User API response:', userResponse);
            if (!userResponse.user) {
                Alert.alert('Error', 'User not found');
                return;
            }

            const shipmentData = {
                customerId: userResponse.user.id,
                driverId: selectedDriver.id,
                pickupAddress: formData.pickupAddress,
                deliveryAddress: formData.deliveryAddress,
                pickupLatitude: formData.pickupLatitude,
                pickupLongitude: formData.pickupLongitude,
                deliveryLatitude: formData.deliveryLatitude,
                deliveryLongitude: formData.deliveryLongitude,
                packageDescription: formData.packageDescription,
                packageWeight: parseFloat(formData.packageWeight) || 0,
                packageDimensions: formData.packageDimensions,
                packageValue: parseFloat(formData.packageValue) || 0,
                receiverName: formData.receiverName,
                receiverPhone: formData.receiverPhone,
                preferredPickupTime: formData.preferredPickupTime,
                specialInstructions: formData.specialInstructions,
                shipmentType: formData.shipmentType,
                estimatedCost: estimatedCost,
                status: 'pending',
            };

            console.log('📦 Creating shipment with data:', shipmentData);
            const response = await fetchAPI('/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shipmentData),
            });
            console.log('📦 Shipment API response:', response);

            if (response.success) {
                Alert.alert(
                    'Success!',
                    'Shipment created successfully. The driver will be notified.',
                    [
                        {
                            text: 'View Shipments',
                            onPress: () => router.push('/(root)/(tabs)/shipments'),
                        },
                        {
                            text: 'Create Another',
                            onPress: () => {
                                setStep(1);
                                setFormData({
                                    ...formData,
                                    deliveryAddress: '',
                                    packageDescription: '',
                                    packageWeight: '',
                                    receiverName: '',
                                    receiverPhone: '',
                                });
                                setSelectedDriver(null);
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response.error || 'Failed to create shipment');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create shipment');
            console.error('Create shipment error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pickup & Delivery Details</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pickup Address</Text>
                <View style={styles.inputContainer}>
                    <MapPin size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.textInput}
                        value={formData.pickupAddress}
                        onChangeText={(value) => handleAddressChange('pickupAddress', value)}
                        placeholder="Enter pickup address"
                        multiline
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Delivery Address</Text>
                <View style={styles.inputContainer}>
                    <MapPin size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.textInput}
                        value={formData.deliveryAddress}
                        onChangeText={(value) => handleAddressChange('deliveryAddress', value)}
                        placeholder="Enter delivery address"
                        multiline
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shipment Type</Text>
                <View style={styles.chipContainer}>
                    {['regular', 'express', 'fragile'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.chip,
                                formData.shipmentType === type && styles.chipSelected
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, shipmentType: type }))}
                        >
                            <Text style={[
                                styles.chipText,
                                formData.shipmentType === type && styles.chipTextSelected
                            ]}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Location Tracking Controls */}
            <View style={styles.locationControls}>
                <TouchableOpacity
                    style={[styles.locationButton, { backgroundColor: isTrackingLocation ? '#DC2626' : '#10B981' }]}
                    onPress={toggleLocationTracking}
                >
                    <Navigation size={16} color="white" />
                    <Text style={styles.locationButtonText}>
                        {isTrackingLocation ? 'Stop Tracking' : 'Start Tracking'}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.refreshLocationButton}
                    onPress={refreshLocation}
                    disabled={loading}
                >
                    <RefreshCw size={16} color="#007AFF" />
                    <Text style={styles.refreshLocationButtonText}>Refresh Location</Text>
                </TouchableOpacity>
            </View>

            {/* Current Location Info */}
            {currentLocation && (
                <View style={styles.locationInfo}>
                    <Text style={styles.locationInfoText}>
                        Current Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </Text>
                    {currentLocation.accuracy && (
                        <Text style={styles.accuracyText}>
                            Accuracy: {currentLocation.accuracy.toFixed(0)}m
                        </Text>
                    )}
                    <Text style={styles.timestampText}>
                        Last Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                    </Text>
                </View>
            )}

            {/* Enhanced Map Preview */}
            {(formData.pickupLatitude || currentLocation) && (
                <View style={styles.mapContainer}>
                    {Platform.OS === 'web' || !MapView ? (
                        <View style={[styles.map, { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Map Preview</Text>
                            <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                                📍 {(formData.pickupLatitude || currentLocation?.latitude)?.toFixed(4)}, {(formData.pickupLongitude || currentLocation?.longitude)?.toFixed(4)}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
                                Interactive map is available on mobile devices
                            </Text>
                        </View>
                    ) : (
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            provider={PROVIDER_GOOGLE}
                            showsUserLocation={true}
                            showsMyLocationButton={true}
                            showsCompass={true}
                            zoomEnabled={true}
                            initialRegion={{
                                latitude: formData.pickupLatitude || currentLocation?.latitude || 0,
                                longitude: formData.pickupLongitude || currentLocation?.longitude || 0,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                        >
                            {/* Current Location Marker */}
                            {currentLocation && (
                                <Marker
                                    coordinate={{
                                        latitude: currentLocation.latitude,
                                        longitude: currentLocation.longitude,
                                    }}
                                    title="Current Location"
                                    description={`Accuracy: ${currentLocation.accuracy?.toFixed(0)}m`}
                                    pinColor="blue"
                                />
                            )}
                            
                            {/* Pickup Location Marker */}
                            {formData.pickupLatitude && formData.pickupLongitude && (
                                <Marker
                                    coordinate={{
                                        latitude: formData.pickupLatitude,
                                        longitude: formData.pickupLongitude,
                                    }}
                                    title="Pickup Location"
                                    description={formData.pickupAddress}
                                    pinColor="green"
                                />
                            )}
                            
                            {/* Delivery Location Marker */}
                            {formData.deliveryLatitude && formData.deliveryLongitude && (
                                <Marker
                                    coordinate={{
                                        latitude: formData.deliveryLatitude,
                                        longitude: formData.deliveryLongitude,
                                    }}
                                    title="Delivery Location"
                                    description={formData.deliveryAddress}
                                    pinColor="red"
                                />
                            )}

                            {/* Available Drivers Markers */}
                            {availableDrivers.map((driver) => (
                                <Marker
                                    key={`driver-${driver.id}`}
                                    coordinate={{
                                        latitude: driver.current_latitude,
                                        longitude: driver.current_longitude,
                                    }}
                                    title={`Driver: ${driver.name}`}
                                    description={`${driver.vehicle_type} - ${driver.vehicle_number}`}
                                    pinColor="orange"
                                />
                            ))}
                        </MapView>
                    )}
                    
                    {/* Map Overlay Controls - Only for native platforms */}
                    {Platform.OS !== 'web' && (
                        <View style={styles.mapOverlay}>
                            <TouchableOpacity
                                style={styles.centerButton}
                                onPress={() => {
                                    if (currentLocation && mapRef.current) {
                                        mapRef.current.animateToRegion({
                                            latitude: currentLocation.latitude,
                                            longitude: currentLocation.longitude,
                                            latitudeDelta: 0.0922,
                                            longitudeDelta: 0.0421,
                                        }, 1000);
                                    }
                                }}
                            >
                                <MapPin size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Package Details</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Package Description</Text>
                <View style={styles.inputContainer}>
                    <Package size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.textInput}
                        value={formData.packageDescription}
                        onChangeText={(value) => setFormData(prev => ({ ...prev, packageDescription: value }))}
                        placeholder="Describe the package contents"
                        multiline
                    />
                </View>
            </View>

            <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Weight (kg)</Text>
                    <View style={styles.inputContainer}>
                        <Weight size={20} color="#8E8E93" />
                        <TextInput
                            style={styles.textInput}
                            value={formData.packageWeight}
                            onChangeText={(value) => setFormData(prev => ({ ...prev, packageWeight: value }))}
                            placeholder="0"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Value (₹)</Text>
                    <View style={styles.inputContainer}>
                        <DollarSign size={20} color="#8E8E93" />
                        <TextInput
                            style={styles.textInput}
                            value={formData.packageValue}
                            onChangeText={(value) => setFormData(prev => ({ ...prev, packageValue: value }))}
                            placeholder="0"
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dimensions (L x W x H cm)</Text>
                <View style={styles.inputContainer}>
                    <Ruler size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.textInput}
                        value={formData.packageDimensions}
                        onChangeText={(value) => setFormData(prev => ({ ...prev, packageDimensions: value }))}
                        placeholder="e.g., 30 x 20 x 15"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Receiver Name</Text>
                <View style={styles.inputContainer}>
                    <Users size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.textInput}
                        value={formData.receiverName}
                        onChangeText={(value) => setFormData(prev => ({ ...prev, receiverName: value }))}
                        placeholder="Receiver's full name"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Receiver Phone</Text>
                <View style={styles.inputContainer}>
                    <Phone size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.textInput}
                        value={formData.receiverPhone}
                        onChangeText={(value) => setFormData(prev => ({ ...prev, receiverPhone: value }))}
                        placeholder="Receiver's phone number"
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Special Instructions (Optional)</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                        value={formData.specialInstructions}
                        onChangeText={(value) => setFormData(prev => ({ ...prev, specialInstructions: value }))}
                        placeholder="Any special handling instructions"
                        multiline
                    />
                </View>
            </View>

            {estimatedCost > 0 && (
                <View style={styles.costContainer}>
                    <Text style={styles.costLabel}>Estimated Cost</Text>
                    <Text style={styles.costValue}>₹{estimatedCost}</Text>
                </View>
            )}
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Driver</Text>
            
            {availableDrivers.length === 0 ? (
                <View style={styles.emptyState}>
                    <Truck size={48} color="#8E8E93" />
                    <Text style={styles.emptyStateText}>No drivers available at the moment</Text>
                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={fetchAvailableDrivers}
                    >
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.driversList}>
                    {availableDrivers.map((driver) => (
                        <TouchableOpacity
                            key={driver.id}
                            style={[
                                styles.driverCard,
                                selectedDriver?.id === driver.id && styles.driverCardSelected
                            ]}
                            onPress={() => setSelectedDriver(driver)}
                        >
                            <View style={styles.driverInfo}>
                                <Text style={styles.driverName}>{driver.name}</Text>
                                <Text style={styles.driverVehicle}>
                                    {driver.vehicle_type} • {driver.vehicle_number}
                                </Text>
                                <View style={styles.driverRating}>
                                    <Text style={styles.ratingText}>⭐ {driver.average_rating || 'New'}</Text>
                                </View>
                            </View>
                            <View style={styles.driverStatus}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Available</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {[1, 2, 3].map((stepNumber) => (
                <View key={stepNumber} style={styles.stepIndicatorContainer}>
                    <View style={[
                        styles.stepCircle,
                        step >= stepNumber && styles.stepCircleActive
                    ]}>
                        <Text style={[
                            styles.stepNumber,
                            step >= stepNumber && styles.stepNumberActive
                        ]}>{stepNumber}</Text>
                    </View>
                    {stepNumber < 3 && (
                        <View style={[
                            styles.stepLine,
                            step > stepNumber && styles.stepLineActive
                        ]} />
                    )}
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Shipment</Text>
                <View style={{ width: 60 }} />
            </View>

            {renderStepIndicator()}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </ScrollView>

            <View style={styles.footer}>
                {step > 1 && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setStep(step - 1)}
                    >
                        <Text style={styles.secondaryButtonText}>Previous</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        step === 1 && { flex: 1 }
                    ]}
                    onPress={() => {
                        if (step < 3) {
                            if (step === 1) {
                                if (!formData.pickupAddress || !formData.deliveryAddress) {
                                    Alert.alert('Error', 'Please enter both pickup and delivery addresses');
                                    return;
                                }
                            }
                            if (step === 2) {
                                if (!formData.packageDescription || !formData.receiverName || !formData.receiverPhone) {
                                    Alert.alert('Error', 'Please fill in all required fields');
                                    return;
                                }
                            }
                            setStep(step + 1);
                        } else {
                            createShipment();
                        }
                    }}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.primaryButtonText}>
                                {step === 3 ? 'Create Shipment' : 'Continue'}
                            </Text>
                            {step < 3 && <ArrowRight size={20} color="#FFFFFF" />}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        fontSize: 16,
        color: '#007AFF',
        width: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
    },
    stepIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E5EA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#007AFF',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    stepNumberActive: {
        color: '#FFFFFF',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: '#007AFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    stepContainer: {
        paddingVertical: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#000000',
        marginLeft: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    chipContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
    },
    chipSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF',
    },
    chipText: {
        fontSize: 14,
        color: '#000000',
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 16,
    },
    map: {
        flex: 1,
    },
    costContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    costLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
    },
    costValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 16,
        textAlign: 'center',
    },
    refreshButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    refreshButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    driversList: {
        maxHeight: 400,
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    driverCardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F9FF',
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    driverVehicle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
    },
    driverRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        color: '#FACC15',
    },
    driverStatus: {
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginBottom: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#10B981',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    locationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
        flex: 1,
    },
    locationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    refreshLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#FFFFFF',
        gap: 8,
        flex: 1,
    },
    refreshLocationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    locationInfo: {
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    locationInfoText: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
        marginBottom: 4,
    },
    accuracyText: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 2,
    },
    timestampText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    mapOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'column',
        gap: 8,
    },
    centerButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default CreateShipmentScreen;