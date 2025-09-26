import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    TextInput,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
    Package,
    Plus,
    Search,
    Filter,
    MapPin,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    Phone,
    Navigation,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

const { width } = Dimensions.get('window');

interface Shipment {
    id: string;
    tracking_number?: string;
    status: string;
    pickup_address: string;
    delivery_address: string;
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
    preferred_pickup_time?: string;
    shipment_type: string;
}

const ShipmentsScreen = () => {
    const { user } = useUser();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userProfile) {
            fetchShipments();
        }
    }, [userProfile]);

    useEffect(() => {
        filterShipments();
    }, [shipments, searchQuery, activeFilter]);

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

    const fetchShipments = async () => {
        if (!userProfile) return;

        try {
            setLoading(true);
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
                    setShipments(response.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching shipments:', error);
            Alert.alert('Error', 'Failed to fetch shipments');
        } finally {
            setLoading(false);
        }
    };

    const filterShipments = () => {
        let filtered = [...shipments];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(shipment =>
                shipment.id.toLowerCase().includes(query) ||
                shipment.tracking_number?.toLowerCase().includes(query) ||
                shipment.pickup_address.toLowerCase().includes(query) ||
                shipment.delivery_address.toLowerCase().includes(query) ||
                shipment.receiver_name.toLowerCase().includes(query) ||
                shipment.package_description.toLowerCase().includes(query)
            );
        }

        // Filter by status
        if (activeFilter !== 'all') {
            filtered = filtered.filter(shipment => shipment.status === activeFilter);
        }

        setFilteredShipments(filtered);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchShipments();
        setRefreshing(false);
    }, [fetchShipments]);

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
            case 'assigned': return <Truck size={16} color="#007AFF" />;
            case 'picked_up': return <Package size={16} color="#FF9500" />;
            case 'in_transit': return <Navigation size={16} color="#8B5CF6" />;
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

    const handleShipmentAction = (shipment: Shipment, action: string) => {
        switch (action) {
            case 'view':
                router.push({
                    pathname: '/(root)/(tabs)/tracking',
                    params: { shipmentId: shipment.id }
                });
                break;
            case 'call_driver':
                if (shipment.driver_phone) {
                    Alert.alert(
                        'Call Driver',
                        `Call ${shipment.driver_name || 'Driver'}?`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                                text: 'Call', 
                                onPress: () => {
                                    // In a real app, use Linking.openURL(`tel:${shipment.driver_phone}`)
                                    Alert.alert('Calling', `Would call ${shipment.driver_phone}`);
                                }
                            }
                        ]
                    );
                } else {
                    Alert.alert('Info', 'Driver contact not available');
                }
                break;
            case 'call_customer':
                if (shipment.customer_phone) {
                    Alert.alert(
                        'Call Customer',
                        `Call ${shipment.customer_name || 'Customer'}?`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                                text: 'Call', 
                                onPress: () => {
                                    Alert.alert('Calling', `Would call ${shipment.customer_phone}`);
                                }
                            }
                        ]
                    );
                } else {
                    Alert.alert('Info', 'Customer contact not available');
                }
                break;
            case 'cancel':
                Alert.alert(
                    'Cancel Shipment',
                    'Are you sure you want to cancel this shipment?',
                    [
                        { text: 'No', style: 'cancel' },
                        {
                            text: 'Yes',
                            style: 'destructive',
                            onPress: async () => {
                                try {
                                    const response = await fetchAPI(`/shipments/${shipment.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ 
                                            status: 'cancelled',
                                            updated_at: new Date().toISOString()
                                        })
                                    });

                                    if (response.success) {
                                        Alert.alert('Success', 'Shipment cancelled');
                                        fetchShipments();
                                    } else {
                                        Alert.alert('Error', 'Failed to cancel shipment');
                                    }
                                } catch (error) {
                                    Alert.alert('Error', 'Failed to cancel shipment');
                                }
                            }
                        }
                    ]
                );
                break;
            case 'edit':
                router.push({
                    pathname: '/(root)/(tabs)/create-shipment',
                    params: { editShipmentId: shipment.id }
                });
                break;
        }
    };

    const getFilterCount = (status: string) => {
        if (status === 'all') return shipments.length;
        return shipments.filter(s => s.status === status).length;
    };

    const renderFilterChip = (status: string, label: string) => (
        <TouchableOpacity
            key={status}
            style={[
                styles.filterChip,
                activeFilter === status && styles.filterChipActive
            ]}
            onPress={() => setActiveFilter(status)}
        >
            <Text style={[
                styles.filterChipText,
                activeFilter === status && styles.filterChipTextActive
            ]}>
                {label} ({getFilterCount(status)})
            </Text>
        </TouchableOpacity>
    );

    const renderShipmentCard = (shipment: Shipment) => {
        const dateTime = formatDateTime(shipment.created_at);
        const canCancel = ['pending', 'assigned'].includes(shipment.status);
        const canEdit = shipment.status === 'pending';
        
        return (
            <View key={shipment.id} style={styles.shipmentCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.shipmentId}>
                            #{shipment.tracking_number || shipment.id.substring(0, 8)}
                        </Text>
                        <View style={styles.statusContainer}>
                            {getStatusIcon(shipment.status)}
                            <Text style={[
                                styles.statusText,
                                { color: getStatusColor(shipment.status) }
                            ]}>
                                {shipment.status.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.costText}>₹{shipment.estimated_cost}</Text>
                        <Text style={styles.dateText}>{dateTime.date}</Text>
                    </View>
                </View>

                {/* Route */}
                <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                        <MapPin size={14} color="#10B981" />
                        <Text style={styles.routeText} numberOfLines={2}>
                            {shipment.pickup_address}
                        </Text>
                    </View>
                    <View style={styles.routeArrow}>
                        <Text style={styles.arrowText}>↓</Text>
                    </View>
                    <View style={styles.routePoint}>
                        <MapPin size={14} color="#EF4444" />
                        <Text style={styles.routeText} numberOfLines={2}>
                            {shipment.delivery_address}
                        </Text>
                    </View>
                </View>

                {/* Package Info */}
                <View style={styles.packageInfo}>
                    <View style={styles.packageRow}>
                        <Package size={14} color="#8E8E93" />
                        <Text style={styles.packageText}>{shipment.package_description}</Text>
                    </View>
                    <View style={styles.packageRow}>
                        <Text style={styles.receiverText}>To: {shipment.receiver_name}</Text>
                        {shipment.package_weight > 0 && (
                            <Text style={styles.weightText}>{shipment.package_weight} kg</Text>
                        )}
                    </View>
                </View>

                {/* Driver/Customer Info */}
                {(shipment.driver_name || shipment.customer_name) && (
                    <View style={styles.contactInfo}>
                        {shipment.driver_name && (
                            <Text style={styles.contactText}>
                                Driver: {shipment.driver_name}
                            </Text>
                        )}
                        {userProfile?.role === 'transporter' && shipment.customer_name && (
                            <Text style={styles.contactText}>
                                Customer: {shipment.customer_name}
                            </Text>
                        )}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleShipmentAction(shipment, 'view')}
                    >
                        <Eye size={16} color="#007AFF" />
                        <Text style={styles.actionButtonText}>View</Text>
                    </TouchableOpacity>

                    {shipment.driver_phone && userProfile?.role !== 'transporter' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleShipmentAction(shipment, 'call_driver')}
                        >
                            <Phone size={16} color="#007AFF" />
                            <Text style={styles.actionButtonText}>Call Driver</Text>
                        </TouchableOpacity>
                    )}

                    {shipment.customer_phone && userProfile?.role === 'transporter' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleShipmentAction(shipment, 'call_customer')}
                        >
                            <Phone size={16} color="#007AFF" />
                            <Text style={styles.actionButtonText}>Call Customer</Text>
                        </TouchableOpacity>
                    )}

                    {canEdit && userProfile?.role !== 'transporter' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleShipmentAction(shipment, 'edit')}
                        >
                            <Edit size={16} color="#FF9500" />
                            <Text style={[styles.actionButtonText, { color: '#FF9500' }]}>Edit</Text>
                        </TouchableOpacity>
                    )}

                    {canCancel && userProfile?.role !== 'transporter' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleShipmentAction(shipment, 'cancel')}
                        >
                            <Trash2 size={16} color="#EF4444" />
                            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    if (!userProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {userProfile.role === 'transporter' ? 'My Deliveries' : 'My Shipments'}
                </Text>
                <View style={styles.headerActions}>
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
                    {userProfile.role !== 'transporter' && (
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/(root)/(tabs)/create-shipment')}
                        >
                            <Plus size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Search size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search shipments..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Filters */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                {renderFilterChip('all', 'All')}
                {renderFilterChip('pending', 'Pending')}
                {renderFilterChip('assigned', 'Assigned')}
                {renderFilterChip('picked_up', 'Picked Up')}
                {renderFilterChip('in_transit', 'In Transit')}
                {renderFilterChip('delivered', 'Delivered')}
                {renderFilterChip('cancelled', 'Cancelled')}
            </ScrollView>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Loading shipments...</Text>
                    </View>
                ) : filteredShipments.length > 0 ? (
                    <View style={styles.shipmentsList}>
                        {filteredShipments.map(renderShipmentCard)}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Package size={48} color="#8E8E93" />
                        <Text style={styles.emptyStateTitle}>
                            {searchQuery || activeFilter !== 'all' ? 'No matching shipments' : 'No shipments yet'}
                        </Text>
                        <Text style={styles.emptyStateText}>
                            {searchQuery || activeFilter !== 'all' 
                                ? 'Try adjusting your search or filters'
                                : userProfile.role === 'transporter' 
                                    ? 'Accept some jobs to see them here'
                                    : 'Create your first shipment to get started'
                            }
                        </Text>
                        {!searchQuery && activeFilter === 'all' && userProfile.role !== 'transporter' && (
                            <TouchableOpacity
                                style={styles.createShipmentButton}
                                onPress={() => router.push('/(root)/(tabs)/create-shipment')}
                            >
                                <Plus size={20} color="#FFFFFF" />
                                <Text style={styles.createShipmentButtonText}>Create Shipment</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
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
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    refreshButton: {
        padding: 8,
    },
    createButton: {
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 8,
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    searchInputContainer: {
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
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    filtersContent: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
    },
    filterChipActive: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF',
    },
    filterChipText: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 12,
    },
    shipmentsList: {
        padding: 20,
        gap: 16,
    },
    shipmentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    shipmentId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    costText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    routeContainer: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    routeText: {
        fontSize: 14,
        color: '#000000',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    routeArrow: {
        alignItems: 'center',
        marginVertical: 4,
    },
    arrowText: {
        fontSize: 16,
        color: '#8E8E93',
    },
    packageInfo: {
        marginBottom: 12,
    },
    packageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    packageText: {
        fontSize: 14,
        color: '#000000',
        marginLeft: 8,
        flex: 1,
    },
    receiverText: {
        fontSize: 12,
        color: '#8E8E93',
        flex: 1,
    },
    weightText: {
        fontSize: 12,
        color: '#8E8E93',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    contactInfo: {
        marginBottom: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    contactText: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 2,
    },
    cardActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F0F9FF',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    createShipmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    createShipmentButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ShipmentsScreen;