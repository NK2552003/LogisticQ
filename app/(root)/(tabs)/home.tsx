import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { fetchAPI } from "../../lib/fetch";
import * as Location from 'expo-location';
import { 
    Package, 
    Truck, 
    Clock, 
    TrendingUp, 
    MapPin, 
    AlertCircle,
    CheckCircle,
    BarChart3,
    Navigation,
    Bell,
    Building2,
    Users,
    DollarSign,
    Star,
    Plus,
    Map,
    Calendar,
    Settings
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface StatCard {
    title: string;
    value: string;
    change: string;
    color: string;
    icon: React.ReactNode;
    onPress?: () => void;
}

interface RecentActivity {
    id: string;
    type: 'delivery' | 'pickup' | 'issue';
    title: string;
    subtitle: string;
    time: string;
    status: 'completed' | 'pending' | 'issue';
}

interface UserProfile {
    id: string;
    role: string;
    name: string;
    email: string;
    phone?: string;
}

const Home = () => {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    // Fetch user profile and dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!isLoaded || !user?.id) return;

        try {
            setIsLoading(true);
            
            // Get user profile
            const userResponse = await fetchAPI(`/user?clerkUserId=${user.id}`);
            if (userResponse.user) {
                setUserProfile(userResponse.user);
                
                // Fetch role-specific dashboard data
                await fetchRoleSpecificData(userResponse.user);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, user?.id]);

    const fetchRoleSpecificData = async (profile: UserProfile) => {
        try {
            const role = profile.role;
            let data = {};

            if (role === 'transporter') {
                // Fetch driver earnings, active jobs, ratings
                const [shipmentsRes, paymentsRes] = await Promise.all([
                    fetchAPI(`/shipments?driverId=${profile.id}&status=active`),
                    fetchAPI(`/payments?userId=${profile.id}&role=transporter`)
                ]);
                
                data = {
                    activeJobs: shipmentsRes.data?.length || 0,
                    todayEarnings: calculateTodayEarnings(paymentsRes.data || []),
                    totalEarnings: calculateTotalEarnings(paymentsRes.data || []),
                    rating: 4.8, // This should come from ratings API
                    totalDeliveries: paymentsRes.data?.length || 0
                };
            } else if (role === 'business' || role === 'customer') {
                // Fetch shipments data
                const shipmentsRes = await fetchAPI(`/shipments?customerId=${profile.id}`);
                const shipments = shipmentsRes.data || [];
                
                data = {
                    activeShipments: shipments.filter((s: any) => ['pending', 'picked_up', 'in_transit'].includes(s.status)).length,
                    delivered: shipments.filter((s: any) => s.status === 'delivered').length,
                    inTransit: shipments.filter((s: any) => s.status === 'in_transit').length,
                    issues: shipments.filter((s: any) => s.status === 'issue').length,
                    totalShipments: shipments.length
                };
            } else if (role === 'admin') {
                // Fetch admin overview data
                const [usersRes, shipmentsRes, paymentsRes] = await Promise.all([
                    fetchAPI('/drivers'),
                    fetchAPI('/shipments'),
                    fetchAPI('/payments')
                ]);
                
                data = {
                    totalUsers: usersRes.data?.length || 0,
                    activeShipments: shipmentsRes.data?.filter((s: any) => ['pending', 'picked_up', 'in_transit'].includes(s.status)).length || 0,
                    totalRevenue: calculateTotalRevenue(paymentsRes.data || []),
                    disputes: shipmentsRes.data?.filter((s: any) => s.status === 'issue').length || 0
                };
            }

            setDashboardData(data);
            
            // Set recent activities based on role
            if (role === 'transporter') {
                const activities = await fetchTransporterActivities(profile.id);
                setRecentActivities(activities);
            } else {
                const activities = await fetchCustomerActivities(profile.id);
                setRecentActivities(activities);
            }
            
        } catch (error) {
            console.error('Error fetching role-specific data:', error);
        }
    };

    const fetchTransporterActivities = async (userId: string): Promise<RecentActivity[]> => {
        try {
            const response = await fetchAPI(`/shipments?driverId=${userId}&limit=5`);
            return (response.data || []).map((shipment: any) => ({
                id: shipment.id,
                type: shipment.status === 'delivered' ? 'delivery' : 'pickup',
                title: shipment.status === 'delivered' ? 'Package Delivered' : 'Pickup Scheduled',
                subtitle: `${shipment.pickup_address} → ${shipment.delivery_address}`,
                time: formatTime(shipment.updated_at),
                status: shipment.status === 'delivered' ? 'completed' : 'pending'
            }));
        } catch (error) {
            console.error('Error fetching transporter activities:', error);
            return [];
        }
    };

    const fetchCustomerActivities = async (userId: string): Promise<RecentActivity[]> => {
        try {
            const response = await fetchAPI(`/shipments?customerId=${userId}&limit=5`);
            return (response.data || []).map((shipment: any) => ({
                id: shipment.id,
                type: shipment.status === 'delivered' ? 'delivery' : 'pickup',
                title: shipment.status === 'delivered' ? 'Package Delivered' : 'Shipment in Progress',
                subtitle: `${shipment.pickup_address} → ${shipment.delivery_address}`,
                time: formatTime(shipment.updated_at),
                status: shipment.status === 'delivered' ? 'completed' : shipment.status === 'issue' ? 'issue' : 'pending'
            }));
        } catch (error) {
            console.error('Error fetching customer activities:', error);
            return [];
        }
    };

    // Helper functions
    const calculateTodayEarnings = (payments: any[]) => {
        const today = new Date().toDateString();
        return payments
            .filter(p => new Date(p.created_at).toDateString() === today)
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    };

    const calculateTotalEarnings = (payments: any[]) => {
        return payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    };

    const calculateTotalRevenue = (payments: any[]) => {
        return payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    };

    const formatTime = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now.getTime() - time.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

    // Location tracking for transporters
    useEffect(() => {
        const setupLocationTracking = async () => {
            if (userProfile?.role === 'transporter') {
                try {
                    let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert(
                            'Location Permission Required',
                            'Please enable location services to track your deliveries',
                            [{ text: 'OK', onPress: () => {} }]
                        );
                        return;
                    }

                    let location = await Location.getCurrentPositionAsync({});
                    setLocation(location);

                    // Update location in database
                    await fetchAPI('/user/transporter-profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userProfile.id,
                            current_latitude: location.coords.latitude,
                            current_longitude: location.coords.longitude,
                            is_available: true
                        })
                    });
                } catch (error) {
                    console.error('Error setting up location tracking:', error);
                }
            }
        };

        if (userProfile) {
            setupLocationTracking();
        }
    }, [userProfile]);

    // Refresh function
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    // Initial data fetch
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (!isLoaded || isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FACC15" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Role-based dashboard content
    const getRoleBasedContent = () => {
        if (!userProfile) return { title: 'Dashboard', subtitle: 'Welcome to LogisticQ', stats: [] };
        
        switch (userProfile.role) {
            case 'business':
                return {
                    title: 'Business Dashboard',
                    subtitle: 'Manage your shipments and logistics',
                    stats: [
                        {
                            title: 'Active Shipments',
                            value: dashboardData?.activeShipments?.toString() || '0',
                            change: '+12%',
                            color: '#3B82F6',
                            icon: <Package size={20} color="#3B82F6" />,
                            onPress: () => router.push('/(root)/(tabs)/shipments')
                        },
                        {
                            title: 'Total Shipments',
                            value: dashboardData?.totalShipments?.toString() || '0',
                            change: '+8%',
                            color: '#10B981',
                            icon: <DollarSign size={20} color="#10B981" />,
                            onPress: () => router.push('/(root)/(tabs)/analytics')
                        },
                        {
                            title: 'Delivered',
                            value: dashboardData?.delivered?.toString() || '0',
                            change: '+15%',
                            color: '#8B5CF6',
                            icon: <CheckCircle size={20} color="#8B5CF6" />,
                            onPress: () => router.push('/(root)/(tabs)/history')
                        },
                        {
                            title: 'In Transit',
                            value: dashboardData?.inTransit?.toString() || '0',
                            change: '+5%',
                            color: '#EF4444',
                            icon: <Navigation size={20} color="#EF4444" />,
                            onPress: () => router.push('/(root)/(tabs)/tracking')
                        }
                    ]
                };
            case 'transporter':
                return {
                    title: 'Transporter Dashboard',
                    subtitle: 'Track your deliveries and earnings',
                    stats: [
                        {
                            title: 'Active Jobs',
                            value: dashboardData?.activeJobs?.toString() || '0',
                            change: '+1',
                            color: '#10B981',
                            icon: <Truck size={20} color="#10B981" />,
                            onPress: () => router.push('/(root)/(tabs)/jobs')
                        },
                        {
                            title: 'Today Earnings',
                            value: `₹${dashboardData?.todayEarnings?.toFixed(0) || '0'}`,
                            change: '+18%',
                            color: '#EF4444',
                            icon: <DollarSign size={20} color="#EF4444" />,
                            onPress: () => router.push('/(root)/(tabs)/earnings')
                        },
                        {
                            title: 'Rating',
                            value: dashboardData?.rating?.toString() || '0',
                            change: '+0.2',
                            color: '#FACC15',
                            icon: <Star size={20} color="#FACC15" />,
                            onPress: () => router.push('/(root)/(tabs)/ratings')
                        },
                        {
                            title: 'Total Deliveries',
                            value: dashboardData?.totalDeliveries?.toString() || '0',
                            change: '+12',
                            color: '#8B5CF6',
                            icon: <Package size={20} color="#8B5CF6" />,
                            onPress: () => router.push('/(root)/(tabs)/history')
                        }
                    ]
                };
            case 'customer':
                return {
                    title: 'Customer Dashboard',
                    subtitle: 'Track your incoming shipments',
                    stats: [
                        {
                            title: 'Active Orders',
                            value: dashboardData?.activeShipments?.toString() || '0',
                            change: '+2',
                            color: '#8B5CF6',
                            icon: <Package size={20} color="#8B5CF6" />,
                            onPress: () => router.push('/(root)/(tabs)/orders')
                        },
                        {
                            title: 'In Transit',
                            value: dashboardData?.inTransit?.toString() || '0',
                            change: '+1',
                            color: '#3B82F6',
                            icon: <Navigation size={20} color="#3B82F6" />,
                            onPress: () => router.push('/(root)/(tabs)/tracking')
                        },
                        {
                            title: 'Delivered',
                            value: dashboardData?.delivered?.toString() || '0',
                            change: '+8',
                            color: '#10B981',
                            icon: <CheckCircle size={20} color="#10B981" />,
                            onPress: () => router.push('/(root)/(tabs)/history')
                        },
                        {
                            title: 'Issues',
                            value: dashboardData?.issues?.toString() || '0',
                            change: '0',
                            color: '#EF4444',
                            icon: <AlertCircle size={20} color="#EF4444" />,
                            onPress: () => router.push('/(root)/(tabs)/disputes')
                        }
                    ]
                };
            case 'admin':
                return {
                    title: 'Admin Dashboard',
                    subtitle: 'Platform overview and management',
                    stats: [
                        {
                            title: 'Total Users',
                            value: dashboardData?.totalUsers?.toString() || '0',
                            change: '+56',
                            color: '#3B82F6',
                            icon: <Users size={20} color="#3B82F6" />,
                            onPress: () => router.push('/(root)/(tabs)/users')
                        },
                        {
                            title: 'Active Shipments',
                            value: dashboardData?.activeShipments?.toString() || '0',
                            change: '+123',
                            color: '#10B981',
                            icon: <Package size={20} color="#10B981" />,
                            onPress: () => router.push('/(root)/(tabs)/shipments')
                        },
                        {
                            title: 'Revenue',
                            value: `₹${(dashboardData?.totalRevenue / 100000).toFixed(1)}L` || '₹0',
                            change: '+23%',
                            color: '#FACC15',
                            icon: <DollarSign size={20} color="#FACC15" />,
                            onPress: () => router.push('/(root)/(tabs)/analytics')
                        },
                        {
                            title: 'Disputes',
                            value: dashboardData?.disputes?.toString() || '0',
                            change: '-3',
                            color: '#EF4444',
                            icon: <AlertCircle size={20} color="#EF4444" />,
                            onPress: () => router.push('/(root)/(tabs)/disputes')
                        }
                    ]
                };
            default:
                return {
                    title: 'Dashboard',
                    subtitle: 'Welcome to LogisticQ',
                    stats: []
                };
        }
    };

    const roleContent = getRoleBasedContent();
    const stats: StatCard[] = roleContent.stats;

    const recentActivity: RecentActivity[] = [
        {
            id: '1',
            type: 'delivery',
            title: 'Package Delivered',
            subtitle: 'Order #LQ-2024-001 to Downtown',
            time: '2 hours ago',
            status: 'completed'
        },
        {
            id: '2',
            type: 'pickup',
            title: 'Pickup Scheduled',
            subtitle: 'Warehouse District - 15 packages',
            time: '3 hours ago',
            status: 'pending'
        },
        {
            id: '3',
            type: 'issue',
            title: 'Delivery Delayed',
            subtitle: 'Order #LQ-2024-002 - Traffic delay',
            time: '5 hours ago',
            status: 'issue'
        }
    ];

    const renderStatCard = (stat: StatCard, index: number) => (
        <TouchableOpacity 
            key={index} 
            style={styles.statCard}
            onPress={stat.onPress}
            activeOpacity={0.7}
        >
            <View style={styles.statHeader}>
                <View style={styles.statIconContainer}>
                    {stat.icon}
                </View>
                <Text style={styles.statChange}>{stat.change}</Text>
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
        </TouchableOpacity>
    );

    const getActivityIcon = (type: string, status: string) => {
        if (status === 'completed') return <CheckCircle size={20} color="#34C759" />;
        if (status === 'issue') return <AlertCircle size={20} color="#FF3B30" />;
        if (type === 'delivery') return <Truck size={20} color="#007AFF" />;
        if (type === 'pickup') return <Package size={20} color="#FF9500" />;
        return <Clock size={20} color="#8E8E93" />;
    };

    const renderActivityItem = (item: RecentActivity) => (
        <TouchableOpacity key={item.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
                {getActivityIcon(item.type, item.status)}
            </View>
            <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.activityTime}>{item.time}</Text>
        </TouchableOpacity>
    );

    const getQuickActions = () => {
        if (!userProfile) return [];
        
        switch (userProfile.role) {
            case 'transporter':
                return [
                    {
                        icon: <Map size={20} color="#FFFFFF" />,
                        text: 'View Jobs',
                        onPress: () => router.push('/(root)/(tabs)/jobs'),
                        primary: true
                    },
                    {
                        icon: <MapPin size={20} color="#007AFF" />,
                        text: 'Go Online',
                        onPress: async () => {
                            try {
                                await fetchAPI('/user/transporter-profile', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        userId: userProfile.id,
                                        is_available: true
                                    })
                                });
                                Alert.alert('Success', 'You are now online and available for jobs!');
                            } catch (error) {
                                Alert.alert('Error', 'Failed to update availability');
                            }
                        },
                        primary: false
                    }
                ];
            case 'business':
            case 'customer':
                return [
                    {
                        icon: <Plus size={20} color="#FFFFFF" />,
                        text: 'Create Shipment',
                        onPress: () => router.push('/(root)/(tabs)/create-shipment'),
                        primary: true
                    },
                    {
                        icon: <Navigation size={20} color="#007AFF" />,
                        text: 'Track Shipment',
                        onPress: () => router.push('/(root)/(tabs)/tracking'),
                        primary: false
                    }
                ];
            case 'admin':
                return [
                    {
                        icon: <Users size={20} color="#FFFFFF" />,
                        text: 'Manage Users',
                        onPress: () => router.push('/(root)/(tabs)/users'),
                        primary: true
                    },
                    {
                        icon: <BarChart3 size={20} color="#007AFF" />,
                        text: 'Analytics',
                        onPress: () => router.push('/(root)/(tabs)/analytics'),
                        primary: false
                    }
                ];
            default:
                return [];
        }
    };

    const quickActions = getQuickActions();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FACC15']}
                        tintColor="#FACC15"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            {new Date().getHours() < 12 ? 'Good morning' : 
                             new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
                        </Text>
                        <Text style={styles.userName}>
                            {userProfile?.name || user?.firstName || 'User'}! 👋
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.notificationButton}
                        onPress={() => {
                            // Handle notifications
                            Alert.alert('Notifications', 'No new notifications');
                        }}
                    >
                        <Bell size={24} color="#007AFF" />
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>3</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Role-based Header */}
                <View style={styles.roleHeader}>
                    <Text style={styles.roleTitle}>{roleContent.title}</Text>
                    <Text style={styles.roleSubtitle}>{roleContent.subtitle}</Text>
                </View>

                {/* Location Status for Transporters */}
                {userProfile?.role === 'transporter' && location && (
                    <View style={styles.locationStatus}>
                        <MapPin size={16} color="#10B981" />
                        <Text style={styles.locationText}>
                            Location tracking active • {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                        </Text>
                    </View>
                )}

                {/* Quick Actions */}
                {quickActions.length > 0 && (
                    <View style={styles.quickActions}>
                        {quickActions.map((action, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={[
                                    styles.quickActionButton,
                                    action.primary ? styles.primaryAction : styles.secondaryAction
                                ]}
                                onPress={action.onPress}
                                activeOpacity={0.7}
                            >
                                {action.icon}
                                <Text style={[
                                    styles.quickActionText,
                                    !action.primary && styles.secondaryActionText
                                ]}>
                                    {action.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Stats Grid */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Today's Overview</Text>
                    <View style={styles.statsGrid}>
                        {roleContent.stats.map(renderStatCard)}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activityContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => router.push('/(root)/(tabs)/history')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.activityList}>
                        {recentActivities.length > 0 ? (
                            recentActivities.map(renderActivityItem)
                        ) : (
                            <View style={styles.emptyState}>
                                <Clock size={32} color="#8E8E93" />
                                <Text style={styles.emptyStateText}>No recent activity</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Bottom Padding for Tab Bar */}
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
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
    },
    greeting: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 12,
    },
    quickActionButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    secondaryAction: {
        backgroundColor: '#F2F2F7',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    quickActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryActionText: {
        color: '#007AFF',
    },
    statsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: (width - 52) / 2,
        backgroundColor: '#FFFFFF',
        padding: 16,
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
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statChange: {
        fontSize: 12,
        color: '#34C759',
        fontWeight: '600',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 14,
        color: '#8E8E93',
    },
    activityContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    activityList: {
        backgroundColor: '#FFFFFF',
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
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    activityIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    activitySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
    },
    activityTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    bottomPadding: {
        height: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8E8E93',
    },
    roleHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    roleSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
    },
    locationStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    locationText: {
        fontSize: 12,
        color: '#10B981',
        marginLeft: 6,
        fontWeight: '500',
    },
    primaryAction: {
        backgroundColor: '#007AFF',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 8,
    },
});

export default Home;