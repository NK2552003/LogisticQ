import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Calendar,
    Package,
    Truck,
    Clock,
    CheckCircle,
    DollarSign,
    Users,
    MapPin,
    Target,
    Award,
    PieChart,
    Download,
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

const { width } = Dimensions.get('window');

interface AnalyticsData {
    overview: {
        totalShipments: number;
        completedShipments: number;
        activeDrivers: number;
        totalRevenue: number;
        averageDeliveryTime: number;
        customerSatisfaction: number;
    };
    trends: {
        shipmentsGrowth: number;
        revenueGrowth: number;
        efficiencyGrowth: number;
    };
    chartData: {
        shipmentsByDay: Array<{ date: string; count: number }>;
        shipmentsByStatus: Array<{ status: string; count: number; color: string }>;
        revenueByMonth: Array<{ month: string; revenue: number }>;
        topRoutes: Array<{ route: string; count: number; revenue: number }>;
    };
    performance: {
        onTimeDeliveries: number;
        totalDeliveries: number;
        averageRating: number;
        totalRatings: number;
    };
}

const AnalyticsScreen = () => {
    const { user } = useUser();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'performance'>('overview');
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userProfile) {
            fetchAnalyticsData();
        }
    }, [userProfile, timeRange]);

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

    const fetchAnalyticsData = async () => {
        if (!userProfile) return;

        try {
            setLoading(true);

            let endpoint = '';
            if (userProfile.role === 'admin') {
                endpoint = '/shipments'; // All shipments for admin
            } else if (userProfile.role === 'business') {
                endpoint = `/shipments?customerId=${userProfile.id}`;
            } else if (userProfile.role === 'transporter') {
                endpoint = `/shipments?driverId=${userProfile.id}`;
            } else {
                endpoint = `/shipments?customerId=${userProfile.id}`;
            }

            const [shipmentsResponse, paymentsResponse] = await Promise.all([
                fetchAPI(endpoint),
                fetchAPI('/payments')
            ]);

            const shipments = shipmentsResponse.success ? shipmentsResponse.data : [];
            const payments = paymentsResponse.success ? paymentsResponse.data : [];

            // Calculate date range
            const now = new Date();
            const rangeStart = new Date();
            switch (timeRange) {
                case '7d': rangeStart.setDate(now.getDate() - 7); break;
                case '30d': rangeStart.setDate(now.getDate() - 30); break;
                case '90d': rangeStart.setDate(now.getDate() - 90); break;
            }

            // Filter data by time range
            const filteredShipments = shipments.filter((s: any) => 
                new Date(s.created_at) >= rangeStart
            );
            const filteredPayments = payments.filter((p: any) => 
                new Date(p.payment_date) >= rangeStart
            );

            // Calculate overview metrics
            const completedShipments = filteredShipments.filter((s: any) => s.status === 'delivered').length;
            const totalRevenue = filteredPayments
                .filter((p: any) => p.status === 'completed')
                .reduce((sum: number, p: any) => sum + p.amount, 0);

            // Get unique drivers
            const activeDrivers = new Set(
                filteredShipments
                    .filter((s: any) => s.driver_id)
                    .map((s: any) => s.driver_id)
            ).size;

            // Calculate average delivery time (mock data for now)
            const averageDeliveryTime = completedShipments > 0 ? 24 : 0; // hours

            // Calculate trends (comparing with previous period)
            const prevRangeStart = new Date(rangeStart);
            prevRangeStart.setDate(prevRangeStart.getDate() - (now.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000));
            
            const prevShipments = shipments.filter((s: any) => {
                const date = new Date(s.created_at);
                return date >= prevRangeStart && date < rangeStart;
            });

            const shipmentsGrowth = prevShipments.length > 0 
                ? ((filteredShipments.length - prevShipments.length) / prevShipments.length) * 100 
                : 0;

            // Generate chart data
            const shipmentsByDay = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
                
                const count = filteredShipments.filter((s: any) => {
                    const shipmentDate = new Date(s.created_at);
                    return shipmentDate >= dayStart && shipmentDate < dayEnd;
                }).length;

                shipmentsByDay.push({
                    date: dayStart.toISOString().split('T')[0],
                    count
                });
            }

            // Shipments by status
            const statusCounts = filteredShipments.reduce((acc: any, s: any) => {
                acc[s.status] = (acc[s.status] || 0) + 1;
                return acc;
            }, {});

            const statusColors: { [key: string]: string } = {
                'pending': '#FACC15',
                'assigned': '#007AFF',
                'picked_up': '#FF9500',
                'in_transit': '#8B5CF6',
                'delivered': '#10B981',
                'cancelled': '#EF4444'
            };

            const shipmentsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
                status,
                count: count as number,
                color: statusColors[status] || '#8E8E93'
            }));

            // Performance metrics
            const totalDeliveries = completedShipments;
            const onTimeDeliveries = Math.floor(totalDeliveries * 0.85); // Mock 85% on-time rate
            const averageRating = 4.2; // Mock rating
            const totalRatings = completedShipments;

            setAnalyticsData({
                overview: {
                    totalShipments: filteredShipments.length,
                    completedShipments,
                    activeDrivers,
                    totalRevenue,
                    averageDeliveryTime,
                    customerSatisfaction: averageRating
                },
                trends: {
                    shipmentsGrowth,
                    revenueGrowth: 12.5, // Mock data
                    efficiencyGrowth: 8.3 // Mock data
                },
                chartData: {
                    shipmentsByDay,
                    shipmentsByStatus,
                    revenueByMonth: [], // Can be implemented later
                    topRoutes: [] // Can be implemented later
                },
                performance: {
                    onTimeDeliveries,
                    totalDeliveries,
                    averageRating,
                    totalRatings
                }
            });

        } catch (error) {
            console.error('Error fetching analytics data:', error);
            Alert.alert('Error', 'Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAnalyticsData();
        setRefreshing(false);
    }, [fetchAnalyticsData]);

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const renderTimeRangeSelector = () => (
        <View style={styles.timeRangeContainer}>
            {(['7d', '30d', '90d'] as const).map((range) => (
                <TouchableOpacity
                    key={range}
                    style={[
                        styles.timeRangeButton,
                        timeRange === range && styles.timeRangeButtonActive
                    ]}
                    onPress={() => setTimeRange(range)}
                >
                    <Text style={[
                        styles.timeRangeButtonText,
                        timeRange === range && styles.timeRangeButtonTextActive
                    ]}>
                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderOverviewTab = () => (
        <ScrollView style={styles.tabContent}>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, styles.primaryMetric]}>
                    <Package size={24} color="#FFFFFF" />
                    <Text style={styles.primaryMetricValue}>
                        {analyticsData?.overview.totalShipments || 0}
                    </Text>
                    <Text style={styles.primaryMetricLabel}>Total Shipments</Text>
                    <View style={styles.trendIndicator}>
                        <TrendingUp size={12} color="#FFFFFF" />
                        <Text style={styles.trendText}>
                            {formatPercentage(analyticsData?.trends.shipmentsGrowth || 0)}
                        </Text>
                    </View>
                </View>

                <View style={styles.metricCard}>
                    <CheckCircle size={20} color="#10B981" />
                    <Text style={styles.metricValue}>
                        {analyticsData?.overview.completedShipments || 0}
                    </Text>
                    <Text style={styles.metricLabel}>Completed</Text>
                </View>

                <View style={styles.metricCard}>
                    <Truck size={20} color="#007AFF" />
                    <Text style={styles.metricValue}>
                        {analyticsData?.overview.activeDrivers || 0}
                    </Text>
                    <Text style={styles.metricLabel}>Active Drivers</Text>
                </View>

                <View style={styles.metricCard}>
                    <DollarSign size={20} color="#10B981" />
                    <Text style={styles.metricValue}>
                        {formatCurrency(analyticsData?.overview.totalRevenue || 0)}
                    </Text>
                    <Text style={styles.metricLabel}>Revenue</Text>
                </View>
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Shipments Over Time</Text>
                <View style={styles.chartContainer}>
                    {analyticsData?.chartData.shipmentsByDay.map((day, index) => (
                        <View key={day.date} style={styles.chartBar}>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: Math.max(
                                            4,
                                            (day.count / Math.max(...analyticsData.chartData.shipmentsByDay.map(d => d.count), 1)) * 80
                                        ),
                                    },
                                ]}
                            />
                            <Text style={styles.chartLabel}>
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Status Distribution */}
            <View style={styles.statusCard}>
                <Text style={styles.cardTitle}>Shipment Status Distribution</Text>
                <View style={styles.statusList}>
                    {analyticsData?.chartData.shipmentsByStatus.map((item) => (
                        <View key={item.status} style={styles.statusItem}>
                            <View style={styles.statusInfo}>
                                <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                                <Text style={styles.statusLabel}>
                                    {item.status.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.statusStats}>
                                <Text style={styles.statusCount}>{item.count}</Text>
                                <Text style={styles.statusPercentage}>
                                    {((item.count / (analyticsData?.overview.totalShipments || 1)) * 100).toFixed(0)}%
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    const renderTrendsTab = () => (
        <ScrollView style={styles.tabContent}>
            {/* Growth Metrics */}
            <View style={styles.trendsGrid}>
                <View style={styles.trendCard}>
                    <View style={styles.trendHeader}>
                        <Package size={20} color="#007AFF" />
                        <Text style={styles.trendTitle}>Shipment Growth</Text>
                    </View>
                    <Text style={[
                        styles.trendValue,
                        { color: (analyticsData?.trends.shipmentsGrowth || 0) >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                        {formatPercentage(analyticsData?.trends.shipmentsGrowth || 0)}
                    </Text>
                    <Text style={styles.trendSubtext}>vs previous period</Text>
                </View>

                <View style={styles.trendCard}>
                    <View style={styles.trendHeader}>
                        <DollarSign size={20} color="#10B981" />
                        <Text style={styles.trendTitle}>Revenue Growth</Text>
                    </View>
                    <Text style={[
                        styles.trendValue,
                        { color: (analyticsData?.trends.revenueGrowth || 0) >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                        {formatPercentage(analyticsData?.trends.revenueGrowth || 0)}
                    </Text>
                    <Text style={styles.trendSubtext}>vs previous period</Text>
                </View>

                <View style={styles.trendCard}>
                    <View style={styles.trendHeader}>
                        <Target size={20} color="#8B5CF6" />
                        <Text style={styles.trendTitle}>Efficiency</Text>
                    </View>
                    <Text style={[
                        styles.trendValue,
                        { color: (analyticsData?.trends.efficiencyGrowth || 0) >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                        {formatPercentage(analyticsData?.trends.efficiencyGrowth || 0)}
                    </Text>
                    <Text style={styles.trendSubtext}>delivery time improvement</Text>
                </View>
            </View>

            {/* Key Insights */}
            <View style={styles.insightsCard}>
                <Text style={styles.cardTitle}>Key Insights</Text>
                <View style={styles.insightsList}>
                    <View style={styles.insightItem}>
                        <TrendingUp size={16} color="#10B981" />
                        <Text style={styles.insightText}>
                            Shipment volume increased by {Math.abs(analyticsData?.trends.shipmentsGrowth || 0).toFixed(0)}% 
                            this period
                        </Text>
                    </View>
                    <View style={styles.insightItem}>
                        <Clock size={16} color="#007AFF" />
                        <Text style={styles.insightText}>
                            Average delivery time: {analyticsData?.overview.averageDeliveryTime || 0} hours
                        </Text>
                    </View>
                    <View style={styles.insightItem}>
                        <Award size={16} color="#FACC15" />
                        <Text style={styles.insightText}>
                            Customer satisfaction: {analyticsData?.overview.customerSatisfaction.toFixed(1)}/5.0
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    const renderPerformanceTab = () => (
        <ScrollView style={styles.tabContent}>
            {/* Performance Metrics */}
            <View style={styles.performanceGrid}>
                <View style={styles.performanceCard}>
                    <View style={styles.performanceHeader}>
                        <CheckCircle size={24} color="#10B981" />
                        <Text style={styles.performanceTitle}>On-Time Delivery</Text>
                    </View>
                    <Text style={styles.performanceValue}>
                        {analyticsData?.performance.onTimeDeliveries || 0} / {analyticsData?.performance.totalDeliveries || 0}
                    </Text>
                    <Text style={styles.performancePercentage}>
                        {analyticsData?.performance.totalDeliveries 
                            ? ((analyticsData.performance.onTimeDeliveries / analyticsData.performance.totalDeliveries) * 100).toFixed(0)
                            : 0
                        }% Success Rate
                    </Text>
                </View>

                <View style={styles.performanceCard}>
                    <View style={styles.performanceHeader}>
                        <Award size={24} color="#FACC15" />
                        <Text style={styles.performanceTitle}>Customer Rating</Text>
                    </View>
                    <Text style={styles.performanceValue}>
                        {analyticsData?.performance.averageRating.toFixed(1) || '0.0'}
                    </Text>
                    <Text style={styles.performancePercentage}>
                        From {analyticsData?.performance.totalRatings || 0} reviews
                    </Text>
                </View>
            </View>

            {/* Performance Breakdown */}
            <View style={styles.breakdownCard}>
                <Text style={styles.cardTitle}>Performance Breakdown</Text>
                <View style={styles.breakdownList}>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Pickup Success Rate</Text>
                        <Text style={styles.breakdownValue}>96%</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Delivery Success Rate</Text>
                        <Text style={styles.breakdownValue}>94%</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Average Response Time</Text>
                        <Text style={styles.breakdownValue}>12 min</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Customer Support Tickets</Text>
                        <Text style={styles.breakdownValue}>23</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

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
                <Text style={styles.headerTitle}>Analytics</Text>
            </View>

            {/* Time Range Selector */}
            {renderTimeRangeSelector()}

            {/* Tab Navigation */}
            <View style={styles.tabNavigation}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('overview')}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeTab === 'overview' && styles.tabButtonTextActive
                    ]}>
                        Overview
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'trends' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('trends')}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeTab === 'trends' && styles.tabButtonTextActive
                    ]}>
                        Trends
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'performance' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('performance')}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeTab === 'performance' && styles.tabButtonTextActive
                    ]}>
                        Performance
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'trends' && renderTrendsTab()}
                    {activeTab === 'performance' && renderPerformanceTab()}
                </View>
            )}

            {/* Refresh Control */}
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                style={{ position: 'absolute', top: -1000 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    timeRangeContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    timeRangeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    timeRangeButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    timeRangeButtonText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    timeRangeButtonTextActive: {
        color: '#FFFFFF',
    },
    tabNavigation: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#007AFF',
    },
    tabButtonText: {
        fontSize: 16,
        color: '#8E8E93',
        fontWeight: '500',
    },
    tabButtonTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 12,
    },
    metricsGrid: {
        gap: 16,
        marginBottom: 20,
    },
    metricCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryMetric: {
        backgroundColor: '#007AFF',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginLeft: 12,
        flex: 1,
    },
    primaryMetricValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 8,
    },
    metricLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginLeft: 12,
    },
    primaryMetricLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 4,
    },
    trendIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    trendText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 100,
    },
    chartBar: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        backgroundColor: '#007AFF',
        width: 20,
        borderRadius: 2,
        marginBottom: 8,
    },
    chartLabel: {
        fontSize: 10,
        color: '#8E8E93',
    },
    statusCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusList: {
        gap: 12,
    },
    statusItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusLabel: {
        fontSize: 14,
        color: '#000000',
    },
    statusStats: {
        alignItems: 'flex-end',
    },
    statusCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
    },
    statusPercentage: {
        fontSize: 12,
        color: '#8E8E93',
    },
    trendsGrid: {
        gap: 16,
        marginBottom: 20,
    },
    trendCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    trendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    trendTitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginLeft: 8,
        fontWeight: '500',
    },
    trendValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    trendSubtext: {
        fontSize: 12,
        color: '#8E8E93',
    },
    insightsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    insightsList: {
        gap: 12,
    },
    insightItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    insightText: {
        fontSize: 14,
        color: '#000000',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    performanceGrid: {
        gap: 16,
        marginBottom: 20,
    },
    performanceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    performanceHeader: {
        alignItems: 'center',
        marginBottom: 12,
    },
    performanceTitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
        fontWeight: '500',
    },
    performanceValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    performancePercentage: {
        fontSize: 12,
        color: '#8E8E93',
    },
    breakdownCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    breakdownList: {
        gap: 16,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#000000',
        flex: 1,
    },
    breakdownValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
});

export default AnalyticsScreen;