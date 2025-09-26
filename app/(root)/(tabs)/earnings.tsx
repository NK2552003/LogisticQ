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
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    CreditCard,
    Clock,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Wallet,
    Download,
    Eye,
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

const { width } = Dimensions.get('window');

interface EarningsData {
    totalEarnings: number;
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    pendingAmount: number;
    completedJobs: number;
    totalJobs: number;
    averageEarningPerJob: number;
    recentPayments: Payment[];
    earningsHistory: EarningsHistory[];
}

interface Payment {
    id: string;
    shipment_id: string;
    amount: number;
    status: string;
    payment_date: string;
    payment_method: string;
    tracking_number?: string;
}

interface EarningsHistory {
    date: string;
    amount: number;
    jobs_count: number;
}

const EarningsScreen = () => {
    const { user } = useUser();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'history'>('overview');

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userProfile?.role === 'transporter') {
            fetchEarningsData();
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

    const fetchEarningsData = async () => {
        if (!userProfile?.id) return;

        try {
            setLoading(true);

            // Fetch payments
            const paymentsResponse = await fetchAPI(`/payments?transporterId=${userProfile.id}`);
            const payments = paymentsResponse.success ? paymentsResponse.data : [];

            // Calculate earnings
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const totalEarnings = payments
                .filter((p: Payment) => p.status === 'completed')
                .reduce((sum: number, p: Payment) => sum + p.amount, 0);

            const todayEarnings = payments
                .filter((p: Payment) => {
                    const paymentDate = new Date(p.payment_date);
                    return p.status === 'completed' && paymentDate >= todayStart;
                })
                .reduce((sum: number, p: Payment) => sum + p.amount, 0);

            const weekEarnings = payments
                .filter((p: Payment) => {
                    const paymentDate = new Date(p.payment_date);
                    return p.status === 'completed' && paymentDate >= weekStart;
                })
                .reduce((sum: number, p: Payment) => sum + p.amount, 0);

            const monthEarnings = payments
                .filter((p: Payment) => {
                    const paymentDate = new Date(p.payment_date);
                    return p.status === 'completed' && paymentDate >= monthStart;
                })
                .reduce((sum: number, p: Payment) => sum + p.amount, 0);

            const pendingAmount = payments
                .filter((p: Payment) => p.status === 'pending')
                .reduce((sum: number, p: Payment) => sum + p.amount, 0);

            const completedJobs = payments.filter((p: Payment) => p.status === 'completed').length;
            const totalJobs = payments.length;
            const averageEarningPerJob = completedJobs > 0 ? totalEarnings / completedJobs : 0;

            // Generate earnings history (last 7 days)
            const earningsHistory: EarningsHistory[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

                const dayPayments = payments.filter((p: Payment) => {
                    const paymentDate = new Date(p.payment_date);
                    return p.status === 'completed' && paymentDate >= dayStart && paymentDate < dayEnd;
                });

                earningsHistory.push({
                    date: date.toISOString().split('T')[0],
                    amount: dayPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0),
                    jobs_count: dayPayments.length,
                });
            }

            setEarningsData({
                totalEarnings,
                todayEarnings,
                weekEarnings,
                monthEarnings,
                pendingAmount,
                completedJobs,
                totalJobs,
                averageEarningPerJob,
                recentPayments: payments.slice(0, 10),
                earningsHistory,
            });

        } catch (error) {
            console.error('Error fetching earnings data:', error);
            Alert.alert('Error', 'Failed to fetch earnings data');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchEarningsData();
        setRefreshing(false);
    }, [fetchEarningsData]);

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10B981';
            case 'pending': return '#FACC15';
            case 'failed': return '#EF4444';
            default: return '#8E8E93';
        }
    };

    const getPaymentStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle size={16} color="#10B981" />;
            case 'pending': return <Clock size={16} color="#FACC15" />;
            case 'failed': return <AlertCircle size={16} color="#EF4444" />;
            default: return <Clock size={16} color="#8E8E93" />;
        }
    };

    const renderOverviewTab = () => (
        <ScrollView style={styles.tabContent}>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.primaryCard]}>
                    <View style={styles.statHeader}>
                        <Wallet size={24} color="#FFFFFF" />
                        <Text style={styles.primaryStatLabel}>Total Earnings</Text>
                    </View>
                    <Text style={styles.primaryStatValue}>
                        {formatCurrency(earningsData?.totalEarnings || 0)}
                    </Text>
                    <Text style={styles.primaryStatSubtext}>
                        From {earningsData?.completedJobs || 0} completed jobs
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <TrendingUp size={20} color="#10B981" />
                        <Text style={styles.statLabel}>Today</Text>
                    </View>
                    <Text style={styles.statValue}>
                        {formatCurrency(earningsData?.todayEarnings || 0)}
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <Calendar size={20} color="#007AFF" />
                        <Text style={styles.statLabel}>This Week</Text>
                    </View>
                    <Text style={styles.statValue}>
                        {formatCurrency(earningsData?.weekEarnings || 0)}
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <Clock size={20} color="#FACC15" />
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <Text style={styles.statValue}>
                        {formatCurrency(earningsData?.pendingAmount || 0)}
                    </Text>
                </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.metricsCard}>
                <Text style={styles.cardTitle}>Performance Metrics</Text>
                <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>
                            {formatCurrency(earningsData?.averageEarningPerJob || 0)}
                        </Text>
                        <Text style={styles.metricLabel}>Avg per Job</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{earningsData?.completedJobs || 0}</Text>
                        <Text style={styles.metricLabel}>Completed Jobs</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>
                            {formatCurrency(earningsData?.monthEarnings || 0)}
                        </Text>
                        <Text style={styles.metricLabel}>This Month</Text>
                    </View>
                </View>
            </View>

            {/* Weekly Chart */}
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Last 7 Days</Text>
                <View style={styles.chartContainer}>
                    {earningsData?.earningsHistory.map((day, index) => (
                        <View key={day.date} style={styles.chartBar}>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: Math.max(
                                            4,
                                            (day.amount / Math.max(...earningsData.earningsHistory.map(d => d.amount), 1)) * 60
                                        ),
                                    },
                                ]}
                            />
                            <Text style={styles.chartLabel}>
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </Text>
                            <Text style={styles.chartValue}>₹{day.amount}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    const renderPaymentsTab = () => (
        <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            {earningsData?.recentPayments.length ? (
                <View style={styles.paymentsList}>
                    {earningsData.recentPayments.map((payment) => (
                        <View key={payment.id} style={styles.paymentCard}>
                            <View style={styles.paymentHeader}>
                                <View style={styles.paymentInfo}>
                                    <Text style={styles.paymentAmount}>
                                        {formatCurrency(payment.amount)}
                                    </Text>
                                    <Text style={styles.paymentId}>
                                        #{payment.tracking_number || payment.shipment_id.substring(0, 8)}
                                    </Text>
                                </View>
                                <View style={styles.paymentStatus}>
                                    {getPaymentStatusIcon(payment.status)}
                                    <Text style={[
                                        styles.paymentStatusText,
                                        { color: getPaymentStatusColor(payment.status) }
                                    ]}>
                                        {payment.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.paymentDetails}>
                                <Text style={styles.paymentDate}>
                                    {formatDate(payment.payment_date)}
                                </Text>
                                <Text style={styles.paymentMethod}>
                                    {payment.payment_method.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <CreditCard size={48} color="#8E8E93" />
                    <Text style={styles.emptyStateTitle}>No payments yet</Text>
                    <Text style={styles.emptyStateText}>
                        Complete some jobs to start earning
                    </Text>
                </View>
            )}
        </ScrollView>
    );

    const renderHistoryTab = () => (
        <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Earnings History</Text>
            {earningsData?.earningsHistory.length ? (
                <View style={styles.historyList}>
                    {earningsData.earningsHistory.map((day) => (
                        <View key={day.date} style={styles.historyCard}>
                            <View style={styles.historyDate}>
                                <Text style={styles.historyDateText}>
                                    {new Date(day.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </Text>
                            </View>
                            <View style={styles.historyDetails}>
                                <Text style={styles.historyAmount}>
                                    {formatCurrency(day.amount)}
                                </Text>
                                <Text style={styles.historyJobs}>
                                    {day.jobs_count} {day.jobs_count === 1 ? 'job' : 'jobs'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <BarChart3 size={48} color="#8E8E93" />
                    <Text style={styles.emptyStateTitle}>No history available</Text>
                    <Text style={styles.emptyStateText}>
                        Start completing jobs to build your earnings history
                    </Text>
                </View>
            )}
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

    if (userProfile.role !== 'transporter') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.notAvailableContainer}>
                    <DollarSign size={48} color="#8E8E93" />
                    <Text style={styles.notAvailableTitle}>Earnings Not Available</Text>
                    <Text style={styles.notAvailableText}>
                        This feature is only available for transporters
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Earnings</Text>
            </View>

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
                    style={[styles.tabButton, activeTab === 'payments' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('payments')}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeTab === 'payments' && styles.tabButtonTextActive
                    ]}>
                        Payments
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeTab === 'history' && styles.tabButtonTextActive
                    ]}>
                        History
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading earnings...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'payments' && renderPaymentsTab()}
                    {activeTab === 'history' && renderHistoryTab()}
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
    notAvailableContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    notAvailableTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginTop: 16,
        marginBottom: 8,
    },
    notAvailableText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
    },
    statsGrid: {
        gap: 16,
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryCard: {
        backgroundColor: '#007AFF',
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginLeft: 8,
        fontWeight: '500',
    },
    primaryStatLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        marginLeft: 8,
        fontWeight: '500',
        opacity: 0.9,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    primaryStatValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    primaryStatSubtext: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    metricsCard: {
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
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    metricItem: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'center',
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
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 100,
        marginTop: 16,
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
        marginBottom: 2,
    },
    chartValue: {
        fontSize: 10,
        color: '#000000',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 16,
    },
    paymentsList: {
        gap: 12,
    },
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 2,
    },
    paymentId: {
        fontSize: 12,
        color: '#8E8E93',
    },
    paymentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    paymentStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    paymentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentDate: {
        fontSize: 12,
        color: '#8E8E93',
    },
    paymentMethod: {
        fontSize: 12,
        color: '#8E8E93',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    historyList: {
        gap: 12,
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    historyDate: {
        flex: 1,
    },
    historyDateText: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
    },
    historyDetails: {
        alignItems: 'flex-end',
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 2,
    },
    historyJobs: {
        fontSize: 12,
        color: '#8E8E93',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default EarningsScreen;