import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { useUser } from "@clerk/clerk-expo";
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
    Bell
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
    const { user } = useUser();

    const stats: StatCard[] = [
        {
            title: 'Active Shipments',
            value: '24',
            change: '+12%',
            color: '#007AFF',
            icon: <Package size={24} color="#007AFF" />
        },
        {
            title: 'Deliveries Today',
            value: '18',
            change: '+8%',
            color: '#34C759',
            icon: <Truck size={24} color="#34C759" />
        },
        {
            title: 'On-Time Rate',
            value: '94%',
            change: '+2%',
            color: '#FF9500',
            icon: <Clock size={24} color="#FF9500" />
        },
        {
            title: 'Revenue',
            value: '$12.5K',
            change: '+15%',
            color: '#AF52DE',
            icon: <TrendingUp size={24} color="#AF52DE" />
        }
    ];

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
});

export default Home;