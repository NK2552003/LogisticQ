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
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import {
    Briefcase,
    MapPin,
    Clock,
    DollarSign,
    Package,
    Navigation,
    Phone,
    User,
    CheckCircle,
    XCircle,
    Truck,
    AlertCircle,
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

const { width } = Dimensions.get('window');

interface Job {
    id: string;
    pickup_address: string;
    delivery_address: string;
    pickup_latitude: number;
    pickup_longitude: number;
    delivery_latitude: number;
    delivery_longitude: number;
    package_description: string;
    package_weight: number;
    estimated_cost: number;
    status: string;
    preferred_pickup_time: string;
    receiver_name: string;
    receiver_phone: string;
    special_instructions: string;
    shipment_type: string;
    customer_name: string;
    customer_phone: string;
    distance?: number;
    created_at: string;
}

const JobsScreen = () => {
    const { user } = useUser();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
    const [myJobs, setMyJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'available' | 'my-jobs'>('available');
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        fetchUserProfile();
        getCurrentLocation();
    }, []);

    useEffect(() => {
        if (userProfile) {
            fetchJobs();
        }
    }, [userProfile, activeTab]);

    const fetchUserProfile = async () => {
        if (!user?.id) return;

        try {
            console.log('🔍 Fetching user profile for:', user.id);
            const response = await fetchAPI(`/user?clerkUserId=${user.id}`);
            
            if (response.user) {
                setUserProfile(response.user);
                console.log('✅ User profile loaded:', response.user.role);
                
                // Check if transporter is online
                if (response.user.role === 'transporter') {
                    console.log('🚛 Fetching transporter profile for user:', response.user.id);
                    try {
                        const profileResponse = await fetchAPI(`/user/transporter-profile?userId=${response.user.id}`);
                        if (profileResponse.success && profileResponse.data) {
                            setIsOnline(profileResponse.data.is_available || false);
                            console.log('✅ Transporter status:', profileResponse.data.is_available ? 'ONLINE' : 'OFFLINE');
                        } else {
                            console.log('⚠️ No transporter profile found - user might need to complete profile setup');
                            setIsOnline(false);
                            // Don't show error, just keep offline status
                        }
                    } catch (profileError) {
                        console.log('⚠️ Error fetching transporter profile:', profileError);
                        setIsOnline(false);
                        // Profile might not exist yet, this is ok for new users
                    }
                }
            } else {
                console.log('⚠️ No user found in response');
            }
        } catch (error) {
            console.error('❌ Error fetching user profile:', error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to show nearby jobs');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setCurrentLocation(location);
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const fetchJobs = async () => {
        if (!userProfile) return;

        try {
            setLoading(true);
            console.log('🔍 Fetching jobs for tab:', activeTab);
            
            if (activeTab === 'available') {
                // Fetch available jobs (not assigned to any driver)
                console.log('📦 Fetching available jobs...');
                const response = await fetchAPI('/shipments?status=pending&unassigned=true');
                let jobs = response.success ? (response.data || []) : [];
                
                console.log('✅ Found', jobs.length, 'available jobs');
                
                // Calculate distance for each job if we have current location
                if (currentLocation && jobs.length > 0) {
                    jobs = jobs.map((job: Job) => ({
                        ...job,
                        distance: calculateDistance(
                            currentLocation.coords.latitude,
                            currentLocation.coords.longitude,
                            job.pickup_latitude,
                            job.pickup_longitude
                        )
                    }));
                    
                    // Sort by distance
                    jobs.sort((a: Job, b: Job) => (a.distance || 0) - (b.distance || 0));
                    console.log('📍 Jobs sorted by distance');
                }
                
                setAvailableJobs(jobs);
            } else {
                // Fetch my accepted jobs
                console.log('🚛 Fetching my jobs for driver:', userProfile.id);
                const response = await fetchAPI(`/shipments?driverId=${userProfile.id}&status=assigned,picked_up,in_transit`);
                const jobs = response.success ? (response.data || []) : [];
                console.log('✅ Found', jobs.length, 'my jobs');
                setMyJobs(jobs);
            }
        } catch (error) {
            console.error('❌ Error fetching jobs:', error);
            // Set empty arrays on error to prevent UI issues
            if (activeTab === 'available') {
                setAvailableJobs([]);
            } else {
                setMyJobs([]);
            }
        } finally {
            setLoading(false);
        }
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
        return R * c; // Distance in kilometers
    };

    const toggleOnlineStatus = async () => {
        try {
            const newStatus = !isOnline;
            const response = await fetchAPI('/user/transporter-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userProfile.id,
                    is_available: newStatus,
                    current_latitude: currentLocation?.coords.latitude,
                    current_longitude: currentLocation?.coords.longitude,
                })
            });

            if (response.success) {
                setIsOnline(newStatus);
                Alert.alert(
                    'Status Updated',
                    `You are now ${newStatus ? 'online and available for jobs' : 'offline'}`
                );
                
                if (newStatus) {
                    fetchJobs(); // Refresh jobs when going online
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const acceptJob = async (jobId: string) => {
        try {
            Alert.alert(
                'Accept Job',
                'Are you sure you want to accept this job?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Accept',
                        onPress: async () => {
                            const response = await fetchAPI(`/shipments/${jobId}/accept`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    driverId: userProfile.id,
                                    status: 'assigned'
                                })
                            });

                            if (response.success) {
                                Alert.alert('Success', 'Job accepted! Navigate to "My Jobs" to view details.');
                                fetchJobs(); // Refresh available jobs
                            } else {
                                Alert.alert('Error', response.error || 'Failed to accept job');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to accept job');
        }
    };

    const updateJobStatus = async (jobId: string, newStatus: string) => {
        try {
            const response = await fetchAPI(`/shipments/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
            });

            if (response.success) {
                Alert.alert('Success', `Job status updated to ${newStatus}`);
                fetchJobs(); // Refresh jobs
                
                // Update tracking
                if (currentLocation) {
                    await fetchAPI('/tracking', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            shipmentId: jobId,
                            latitude: currentLocation.coords.latitude,
                            longitude: currentLocation.coords.longitude,
                            status: newStatus,
                            notes: `Status updated to ${newStatus}`
                        })
                    });
                }
            } else {
                Alert.alert('Error', response.error || 'Failed to update job status');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update job status');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchJobs();
        setRefreshing(false);
    }, [fetchJobs]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const renderJobCard = (job: Job, isMyJob: boolean = false) => (
        <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                    <Text style={styles.jobId}>#{job.id.substring(0, 8)}</Text>
                    <View style={styles.statusContainer}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(job.status) }
                        ]} />
                        <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.jobPrice}>
                    <Text style={styles.priceText}>₹{job.estimated_cost}</Text>
                    {job.distance && (
                        <Text style={styles.distanceText}>{job.distance.toFixed(1)} km</Text>
                    )}
                </View>
            </View>

            <View style={styles.addressContainer}>
                <View style={styles.addressRow}>
                    <MapPin size={16} color="#10B981" />
                    <Text style={styles.addressText} numberOfLines={2}>
                        {job.pickup_address}
                    </Text>
                </View>
                <View style={styles.addressDivider} />
                <View style={styles.addressRow}>
                    <MapPin size={16} color="#EF4444" />
                    <Text style={styles.addressText} numberOfLines={2}>
                        {job.delivery_address}
                    </Text>
                </View>
            </View>

            <View style={styles.packageInfo}>
                <View style={styles.packageRow}>
                    <Package size={16} color="#8E8E93" />
                    <Text style={styles.packageText}>{job.package_description}</Text>
                </View>
                <View style={styles.packageRow}>
                    <User size={16} color="#8E8E93" />
                    <Text style={styles.packageText}>{job.receiver_name}</Text>
                </View>
                {job.package_weight > 0 && (
                    <View style={styles.packageRow}>
                        <Text style={styles.weightText}>{job.package_weight} kg</Text>
                        <Text style={styles.typeText}>{job.shipment_type}</Text>
                    </View>
                )}
            </View>

            <View style={styles.timeInfo}>
                <Clock size={16} color="#8E8E93" />
                <Text style={styles.timeText}>
                    Created: {formatDate(job.created_at)} at {formatTime(job.created_at)}
                </Text>
            </View>

            {!isMyJob ? (
                // Available job actions
                <View style={styles.jobActions}>
                    <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => {
                            // Show job details in map view
                            Alert.alert(
                                'Job Details',
                                `Package: ${job.package_description}\nFrom: ${job.pickup_address}\nTo: ${job.delivery_address}\nReceiver: ${job.receiver_name}\nPhone: ${job.receiver_phone}${job.special_instructions ? `\nInstructions: ${job.special_instructions}` : ''}`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Accept Job', onPress: () => acceptJob(job.id) }
                                ]
                            );
                        }}
                    >
                        <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => acceptJob(job.id)}
                    >
                        <CheckCircle size={20} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // My job actions
                <View style={styles.jobActions}>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => {
                            Alert.alert(
                                'Contact Customer',
                                `Call ${job.customer_name}?`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { 
                                        text: 'Call', 
                                        onPress: () => {
                                            // In a real app, you'd use Linking.openURL(`tel:${job.customer_phone}`)
                                            Alert.alert('Calling', `Would call ${job.customer_phone}`);
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <Phone size={20} color="#007AFF" />
                    </TouchableOpacity>
                    
                    {job.status === 'assigned' && (
                        <TouchableOpacity
                            style={styles.statusButton}
                            onPress={() => updateJobStatus(job.id, 'picked_up')}
                        >
                            <Text style={styles.statusButtonText}>Mark Picked Up</Text>
                        </TouchableOpacity>
                    )}
                    
                    {job.status === 'picked_up' && (
                        <TouchableOpacity
                            style={styles.statusButton}
                            onPress={() => updateJobStatus(job.id, 'in_transit')}
                        >
                            <Text style={styles.statusButtonText}>Start Delivery</Text>
                        </TouchableOpacity>
                    )}
                    
                    {job.status === 'in_transit' && (
                        <TouchableOpacity
                            style={[styles.statusButton, styles.deliverButton]}
                            onPress={() => updateJobStatus(job.id, 'delivered')}
                        >
                            <Text style={styles.deliverButtonText}>Mark Delivered</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.navigateButton}
                        onPress={() => {
                            // In a real app, you'd open maps navigation
                            const destination = job.status === 'assigned' ? 
                                `${job.pickup_latitude},${job.pickup_longitude}` :
                                `${job.delivery_latitude},${job.delivery_longitude}`;
                            Alert.alert('Navigation', `Would navigate to: ${destination}`);
                        }}
                    >
                        <Navigation size={20} color="#FFFFFF" />
                        <Text style={styles.navigateButtonText}>Navigate</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

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

    if (userProfile?.role !== 'transporter') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.unauthorizedContainer}>
                    <AlertCircle size={48} color="#EF4444" />
                    <Text style={styles.unauthorizedText}>
                        Jobs are only available for transporters
                    </Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Jobs</Text>
                <TouchableOpacity
                    style={[
                        styles.onlineToggle,
                        isOnline && styles.onlineToggleActive
                    ]}
                    onPress={toggleOnlineStatus}
                >
                    <View style={[
                        styles.onlineDot,
                        isOnline && styles.onlineDotActive
                    ]} />
                    <Text style={[
                        styles.onlineText,
                        isOnline && styles.onlineTextActive
                    ]}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'available' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('available')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'available' && styles.activeTabText
                    ]}>
                        Available Jobs ({availableJobs.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'my-jobs' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('my-jobs')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'my-jobs' && styles.activeTabText
                    ]}>
                        My Jobs ({myJobs.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#007AFF']}
                        tintColor="#007AFF"
                    />
                }
            >
                {!isOnline && activeTab === 'available' && (
                    <View style={styles.offlineWarning}>
                        <AlertCircle size={20} color="#FF9500" />
                        <Text style={styles.offlineWarningText}>
                            You're offline. Go online to see available jobs.
                        </Text>
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Loading jobs...</Text>
                    </View>
                ) : (
                    <View style={styles.jobsList}>
                        {activeTab === 'available' ? (
                            availableJobs.length > 0 ? (
                                availableJobs.map(job => renderJobCard(job, false))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Briefcase size={48} color="#8E8E93" />
                                    <Text style={styles.emptyStateText}>
                                        {isOnline ? 'No jobs available at the moment' : 'Go online to see available jobs'}
                                    </Text>
                                </View>
                            )
                        ) : (
                            myJobs.length > 0 ? (
                                myJobs.map(job => renderJobCard(job, true))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Truck size={48} color="#8E8E93" />
                                    <Text style={styles.emptyStateText}>
                                        No active jobs. Accept some jobs to get started!
                                    </Text>
                                </View>
                            )
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
    onlineToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    onlineToggleActive: {
        backgroundColor: '#E8F5E8',
        borderColor: '#10B981',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#8E8E93',
        marginRight: 6,
    },
    onlineDotActive: {
        backgroundColor: '#10B981',
    },
    onlineText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    onlineTextActive: {
        color: '#10B981',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#8E8E93',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    offlineWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
    },
    offlineWarningText: {
        fontSize: 14,
        color: '#FF9500',
        marginLeft: 8,
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 12,
    },
    jobsList: {
        paddingBottom: 20,
    },
    jobCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 3,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    jobInfo: {
        flex: 1,
    },
    jobId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
    },
    jobPrice: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    distanceText: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    addressContainer: {
        marginBottom: 12,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 4,
    },
    addressText: {
        fontSize: 14,
        color: '#000000',
        marginLeft: 8,
        flex: 1,
    },
    addressDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#E5E5EA',
        marginLeft: 8,
        marginVertical: 4,
    },
    packageInfo: {
        marginBottom: 12,
    },
    packageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    packageText: {
        fontSize: 14,
        color: '#8E8E93',
        marginLeft: 8,
        flex: 1,
    },
    weightText: {
        fontSize: 12,
        color: '#8E8E93',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 8,
    },
    typeText: {
        fontSize: 12,
        color: '#007AFF',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    timeText: {
        fontSize: 12,
        color: '#8E8E93',
        marginLeft: 8,
    },
    jobActions: {
        flexDirection: 'row',
        gap: 8,
    },
    viewButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        alignItems: 'center',
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
        gap: 6,
    },
    acceptButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    callButton: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    deliverButton: {
        backgroundColor: '#10B981',
    },
    deliverButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#8B5CF6',
        gap: 6,
    },
    navigateButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
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
    unauthorizedContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unauthorizedText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 16,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default JobsScreen;