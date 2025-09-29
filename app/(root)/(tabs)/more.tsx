import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { 
    MessageCircle, 
    Package, 
    Clock, 
    MapPin, 
    FileText, 
    CreditCard,
    Users,
    Settings,
    HelpCircle,
    BarChart3,
    Star,
    AlertTriangle
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';

const { width } = Dimensions.get('window');

interface TabOption {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    route: string;
    color: string;
    bgColor: string;
}

const MoreScreen = () => {
    const router = useRouter();

    const tabOptions: TabOption[] = [
        {
            id: 'chat',
            title: 'Chat',
            subtitle: 'Messages & Support',
            icon: <MessageCircle size={28} color="#FFFFFF" strokeWidth={2} />,
            route: '/(root)/(tabs)/chat',
            color: '#10B981',
            bgColor: '#ECFDF5'
        },
        {
            id: 'orders',
            title: 'Orders',
            subtitle: 'Track Shipments',
            icon: <Package size={28} color="#FFFFFF" strokeWidth={2} />,
            route: '/(root)/(tabs)/orders',
            color: '#3B82F6',
            bgColor: '#EFF6FF'
        },
        {
            id: 'history',
            title: 'History',
            subtitle: 'Past Deliveries',
            icon: <Clock size={28} color="#FFFFFF" strokeWidth={2} />,
            route: '/(root)/(tabs)/history',
            color: '#8B5CF6',
            bgColor: '#F3E8FF'
        },
        {
            id: 'tracking',
            title: 'Tracking',
            subtitle: 'Live Location',
            icon: <MapPin size={28} color="#FFFFFF" strokeWidth={2} />,
            route: '/(root)/(tabs)/tracking',
            color: '#EF4444',
            bgColor: '#FEF2F2'
        },
        {
            id: 'invoices',
            title: 'Invoices',
            subtitle: 'Billing & Payments',
            icon: <FileText size={28} color="#FFFFFF" strokeWidth={2} />,
            route: '/(root)/(tabs)/invoices',
            color: '#F59E0B',
            bgColor: '#FFFBEB'
        },
        {
            id: 'payments',
            title: 'Payments',
            subtitle: 'Payment Methods',
            icon: <CreditCard size={28} color="#FFFFFF" strokeWidth={2} />,
            route: '/(root)/(tabs)/payments',
            color: '#06B6D4',
            bgColor: '#F0FDFA'
        },
        {
            id: 'analytics',
            title: 'Analytics',
            subtitle: 'Performance Stats',
            icon: <BarChart3 size={28} color="#FFFFFF" strokeWidth={2} />,
            route: '/(root)/(tabs)/analytics',
            color: '#84CC16',
            bgColor: '#F7FEE7'
        },
        {
            id: 'disputes',
            title: 'Disputes',
            subtitle: 'Issue Resolution',
            icon: <AlertTriangle size={28} color="#FFFFFF" strokeWidth={2} />,
            route: '/(root)/(tabs)/disputes',
            color: '#F97316',
            bgColor: '#FFF7ED'
        }
    ];

    const handleTabPress = (route: string) => {
        router.push(route as any);
    };

    const renderTabCard = (tab: TabOption, index: number) => (
        <TouchableOpacity
            key={tab.id}
            style={[
                styles.tabCard,
                { backgroundColor: tab.bgColor }
            ]}
            onPress={() => handleTabPress(tab.route)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: tab.color }]}>
                {tab.icon}
            </View>
            <Text style={styles.tabTitle}>{tab.title}</Text>
            <Text style={styles.tabSubtitle}>{tab.subtitle}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaWrapper backgroundColor="#F8FAFC">
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>More Options</Text>
                <Text style={styles.headerSubtitle}>Access all your tools and features</Text>
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.gridContainer}>
                    {tabOptions.map((tab, index) => renderTabCard(tab, index))}
                </View>
            </ScrollView>
        </SafeAreaWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    tabCard: {
        width: (width - 56) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
        elevation: 4,
    },
    tabTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
        textAlign: 'center',
    },
    tabSubtitle: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default MoreScreen;