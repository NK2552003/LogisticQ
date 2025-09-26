import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "../../lib/fetch";
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
    Plus
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface StatCard {
    title: string;
    value: string;
    change: string;
    color: string;
    icon: React.ReactNode;
}

interface RecentActivity {
    id: string;
    type: 'delivery' | 'pickup' | 'issue';
    title: string;
    subtitle: string;
    time: string;
    status: 'completed' | 'pending' | 'issue';
}

const Home = () => {
    const { user, isLoaded } = useUser();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!isLoaded || !user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetchAPI(`/user?clerkUserId=${user.id}`, {
                    method: 'GET',
                });

                if (response.user) {
                    setUserRole(response.user.role);
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserRole();
    }, [isLoaded, user?.id]);

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
        switch (userRole) {
            case 'business':
                return {
                    title: 'Business Dashboard',
                    subtitle: 'Manage your shipments and logistics',
                    stats: [
                        {
                            title: 'Active Shipments',
                            value: '24',
                            change: '+12%',
                            color: '#3B82F6',
                            icon: <Package size={20} color="#3B82F6" />
                        },
                        {
                            title: 'Total Cost Saved',
                            value: '₹45,230',
                            change: '+8%',
                            color: '#10B981',
                            icon: <DollarSign size={20} color="#10B981" />
                        },
                        {
                            title: 'Deliveries',
                            value: '156',
                            change: '+15%',
                            color: '#8B5CF6',
                            icon: <CheckCircle size={20} color="#8B5CF6" />
                        },
                        {
                            title: 'Analytics Score',
                            value: '8.4',
                            change: '+5%',
                            color: '#EF4444',
                            icon: <BarChart3 size={20} color="#EF4444" />
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
                            value: '3',
                            change: '+1',
                            color: '#10B981',
                            icon: <Truck size={20} color="#10B981" />
                        },
                        {
                            title: 'Earnings Today',
                            value: '₹2,450',
                            change: '+18%',
                            color: '#EF4444',
                            icon: <DollarSign size={20} color="#EF4444" />
                        },
                        {
                            title: 'Rating',
                            value: '4.8',
                            change: '+0.2',
                            color: '#FACC15',
                            icon: <Star size={20} color="#FACC15" />
                        },
                        {
                            title: 'Deliveries',
                            value: '89',
                            change: '+12',
                            color: '#8B5CF6',
                            icon: <Package size={20} color="#8B5CF6" />
                        }
                    ]
                };
            case 'customer':
                return {
                    title: 'Customer Dashboard',
                    subtitle: 'Track your incoming shipments',
                    stats: [
                        {
                            title: 'Incoming Orders',
                            value: '5',
                            change: '+2',
                            color: '#8B5CF6',
                            icon: <Package size={20} color="#8B5CF6" />
                        },
                        {
                            title: 'In Transit',
                            value: '3',
                            change: '+1',
                            color: '#3B82F6',
                            icon: <Navigation size={20} color="#3B82F6" />
                        },
                        {
                            title: 'Delivered',
                            value: '47',
                            change: '+8',
                            color: '#10B981',
                            icon: <CheckCircle size={20} color="#10B981" />
                        },
                        {
                            title: 'Issues',
                            value: '0',
                            change: '0',
                            color: '#EF4444',
                            icon: <AlertCircle size={20} color="#EF4444" />
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
                            value: '1,234',
                            change: '+56',
                            color: '#3B82F6',
                            icon: <Users size={20} color="#3B82F6" />
                        },
                        {
                            title: 'Active Shipments',
                            value: '890',
                            change: '+123',
                            color: '#10B981',
                            icon: <Package size={20} color="#10B981" />
                        },
                        {
                            title: 'Revenue',
                            value: '₹5.6L',
                            change: '+23%',
                            color: '#FACC15',
                            icon: <DollarSign size={20} color="#FACC15" />
                        },
                        {
                            title: 'Disputes',
                            value: '12',
                            change: '-3',
                            color: '#EF4444',
                            icon: <AlertCircle size={20} color="#EF4444" />
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
        <TouchableOpacity key={index} style={styles.statCard}>
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good morning</Text>
                        <Text style={styles.userName}>
                            {user?.firstName || 'User'}! 👋
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
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

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <Navigation size={20} color="#FFFFFF" />
                        <Text style={styles.quickActionText}>Track Shipment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionButton, styles.secondaryAction]}>
                        <Package size={20} color="#007AFF" />
                        <Text style={[styles.quickActionText, styles.secondaryActionText]}>New Order</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Today's Overview</Text>
                    <View style={styles.statsGrid}>
                        {stats.map(renderStatCard)}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activityContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.activityList}>
                        {recentActivity.map(renderActivityItem)}
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
});

export default Home;