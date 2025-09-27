import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Dimensions,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Linking,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import MapView from '../../components/MapView';
import { 
    Search, 
    Package, 
    Truck, 
    CheckCircle, 
    Clock, 
    MapPin,
    Calendar,
    User,
    Phone,
    AlertCircle,
    Navigation,
    Copy,
    Map,
    Locate,
    RefreshCw
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

const { width } = Dimensions.get('window');

interface TrackingEvent {
    id: string;
    status: string;
    latitude: number;
    longitude: number;
    notes: string;
    timestamp: string;
}

interface ShipmentDetails {
    id: string;
    tracking_number?: string;
    status: string;
    pickup_address: string;
    delivery_address: string;
    pickup_latitude: number;
    pickup_longitude: number;
    delivery_latitude: number;
    delivery_longitude: number;
    package_description: string;
    package_weight: number;
    estimated_cost: number;
    receiver_name: string;
    receiver_phone: string;
    driver_name?: string;
    driver_phone?: string;
    customer_name?: string;
    customer_phone?: string;
    created_at: string;
    updated_at: string;
}

const TrackingScreen = () => {
    const { user } = useUser();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails | null>(null);
    const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
    const [userShipments, setUserShipments] = useState<ShipmentDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userProfile) {
            fetchUserShipments();
        }
    }, [userProfile]);

    const fetchUserProfile = async () => {
        if (!user?.id) return;

        try {
            const response = await fetchAPI(`/user?clerkUserId=${user.id}`);
            if (response.user) {
                setUserProfile(response.user);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const fetchUserShipments = async () => {
        if (!userProfile) return;

        try {
            let endpoint = '';
            if (userProfile.role === 'transporter') {
                endpoint = `/shipments?driverId=${userProfile.id}`;
            } else if (userProfile.role === 'customer' || userProfile.role === 'business') {
                endpoint = `/shipments?customerId=${userProfile.id}`;
            } else if (userProfile.role === 'admin') {
                endpoint = '/shipments';
            }

            if (endpoint) {
                const response = await fetchAPI(endpoint);
                if (response.success) {
                    setUserShipments(response.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching user shipments:', error);
        }
    };

    const searchShipment = async () => {
        if (!searchQuery.trim()) {
            Alert.alert('Error', 'Please enter a tracking number or shipment ID');
            return;
        }

        setLoading(true);
        try {
            // Try to find shipment by ID or tracking number
            const response = await fetchAPI(`/shipments?search=${searchQuery.trim()}`);
            
            if (response.success && response.data && response.data.length > 0) {
                const shipment = response.data[0];
                setShipmentDetails(shipment);
                await fetchTrackingEvents(shipment.id);
            } else {
                // If not found, check in user's shipments
                const foundShipment = userShipments.find(s => 
                    s.id.includes(searchQuery.trim()) || 
                    s.tracking_number?.includes(searchQuery.trim())
                );
                
                if (foundShipment) {
                    setShipmentDetails(foundShipment);
                    await fetchTrackingEvents(foundShipment.id);
                } else {
                    Alert.alert('Not Found', 'No shipment found with this tracking number');
                }
            }
        } catch (error) {
            console.error('Error searching shipment:', error);
            Alert.alert('Error', 'Failed to search shipment');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrackingEvents = async (shipmentId: string) => {
        try {
            console.log('🔍 Fetching tracking events for shipment:', shipmentId);
            const response = await fetchAPI(`/tracking?shipmentId=${shipmentId}`);
            if (response.success) {
                const events = response.data || [];
                setTrackingEvents(events);
                console.log('✅ Found', events.length, 'tracking events');
            } else {
                console.log('⚠️ No tracking events found');
                setTrackingEvents([]);
            }
        } catch (error) {
            console.error('❌ Error fetching tracking events:', error);
            setTrackingEvents([]);
        }
    };

    const selectShipment = async (shipment: ShipmentDetails) => {
        setShipmentDetails(shipment);
        setSearchQuery(shipment.id.substring(0, 8));
        await fetchTrackingEvents(shipment.id);
    };

    const copyTrackingNumber = async () => {
        if (shipmentDetails) {
            const trackingId = shipmentDetails.tracking_number || shipmentDetails.id;
            await Clipboard.setStringAsync(trackingId);
            Alert.alert('Copied', 'Tracking number copied to clipboard');
        }
    };

    const callDriver = () => {
        if (shipmentDetails?.driver_phone) {
            Alert.alert(
                'Call Driver',
                `Call ${shipmentDetails.driver_name || 'Driver'}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Call', 
                        onPress: () => Linking.openURL(`tel:${shipmentDetails.driver_phone}`)
                    }
                ]
            );
        } else {
            Alert.alert('Info', 'Driver contact not available');
        }
    };

    const callCustomer = () => {
        if (shipmentDetails?.customer_phone) {
            Alert.alert(
                'Call Customer',
                `Call ${shipmentDetails.customer_name || 'Customer'}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Call', 
                        onPress: () => Linking.openURL(`tel:${shipmentDetails.customer_phone}`)
                    }
                ]
            );
        } else {
            Alert.alert('Info', 'Customer contact not available');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUserShipments();
        if (shipmentDetails) {
            await fetchTrackingEvents(shipmentDetails.id);
        }
        setRefreshing(false);
    }, [shipmentDetails]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FACC15';
            case 'assigned': return '#007AFF';
            case 'picked_up': return '#FF9500';
            case 'in_transit': return '#8B5CF6';
            case 'delivered': return '#10B981';
            case 'cancelled': return '#EF4444';
            default: return '#8E8E93';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={16} color="#FACC15" />;
            case 'assigned': return <User size={16} color="#007AFF" />;
            case 'picked_up': return <Package size={16} color="#FF9500" />;
            case 'in_transit': return <Truck size={16} color="#8B5CF6" />;
            case 'delivered': return <CheckCircle size={16} color="#10B981" />;
            case 'cancelled': return <AlertCircle size={16} color="#EF4444" />;
            default: return <Clock size={16} color="#8E8E93" />;
        }
    };

    const formatDateTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            })
        };
    };

    const renderTrackingEvent = (event: TrackingEvent, index: number) => {
        const isLast = index === trackingEvents.length - 1;
        const dateTime = formatDateTime(event.timestamp);

        return (
            <View key={event.id} style={styles.eventContainer}>
                <View style={styles.eventTimeline}>
                    <View style={[
                        styles.eventDot,
                        { backgroundColor: getStatusColor(event.status) }
                    ]}>
                        {getStatusIcon(event.status)}
                    </View>
                    {!isLast && <View style={styles.eventLine} />}
                </View>
                
                <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                        <Text style={styles.eventStatus}>
                            {event.status.replace('_', ' ').toUpperCase()}
                        </Text>
                        <Text style={styles.eventTime}>{dateTime.time}</Text>
                    </View>
                    <Text style={styles.eventDate}>{dateTime.date}</Text>
                    {event.notes && (
                        <Text style={styles.eventNotes}>{event.notes}</Text>
                    )}
                    {event.latitude && event.longitude && (
                        <TouchableOpacity
                            style={styles.locationButton}
                            onPress={() => {
                                const url = `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
                                Linking.openURL(url);
                            }}
                        >
                            <MapPin size={14} color="#007AFF" />
                            <Text style={styles.locationButtonText}>View Location</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderShipmentCard = (shipment: ShipmentDetails) => (
        <TouchableOpacity
            key={shipment.id}
            style={styles.shipmentCard}
            onPress={() => selectShipment(shipment)}
        >
            <View style={styles.shipmentHeader}>
                <Text style={styles.shipmentId}>#{shipment.id.substring(0, 8)}</Text>
                <View style={styles.shipmentStatus}>
                    {getStatusIcon(shipment.status)}
                    <Text style={[
                        styles.shipmentStatusText,
                        { color: getStatusColor(shipment.status) }
                    ]}>
                        {shipment.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>
            
            <View style={styles.shipmentRoute}>
                <View style={styles.routePoint}>
                    <MapPin size={14} color="#10B981" />
                    <Text style={styles.routeText} numberOfLines={1}>
                        {shipment.pickup_address}
                    </Text>
                </View>
                <View style={styles.routeArrow}>
                    <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={styles.routePoint}>
                    <MapPin size={14} color="#EF4444" />
                    <Text style={styles.routeText} numberOfLines={1}>
                        {shipment.delivery_address}
                    </Text>
                </View>
            </View>

            <View style={styles.shipmentFooter}>
                <Text style={styles.shipmentPackage}>{shipment.package_description}</Text>
                <Text style={styles.shipmentCost}>₹{shipment.estimated_cost}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderMapView = () => {
        if (!shipmentDetails || !trackingEvents.length) return null;

        const coordinates = trackingEvents
            .filter(event => event.latitude && event.longitude)
            .map(event => ({
                latitude: event.latitude,
                longitude: event.longitude
            }));

        if (coordinates.length === 0) return null;

        const centerLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
        const centerLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;

        // Prepare markers for our custom MapView
        const mapMarkers = [
            {
                id: 'pickup',
                latitude: shipmentDetails.pickup_latitude || centerLat,
                longitude: shipmentDetails.pickup_longitude || centerLng,
                title: 'Pickup Location',
                status: 'active' as const
            },
            {
                id: 'delivery',
                latitude: shipmentDetails.delivery_latitude || centerLat,
                longitude: shipmentDetails.delivery_longitude || centerLng,
                title: 'Delivery Location',
                status: 'pending' as const
            },
            ...trackingEvents
                .filter(event => event.latitude && event.longitude)
                .map((event, index) => ({
                    id: event.id,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    title: event.status.replace('_', ' ').toUpperCase(),
                    status: event.status === 'delivered' ? 'completed' as const : 
                           event.status === 'picked_up' ? 'active' as const : 'pending' as const
                }))
        ];

        return (
            <View style={styles.mapContainer}>
                <MapView
                    latitude={centerLat}
                    longitude={centerLng}
                    markers={mapMarkers}
                    height={400}
                    onMapReady={() => console.log('Tracking map ready!')}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Track Shipment</Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw 
                        size={20} 
                        color="#007AFF" 
                        style={refreshing ? { transform: [{ rotate: '360deg' }] } : {}}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Search Section */}
                <View style={styles.searchSection}>
                    <Text style={styles.sectionTitle}>Search Shipment</Text>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Search size={20} color="#8E8E93" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Enter tracking number or shipment ID"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={searchShipment}
                                returnKeyType="search"
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={searchShipment}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.searchButtonText}>Track</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My Shipments Section */}
                {userShipments.length > 0 && (
                    <View style={styles.shipmentsSection}>
                        <Text style={styles.sectionTitle}>
                            {userProfile?.role === 'transporter' ? 'My Deliveries' : 'My Shipments'} ({userShipments.length})
                        </Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.shipmentsScroll}
                        >
                            {userShipments.map(renderShipmentCard)}
                        </ScrollView>
                    </View>
                )}

                {/* Shipment Details */}
                {shipmentDetails && (
                    <View style={styles.detailsSection}>
                        <View style={styles.detailsHeader}>
                            <View>
                                <Text style={styles.trackingNumber}>
                                    #{shipmentDetails.tracking_number || shipmentDetails.id.substring(0, 8)}
                                </Text>
                                <View style={styles.statusContainer}>
                                    {getStatusIcon(shipmentDetails.status)}
                                    <Text style={[
                                        styles.statusText,
                                        { color: getStatusColor(shipmentDetails.status) }
                                    ]}>
                                        {shipmentDetails.status.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.headerActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={copyTrackingNumber}
                                >
                                    <Copy size={16} color="#007AFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => setShowMap(!showMap)}
                                >
                                    <Map size={16} color="#007AFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Route Information */}
                        <View style={styles.routeContainer}>
                            <View style={styles.routeItem}>
                                <MapPin size={16} color="#10B981" />
                                <View style={styles.routeDetails}>
                                    <Text style={styles.routeLabel}>From</Text>
                                    <Text style={styles.routeAddress}>{shipmentDetails.pickup_address}</Text>
                                </View>
                            </View>
                            <View style={styles.routeItem}>
                                <MapPin size={16} color="#EF4444" />
                                <View style={styles.routeDetails}>
                                    <Text style={styles.routeLabel}>To</Text>
                                    <Text style={styles.routeAddress}>{shipmentDetails.delivery_address}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Package Information */}
                        <View style={styles.packageContainer}>
                            <Text style={styles.packageTitle}>Package Details</Text>
                            <View style={styles.packageDetails}>
                                <View style={styles.packageItem}>
                                    <Package size={16} color="#8E8E93" />
                                    <Text style={styles.packageText}>{shipmentDetails.package_description}</Text>
                                </View>
                                <View style={styles.packageItem}>
                                    <User size={16} color="#8E8E93" />
                                    <Text style={styles.packageText}>{shipmentDetails.receiver_name}</Text>
                                </View>
                                {shipmentDetails.package_weight > 0 && (
                                    <View style={styles.packageMeta}>
                                        <Text style={styles.packageWeight}>{shipmentDetails.package_weight} kg</Text>
                                        <Text style={styles.packageCost}>₹{shipmentDetails.estimated_cost}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Contact Information */}
                        <View style={styles.contactContainer}>
                            {shipmentDetails.driver_name && (
                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={callDriver}
                                >
                                    <Phone size={16} color="#007AFF" />
                                    <Text style={styles.contactText}>Call Driver: {shipmentDetails.driver_name}</Text>
                                </TouchableOpacity>
                            )}
                            {userProfile?.role === 'transporter' && shipmentDetails.customer_name && (
                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={callCustomer}
                                >
                                    <Phone size={16} color="#007AFF" />
                                    <Text style={styles.contactText}>Call Customer: {shipmentDetails.customer_name}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Map View */}
                        {showMap && renderMapView()}

                        {/* Tracking Events */}
                        {trackingEvents.length > 0 && (
                            <View style={styles.trackingSection}>
                                <Text style={styles.sectionTitle}>Tracking History</Text>
                                <View style={styles.eventsContainer}>
                                    {trackingEvents.map(renderTrackingEvent)}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Empty State */}
                {!shipmentDetails && userShipments.length === 0 && (
                    <View style={styles.emptyState}>
                        <Package size={48} color="#8E8E93" />
                        <Text style={styles.emptyStateText}>
                            Enter a tracking number above or browse your shipments
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    refreshButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    searchSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000000',
        marginLeft: 12,
    },
    searchButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    shipmentsSection: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    shipmentsScroll: {
        paddingHorizontal: 20,
    },
    shipmentCard: {
        width: width * 0.7,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    shipmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    shipmentId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    shipmentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    shipmentStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    shipmentRoute: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    routeText: {
        fontSize: 12,
        color: '#000000',
        marginLeft: 8,
        flex: 1,
    },
    routeArrow: {
        alignItems: 'center',
        marginVertical: 4,
    },
    arrowText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    shipmentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shipmentPackage: {
        fontSize: 12,
        color: '#8E8E93',
        flex: 1,
    },
    shipmentCost: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    detailsSection: {
        padding: 20,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    trackingNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F0F9FF',
    },
    routeContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    routeDetails: {
        marginLeft: 12,
        flex: 1,
    },
    routeLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 2,
    },
    routeAddress: {
        fontSize: 14,
        color: '#000000',
        lineHeight: 20,
    },
    packageContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    packageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },
    packageDetails: {
        gap: 8,
    },
    packageItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    packageText: {
        fontSize: 14,
        color: '#000000',
        marginLeft: 12,
        flex: 1,
    },
    packageMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    packageWeight: {
        fontSize: 12,
        color: '#8E8E93',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    packageCost: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
    },
    contactContainer: {
        gap: 8,
        marginBottom: 16,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
    },
    contactText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    mapContainer: {
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    map: {
        flex: 1,
    },
    customMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    markerText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    trackingSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
    },
    eventsContainer: {
        paddingTop: 8,
    },
    eventContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    eventTimeline: {
        alignItems: 'center',
        marginRight: 16,
    },
    eventDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    eventLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E5EA',
        marginTop: 8,
    },
    eventContent: {
        flex: 1,
        paddingTop: 4,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventStatus: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
    },
    eventTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    eventDate: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 4,
    },
    eventNotes: {
        fontSize: 14,
        color: '#000000',
        lineHeight: 20,
        marginBottom: 8,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationButtonText: {
        fontSize: 12,
        color: '#007AFF',
        textDecorationLine: 'underline',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
});

export default TrackingScreen;