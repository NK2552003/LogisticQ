import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Dimensions,
} from 'react-native';
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
    Copy
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface TrackingEvent {
    id: string;
    status: string;
    description: string;
    location: string;
    timestamp: string;
    isCompleted: boolean;
    isCurrent: boolean;
}

interface ShipmentDetails {
    trackingNumber: string;
    status: 'in-transit' | 'delivered' | 'pending' | 'delayed';
    origin: string;
    destination: string;
    estimatedDelivery: string;
    actualDelivery?: string;
    recipient: string;
    phone: string;
    weight: string;
    dimensions: string;
    service: string;
}

const TrackingScreen = () => {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [isTracking, setIsTracking] = useState(false);

    // Sample tracking data
    const shipmentDetails: ShipmentDetails = {
        trackingNumber: 'LQ2024001234567',
        status: 'in-transit',
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        estimatedDelivery: 'Dec 28, 2024 by 6:00 PM',
        recipient: 'Sarah Johnson',
        phone: '+1 (555) 123-4567',
        weight: '2.5 lbs',
        dimensions: '12" x 8" x 4"',
        service: 'Express Delivery'
    };

    const trackingEvents: TrackingEvent[] = [
        {
            id: '1',
            status: 'Package Received',
            description: 'Your package has been received at our facility',
            location: 'New York Distribution Center',
            timestamp: 'Dec 25, 2024 at 2:30 PM',
            isCompleted: true,
            isCurrent: false
        },
        {
            id: '2',
            status: 'In Transit',
            description: 'Package is on its way to the destination',
            location: 'Philadelphia, PA',
            timestamp: 'Dec 26, 2024 at 8:15 AM',
            isCompleted: true,
            isCurrent: false
        },
        {
            id: '3',
            status: 'Out for Delivery',
            description: 'Package is out for delivery',
            location: 'Los Angeles Distribution Center',
            timestamp: 'Dec 27, 2024 at 9:00 AM',
            isCompleted: false,
            isCurrent: true
        },
        {
            id: '4',
            status: 'Delivered',
            description: 'Package delivered to recipient',
            location: 'Los Angeles, CA',
            timestamp: 'Estimated: Dec 28, 2024 by 6:00 PM',
            isCompleted: false,
            isCurrent: false
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return '#34C759';
            case 'in-transit': return '#007AFF';
            case 'delayed': return '#FF9500';
            case 'pending': return '#8E8E93';
            default: return '#8E8E93';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <CheckCircle size={20} color="#34C759" />;
            case 'in-transit': return <Truck size={20} color="#007AFF" />;
            case 'delayed': return <AlertCircle size={20} color="#FF9500" />;
            case 'pending': return <Clock size={20} color="#8E8E93" />;
            default: return <Package size={20} color="#8E8E93" />;
        }
    };

    const handleTrack = () => {
        if (trackingNumber.trim()) {
            setIsTracking(true);
        }
    };

    const copyTrackingNumber = () => {
        // Copy to clipboard functionality would go here
        console.log('Copied to clipboard:', shipmentDetails.trackingNumber);
    };

    const renderTrackingEvent = (event: TrackingEvent, index: number) => (
        <View key={event.id} style={styles.timelineItem}>
            <View style={styles.timelineIndicator}>
                <View style={[
                    styles.timelineCircle,
                    {
                        backgroundColor: event.isCompleted ? '#007AFF' : 
                                        event.isCurrent ? '#007AFF' : '#E5E5EA'
                    }
                ]}>
                    {event.isCompleted && (
                        <CheckCircle size={12} color="#FFFFFF" />
                    )}
                    {event.isCurrent && !event.isCompleted && (
                        <View style={styles.currentIndicator} />
                    )}
                </View>
                {index < trackingEvents.length - 1 && (
                    <View style={[
                        styles.timelineLine,
                        { backgroundColor: event.isCompleted ? '#007AFF' : '#E5E5EA' }
                    ]} />
                )}
            </View>
            
            <View style={styles.timelineContent}>
                <Text style={[
                    styles.eventStatus,
                    { color: event.isCompleted || event.isCurrent ? '#000000' : '#8E8E93' }
                ]}>
                    {event.status}
                </Text>
                <Text style={[
                    styles.eventDescription,
                    { color: event.isCompleted || event.isCurrent ? '#8E8E93' : '#C7C7CC' }
                ]}>
                    {event.description}
                </Text>
                <View style={styles.eventDetails}>
                    <View style={styles.eventDetail}>
                        <MapPin size={12} color="#8E8E93" />
                        <Text style={styles.eventDetailText}>{event.location}</Text>
                    </View>
                    <View style={styles.eventDetail}>
                        <Calendar size={12} color="#8E8E93" />
                        <Text style={styles.eventDetailText}>{event.timestamp}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (!isTracking) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Track Shipment</Text>
                </View>
                
                <View style={styles.searchContainer}>
                    <Text style={styles.searchTitle}>Enter Tracking Number</Text>
                    <Text style={styles.searchSubtitle}>
                        Enter your tracking number to get real-time updates
                    </Text>
                    
                    <View style={styles.searchInputContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="e.g., LQ2024001234567"
                            value={trackingNumber}
                            onChangeText={setTrackingNumber}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity style={styles.searchButton} onPress={handleTrack}>
                            <Search size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.sampleButton}
                        onPress={() => {
                            setTrackingNumber('LQ2024001234567');
                            setIsTracking(true);
                        }}
                    >
                        <Text style={styles.sampleButtonText}>Try Sample Tracking</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.featuresContainer}>
                    <Text style={styles.featuresTitle}>Track with Confidence</Text>
                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Navigation size={24} color="#007AFF" />
                            <Text style={styles.featureText}>Real-time GPS tracking</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Clock size={24} color="#007AFF" />
                            <Text style={styles.featureText}>Accurate delivery estimates</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <CheckCircle size={24} color="#007AFF" />
                            <Text style={styles.featureText}>Delivery confirmation</Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setIsTracking(false)}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tracking Details</Text>
                    <View style={{ width: 50 }} />
                </View>

                {/* Tracking Number */}
                <View style={styles.trackingNumberContainer}>
                    <Text style={styles.trackingNumberLabel}>Tracking Number</Text>
                    <View style={styles.trackingNumberRow}>
                        <Text style={styles.trackingNumber}>{shipmentDetails.trackingNumber}</Text>
                        <TouchableOpacity style={styles.copyButton} onPress={copyTrackingNumber}>
                            <Copy size={16} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        {getStatusIcon(shipmentDetails.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(shipmentDetails.status) }]}>
                            {shipmentDetails.status.replace('-', ' ').toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.estimatedDelivery}>
                        Estimated Delivery: {shipmentDetails.estimatedDelivery}
                    </Text>
                </View>

                {/* Route Info */}
                <View style={styles.routeContainer}>
                    <View style={styles.routeItem}>
                        <View style={styles.routePoint}>
                            <View style={styles.originPoint} />
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeLabel}>From</Text>
                            <Text style={styles.routeLocation}>{shipmentDetails.origin}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.routeLine} />
                    
                    <View style={styles.routeItem}>
                        <View style={styles.routePoint}>
                            <View style={styles.destinationPoint} />
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeLabel}>To</Text>
                            <Text style={styles.routeLocation}>{shipmentDetails.destination}</Text>
                        </View>
                    </View>
                </View>

                {/* Shipment Details */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.sectionTitle}>Shipment Details</Text>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <User size={16} color="#8E8E93" />
                            <Text style={styles.detailLabel}>Recipient</Text>
                            <Text style={styles.detailValue}>{shipmentDetails.recipient}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Phone size={16} color="#8E8E93" />
                            <Text style={styles.detailLabel}>Phone</Text>
                            <Text style={styles.detailValue}>{shipmentDetails.phone}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Package size={16} color="#8E8E93" />
                            <Text style={styles.detailLabel}>Weight</Text>
                            <Text style={styles.detailValue}>{shipmentDetails.weight}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Package size={16} color="#8E8E93" />
                            <Text style={styles.detailLabel}>Service</Text>
                            <Text style={styles.detailValue}>{shipmentDetails.service}</Text>
                        </View>
                    </View>
                </View>

                {/* Tracking Timeline */}
                <View style={styles.timelineContainer}>
                    <Text style={styles.sectionTitle}>Tracking History</Text>
                    <View style={styles.timeline}>
                        {trackingEvents.map(renderTrackingEvent)}
                    </View>
                </View>

                {/* Bottom Padding */}
                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    scrollView: {
        flex: 1,
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
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    backButton: {
        fontSize: 16,
        color: '#007AFF',
    },
    searchContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    searchTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 8,
        textAlign: 'center',
    },
    searchSubtitle: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    searchInputContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        marginRight: 12,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sampleButton: {
        paddingVertical: 12,
    },
    sampleButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    featuresContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        marginTop: 20,
    },
    featuresTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 20,
        textAlign: 'center',
    },
    featuresList: {
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#000000',
    },
    trackingNumberContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    trackingNumberLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 8,
    },
    trackingNumberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    trackingNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        fontFamily: 'monospace',
    },
    copyButton: {
        padding: 8,
    },
    statusCard: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    estimatedDelivery: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
    },
    routeContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routePoint: {
        width: 20,
        alignItems: 'center',
        marginRight: 12,
    },
    originPoint: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34C759',
    },
    destinationPoint: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF9500',
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E5E5EA',
        marginLeft: 18,
        marginVertical: 8,
    },
    routeInfo: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 2,
    },
    routeLocation: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    detailsContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 16,
    },
    detailsGrid: {
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginLeft: 4,
        width: 80,
    },
    detailValue: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
        flex: 1,
    },
    timelineContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    timeline: {
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timelineIndicator: {
        alignItems: 'center',
        marginRight: 16,
    },
    timelineCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    timelineLine: {
        width: 2,
        height: 40,
        marginTop: 4,
    },
    timelineContent: {
        flex: 1,
    },
    eventStatus: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    eventDescription: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 18,
    },
    eventDetails: {
        gap: 4,
    },
    eventDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    eventDetailText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    bottomPadding: {
        height: 100,
    },
});

export default TrackingScreen;