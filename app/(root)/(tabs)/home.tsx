import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Image,
} from 'react-native';
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { fetchAPI } from "../../lib/fetch";
import * as Location from 'expo-location';
import EnhancedMapView from '../../components/EnhancedMapView';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
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
    Settings,
    Search
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
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    clerk_user_id: string;
    profile_completed: boolean;
    created_at: string;
    updated_at: string;
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
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [mapMarkers, setMapMarkers] = useState<any[]>([]);

    // Fetch user profile and dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!isLoaded || !user?.id) return;

        try {
            setIsLoading(true);
            
            // Get user profile
            console.log('🔍 Fetching user profile for user ID:', user.id);
            const userResponse = await fetchAPI(`/user?clerkUserId=${user.id}`);
            console.log('✅ Fetched user profile response:', userResponse);
            
            if (userResponse && userResponse.user) {
                console.log('👤 Setting user profile:', userResponse.user);
                setUserProfile(userResponse.user);
                
                // Fetch role-specific dashboard data
                console.log('📊 Fetching role-specific data for role:', userResponse.user.role);
                await fetchRoleSpecificData(userResponse.user);
                
                // Fetch all users with location data for map display (for admin and all users)
                await fetchAllUsersWithLocation();
            } else {
                console.error('❌ No user data in response:', userResponse);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, user?.id]);

    // Fetch all users with location data for map display
    const fetchAllUsersWithLocation = async () => {
        try {
            console.log('🗺️ Fetching all users with location data...');
            const response = await fetchAPI('/users?includeLocation=true');
            
            if (response.success && response.data) {
                console.log('✅ Fetched users with location:', response.data.length);
                setAllUsers(response.data);
                
                // Create map markers from users with location data
                const markers = response.data
                    .filter((user: any) => {
                        // Include transporters with valid coordinates
                        if (user.role === 'transporter' && user.current_latitude && user.current_longitude) {
                            return true;
                        }
                        // For other roles, we'll use default locations
                        return user.role !== 'transporter';
                    })
                    .map((user: any, index: number) => {
                        let coordinates = {
                            latitude: 37.7749, // Default SF coordinates
                            longitude: -122.4194
                        };
                        
                        // Use actual coordinates for transporters
                        if (user.role === 'transporter' && user.current_latitude && user.current_longitude) {
                            coordinates = {
                                latitude: parseFloat(user.current_latitude),
                                longitude: parseFloat(user.current_longitude)
                            };
                        } else {
                            // Create nearby locations for non-transporters using user's location as center
                            const userLat = location?.coords.latitude || 37.7749;
                            const userLng = location?.coords.longitude || -122.4194;
                            
                            coordinates = {
                                latitude: userLat + (Math.random() - 0.5) * 0.02, // Smaller radius for better grouping
                                longitude: userLng + (Math.random() - 0.5) * 0.02
                            };
                        }
                        
                        return {
                            id: user.id,
                            latitude: coordinates.latitude,
                            longitude: coordinates.longitude,
                            title: user.display_name || `${user.first_name} ${user.last_name}`,
                            status: user.location_status || 'completed',
                            role: user.role,
                            additional_info: user.role === 'transporter' ? 
                                `${user.vehicle_type} - ${user.is_available ? 'Available' : 'Busy'}` :
                                user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        };
                    });
                
                console.log('🗺️ Created map markers:', markers.length);
                setMapMarkers(markers);
            }
        } catch (error) {
            console.error('Error fetching users with location:', error);
            // Set some mock markers as fallback
            setMapMarkers([
                {
                    id: '1',
                    latitude: 37.7749 + 0.01,
                    longitude: -122.4194 + 0.01,
                    title: 'Active Delivery',
                    status: 'active'
                },
                {
                    id: '2',
                    latitude: 37.7749 - 0.005,
                    longitude: -122.4194 + 0.015,
                    title: 'Pending Pickup',
                    status: 'pending'
                }
            ]);
        }
    };

    const fetchRoleSpecificData = async (profile: UserProfile) => {
        try {
            const role = profile.role;
            let data = {};

            if (role === 'transporter') {
                // Fetch driver earnings, active jobs, ratings with individual error handling
                let shipmentsRes = { data: [] };
                let paymentsRes = { data: [] };
                
                try {
                    shipmentsRes = await fetchAPI(`/shipments?driverId=${profile.id}&status=active`);
                } catch (error) {
                    console.error('Error fetching shipments for transporter:', error);
                }
                
                try {
                    paymentsRes = await fetchAPI(`/payments?userId=${profile.id}&role=transporter`);
                } catch (error) {
                    console.error('Error fetching payments for transporter:', error);
                }
                
                data = {
                    activeJobs: shipmentsRes.data?.length || 0,
                    todayEarnings: calculateTodayEarnings(paymentsRes.data || []),
                    totalEarnings: calculateTotalEarnings(paymentsRes.data || []),
                    rating: 4.8, // This should come from ratings API
                    totalDeliveries: paymentsRes.data?.length || 0
                };
            } else if (role === 'business' || role === 'customer') {
                // Fetch shipments data with error handling
                let shipmentsRes = { data: [] };
                
                try {
                    shipmentsRes = await fetchAPI(`/shipments?customerId=${profile.id}`);
                } catch (error) {
                    console.error('Error fetching shipments for customer/business:', error);
                }
                
                const shipments = shipmentsRes.data || [];
                
                data = {
                    activeShipments: shipments.filter((s: any) => ['pending', 'picked_up', 'in_transit'].includes(s.status)).length,
                    delivered: shipments.filter((s: any) => s.status === 'delivered').length,
                    inTransit: shipments.filter((s: any) => s.status === 'in_transit').length,
                    issues: shipments.filter((s: any) => s.status === 'issue').length,
                    totalShipments: shipments.length
                };
            } else if (role === 'admin') {
                // Fetch admin overview data with individual error handling
                let usersRes = { data: [] };
                let shipmentsRes = { data: [] };
                let paymentsRes = { data: [] };
                
                try {
                    usersRes = await fetchAPI('/drivers');
                } catch (error) {
                    console.error('Error fetching drivers for admin:', error);
                }
                
                try {
                    shipmentsRes = await fetchAPI('/shipments');
                } catch (error) {
                    console.error('Error fetching shipments for admin:', error);
                }
                
                try {
                    paymentsRes = await fetchAPI('/payments');
                } catch (error) {
                    console.error('Error fetching payments for admin:', error);
                }
                
                data = {
                    totalUsers: usersRes.data?.length || 0,
                    activeShipments: shipmentsRes.data?.filter((s: any) => ['pending', 'picked_up', 'in_transit'].includes(s.status)).length || 0,
                    totalRevenue: calculateTotalRevenue(paymentsRes.data || []),
                    disputes: shipmentsRes.data?.filter((s: any) => s.status === 'issue').length || 0
                };
            }

            setDashboardData(data);
            
            // Set recent activities based on role with error handling
            try {
                if (role === 'transporter') {
                    const activities = await fetchTransporterActivities(profile.id);
                    setRecentActivities(activities);
                } else {
                    const activities = await fetchCustomerActivities(profile.id);
                    setRecentActivities(activities);
                }
            } catch (error) {
                console.error('Error fetching activities:', error);
                setRecentActivities([]);
            }
            
        } catch (error) {
            console.error('Error fetching role-specific data:', error);
            // Set default empty data so the UI doesn't break
            setDashboardData({
                activeJobs: 0,
                todayEarnings: 0,
                totalEarnings: 0,
                rating: 0,
                totalDeliveries: 0
            });
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

    // Location tracking for all users
    useEffect(() => {
        const setupLocationTracking = async () => {
            if (userProfile) {
                try {
                    let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert(
                            'Location Permission Required',
                            'Please enable location services for better map experience',
                            [{ text: 'OK', onPress: () => {} }]
                        );
                        return;
                    }

                    let userLocation = await Location.getCurrentPositionAsync({});
                    setLocation(userLocation);

                    // Update location in database for transporters
                    if (userProfile.role === 'transporter') {
                        try {
                            await fetchAPI('/user/transporter-profile', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId: userProfile.id,
                                    current_latitude: userLocation.coords.latitude,
                                    current_longitude: userLocation.coords.longitude,
                                    is_available: true
                                })
                            });
                            console.log('✅ Updated transporter location in database');
                        } catch (error) {
                            console.error('Error updating transporter location:', error);
                        }
                    }
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
            <SafeAreaWrapper backgroundColor="#F8FAFC">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#FACC15" />
                    <Text className="mt-4 text-base text-slate-500 font-medium">Loading...</Text>
                </View>
            </SafeAreaWrapper>
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
            className="flex-1 bg-slate-50 p-3 rounded-xl items-center border border-gray-200 min-h-[100px]"
            onPress={stat.onPress}
            activeOpacity={0.7}
        >
            <View className="w-8 h-8 rounded-2xl justify-center items-center mb-2" style={{ backgroundColor: stat.color + '20' }}>
                {stat.icon}
            </View>
            <Text className="text-lg font-bold text-gray-900 mb-0.5">{stat.value}</Text>
            <Text className="text-xs text-gray-500 font-semibold text-center leading-3">{stat.title}</Text>
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
        <TouchableOpacity key={item.id} className="flex-row items-center py-4 px-1 border-b border-slate-100">
            <View className="w-11 h-11 bg-slate-50 rounded-full justify-center items-center mr-4 border border-gray-200">
                {getActivityIcon(item.type, item.status)}
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">{item.title}</Text>
                <Text className="text-sm text-gray-500 leading-5">{item.subtitle}</Text>
            </View>
            <Text className="text-xs text-gray-400 font-medium">{item.time}</Text>
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
        <SafeAreaWrapper backgroundColor="#000000" excludeBottom={true}>
            {/* Large Map Background - Uber Style */}
            <View className="absolute top-10 left-0 right-0 bottom-0 z-[1]">
                <EnhancedMapView
                    latitude={location?.coords.latitude || 37.7749}
                    longitude={location?.coords.longitude || -122.4194}
                    markers={mapMarkers}
                    height={Dimensions.get('window').height}
                    showControls={true}
                    zoom={userProfile?.role === 'admin' ? 15 : 17}
                    onMapReady={() => console.log('Enhanced map is ready!')}
                />
            </View>

            {/* Top Header Overlay */}
            <View className="absolute top-16 left-0 right-0 z-10 bg-transparent">
                <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 mx-4 mt-2 rounded-2xl shadow-lg shadow-black/15 backdrop-blur-xl">
                    <TouchableOpacity className="w-10 h-10 rounded-full overflow-hidden">
                        <Image 
                            source={{ uri: user?.imageUrl || 'https://via.placeholder.com/40' }}
                            className="w-full h-full rounded-full"
                            defaultSource={{ uri: 'https://via.placeholder.com/40' }}
                        />
                    </TouchableOpacity>
                    
                    <View className="flex-1 items-center mx-4">
                        <Text className="text-sm text-gray-500 font-medium">
                            {new Date().getHours() < 12 ? 'Good morning' : 
                             new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
                        </Text>
                        <Text className="text-lg font-bold text-gray-900 mt-0.5">
                            {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : user?.firstName || 'User'}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        className="relative w-10 h-10 rounded-full bg-black/5 justify-center items-center"
                        onPress={() => Alert.alert('Notifications', 'No new notifications')}
                    >
                        <Bell size={24} color="#000000" />
                        <View className="absolute top-1.5 right-1.5 bg-red-500 rounded-lg w-4 h-4 justify-center items-center">
                            <Text className="text-white text-xs font-bold">3</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Cards Overlay - Above Navbar */}
            <View className="absolute left-0 right-0 bottom-0 z-[5] bg-transparent" style={{top: Dimensions.get('window').height * 0.53}}>
                <ScrollView 
                    className="flex-1 pt-4"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3B82F6']}
                            tintColor="#3B82F6"
                        />
                    }
                >
                    {/* Location Status for Transporters */}
                    {userProfile?.role === 'transporter' && location && (
                        <View className="flex-row items-center bg-emerald-500/95 mx-4 mb-3 p-4 rounded-2xl shadow-sm shadow-black/10 backdrop-blur-xl">
                            <View className="w-3 h-3 rounded-full bg-white mr-3 shadow-emerald-500 shadow-lg" />
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-white mb-0.5">You're online</Text>
                                <Text className="text-xs text-white/80 font-medium">
                                    {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Quick Stats Cards */}
                    <View className="bg-white/80 mx-4 mb-4 rounded-3xl p-5 shadow-xl shadow-black/20 backdrop-blur-xl border border-white/30">
                        <View className="mb-3">
                            <Text className="text-xl font-bold text-gray-900 mb-1">{roleContent.title}</Text>
                            <Text className="text-sm text-gray-500 font-medium">{roleContent.subtitle}</Text>
                        </View>
                        
                        <View className="flex-row justify-between gap-2">
                            {roleContent.stats.slice(0, 4).map((stat, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    className="flex-1 bg-slate-50 p-3 rounded-xl items-center border border-gray-200 min-h-[100px]"
                                    onPress={stat.onPress}
                                    activeOpacity={0.7}
                                >
                                    <View className="w-8 h-8 rounded-2xl justify-center items-center mb-2" style={{ backgroundColor: stat.color + '20' }}>
                                        {stat.icon}
                                    </View>
                                    <Text className="text-lg font-bold text-gray-900 mb-0.5">{stat.value}</Text>
                                    <Text className="text-xs text-gray-500 font-semibold text-center leading-3">{stat.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Quick Actions Card */}
                    {quickActions.length > 0 && (
                        <View className="bg-white/80 mx-4 mb-4 rounded-3xl p-5 shadow-xl shadow-black/20 backdrop-blur-xl border border-white/30">
                            <Text className="text-xl font-bold text-gray-900 mb-1">Quick Actions</Text>
                            <View className="flex-row gap-3 mt-4 justify-between">
                                {quickActions.map((action, index) => (
                                    <TouchableOpacity 
                                        key={index}
                                        className={`flex-1 flex-row items-center justify-center py-3.5 px-3 rounded-2xl gap-1.5 min-h-[48px] ${
                                            action.primary 
                                                ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
                                                : 'bg-slate-100 border-2 border-blue-500'
                                        }`}
                                        onPress={action.onPress}
                                        activeOpacity={0.8}
                                    >
                                        <View>
                                            {action.icon}
                                        </View>
                                        <Text className={`text-xs font-semibold text-center flex-shrink ${
                                            action.primary ? 'text-white' : 'text-blue-500'
                                        }`}>
                                            {action.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Recent Activity Card */}
                    <View className="bg-white/80 mx-4 mb-36 rounded-3xl p-5 shadow-xl shadow-black/20 backdrop-blur-xl border border-white/30">
                        <View className="mb-3 flex-row justify-between items-center">
                            <Text className="text-xl font-bold text-gray-900 mb-1">Recent Activity</Text>
                            <TouchableOpacity onPress={() => router.push('/(root)/(tabs)/history')}>
                                <Text className="text-sm text-blue-500 font-semibold">See All</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View>
                            {recentActivities.length > 0 ? (
                                recentActivities.slice(0, 3).map(renderActivityItem)
                            ) : (
                                <View className="items-center py-8">
                                    <Clock size={24} color="#8E8E93" />
                                    <Text className="text-sm text-gray-400 mt-2 font-medium">No recent activity</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Bottom spacing for tab bar */}
                    <View className="h-30" />
                </ScrollView>
            </View>
        </SafeAreaWrapper>
    );
};



export default Home;