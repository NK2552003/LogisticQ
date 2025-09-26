import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Modal,
    Alert,
} from 'react-native';
import { 
    Plus, 
    Search, 
    Filter, 
    Package, 
    Truck, 
    Clock, 
    CheckCircle,
    AlertCircle,
    MoreVertical,
    Calendar,
    MapPin,
    User,
    Phone,
    DollarSign
} from 'lucide-react-native';

interface Order {
    id: string;
    orderNumber: string;
    customer: string;
    customerPhone: string;
    pickup: {
        address: string;
        date: string;
        time: string;
    };
    delivery: {
        address: string;
        date: string;
        time: string;
    };
    status: 'pending' | 'confirmed' | 'picked-up' | 'in-transit' | 'delivered' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    value: number;
    weight: string;
    items: number;
    service: string;
    createdAt: string;
}

const OrdersScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const orders: Order[] = [
        {
            id: '1',
            orderNumber: 'ORD-2024-001',
            customer: 'Sarah Johnson',
            customerPhone: '+1 (555) 123-4567',
            pickup: {
                address: '123 Main St, New York, NY',
                date: '2024-12-28',
                time: '10:00 AM'
            },
            delivery: {
                address: '456 Oak Ave, Brooklyn, NY',
                date: '2024-12-28',
                time: '2:00 PM'
            },
            status: 'confirmed',
            priority: 'high',
            value: 150.00,
            weight: '5.2 lbs',
            items: 3,
            service: 'Same Day',
            createdAt: '2024-12-27'
        },
        {
            id: '2',
            orderNumber: 'ORD-2024-002',
            customer: 'Mike Chen',
            customerPhone: '+1 (555) 987-6543',
            pickup: {
                address: '789 Pine St, Manhattan, NY',
                date: '2024-12-29',
                time: '9:00 AM'
            },
            delivery: {
                address: '321 Elm Dr, Queens, NY',
                date: '2024-12-29',
                time: '4:00 PM'
            },
            status: 'in-transit',
            priority: 'medium',
            value: 85.50,
            weight: '2.1 lbs',
            items: 1,
            service: 'Express',
            createdAt: '2024-12-27'
        },
        {
            id: '3',
            orderNumber: 'ORD-2024-003',
            customer: 'Emma Wilson',
            customerPhone: '+1 (555) 456-7890',
            pickup: {
                address: '555 Broadway, NY',
                date: '2024-12-30',
                time: '11:00 AM'
            },
            delivery: {
                address: '888 Central Ave, Bronx, NY',
                date: '2024-12-30',
                time: '3:00 PM'
            },
            status: 'pending',
            priority: 'low',
            value: 45.00,
            weight: '1.3 lbs',
            items: 2,
            service: 'Standard',
            createdAt: '2024-12-28'
        },
        {
            id: '4',
            orderNumber: 'ORD-2024-004',
            customer: 'David Brown',
            customerPhone: '+1 (555) 321-0987',
            pickup: {
                address: '222 5th Ave, NY',
                date: '2024-12-27',
                time: '2:00 PM'
            },
            delivery: {
                address: '777 Park Ave, NY',
                date: '2024-12-27',
                time: '5:00 PM'
            },
            status: 'delivered',
            priority: 'urgent',
            value: 320.00,
            weight: '8.7 lbs',
            items: 5,
            service: 'Premium',
            createdAt: '2024-12-26'
        }
    ];

    const filterOptions = [
        { value: 'all', label: 'All Orders', count: orders.length },
        { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
        { value: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
        { value: 'in-transit', label: 'In Transit', count: orders.filter(o => o.status === 'in-transit').length },
        { value: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FF9500';
            case 'confirmed': return '#007AFF';
            case 'picked-up': return '#32D74B';
            case 'in-transit': return '#5856D6';
            case 'delivered': return '#34C759';
            case 'cancelled': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return '#FF3B30';
            case 'high': return '#FF9500';
            case 'medium': return '#007AFF';
            case 'low': return '#8E8E93';
            default: return '#8E8E93';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={16} color="#FF9500" />;
            case 'confirmed': return <CheckCircle size={16} color="#007AFF" />;
            case 'picked-up': return <Package size={16} color="#32D74B" />;
            case 'in-transit': return <Truck size={16} color="#5856D6" />;
            case 'delivered': return <CheckCircle size={16} color="#34C759" />;
            case 'cancelled': return <AlertCircle size={16} color="#FF3B30" />;
            default: return <Package size={16} color="#8E8E93" />;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            order.customer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === 'all' || order.status === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const handleOrderAction = (orderId: string, action: string) => {
        Alert.alert(
            'Order Action',
            `${action} order ${orderId}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => console.log(`${action} order ${orderId}`) }
            ]
        );
    };

    const renderOrderCard = (order: Order) => (
        <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard}
            onPress={() => setSelectedOrder(order)}
        >
            <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <View style={styles.statusContainer}>
                        {getStatusIcon(order.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                            {order.status.replace('-', ' ').toUpperCase()}
                        </Text>
                    </View>
                </View>
                <View style={styles.orderActions}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(order.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(order.priority) }]}>
                            {order.priority.toUpperCase()}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                        <MoreVertical size={16} color="#8E8E93" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.customerInfo}>
                <User size={14} color="#8E8E93" />
                <Text style={styles.customerName}>{order.customer}</Text>
                <Phone size={14} color="#8E8E93" />
                <Text style={styles.customerPhone}>{order.customerPhone}</Text>
            </View>

            <View style={styles.routeInfo}>
                <View style={styles.routeItem}>
                    <View style={styles.routePoint}>
                        <View style={styles.pickupPoint} />
                    </View>
                    <View style={styles.routeDetails}>
                        <Text style={styles.routeLabel}>Pickup</Text>
                        <Text style={styles.routeAddress} numberOfLines={1}>{order.pickup.address}</Text>
                        <Text style={styles.routeTime}>{order.pickup.date} at {order.pickup.time}</Text>
                    </View>
                </View>
                
                <View style={styles.routeLine} />
                
                <View style={styles.routeItem}>
                    <View style={styles.routePoint}>
                        <View style={styles.deliveryPoint} />
                    </View>
                    <View style={styles.routeDetails}>
                        <Text style={styles.routeLabel}>Delivery</Text>
                        <Text style={styles.routeAddress} numberOfLines={1}>{order.delivery.address}</Text>
                        <Text style={styles.routeTime}>{order.delivery.date} at {order.delivery.time}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.orderMeta}>
                <View style={styles.metaItem}>
                    <DollarSign size={14} color="#8E8E93" />
                    <Text style={styles.metaText}>${order.value.toFixed(2)}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Package size={14} color="#8E8E93" />
                    <Text style={styles.metaText}>{order.items} items</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaText}>{order.weight}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.serviceText}>{order.service}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderFilterModal = () => (
        <Modal visible={showFilterModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filter Orders</Text>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Text style={styles.modalClose}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.filterOptions}>
                        {filterOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.filterOption,
                                    selectedFilter === option.value && styles.selectedFilter
                                ]}
                                onPress={() => {
                                    setSelectedFilter(option.value);
                                    setShowFilterModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    selectedFilter === option.value && styles.selectedFilterText
                                ]}>
                                    {option.label}
                                </Text>
                                <Text style={styles.filterCount}>{option.count}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Orders</Text>
                <TouchableOpacity style={styles.newOrderButton}>
                    <Plus size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Filter size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{filteredOrders.length}</Text>
                    <Text style={styles.statLabel}>
                        {selectedFilter === 'all' ? 'Total' : selectedFilter.replace('-', ' ')}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        ${filteredOrders.reduce((sum, order) => sum + order.value, 0).toFixed(0)}
                    </Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {filteredOrders.filter(o => o.status === 'delivered').length}
                    </Text>
                    <Text style={styles.statLabel}>Delivered</Text>
                </View>
            </View>

            {/* Orders List */}
            <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
                {filteredOrders.map(renderOrderCard)}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {renderFilterModal()}
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000000',
    },
    newOrderButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000000',
    },
    filterButton: {
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginVertical: 16,
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
    statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRightWidth: 1,
        borderRightColor: '#F2F2F7',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
        textTransform: 'capitalize',
    },
    ordersList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    moreButton: {
        padding: 4,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    customerName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        marginRight: 12,
    },
    customerPhone: {
        fontSize: 14,
        color: '#8E8E93',
    },
    routeInfo: {
        marginBottom: 16,
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routePoint: {
        width: 20,
        alignItems: 'center',
        marginRight: 12,
        paddingTop: 2,
    },
    pickupPoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#34C759',
    },
    deliveryPoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF9500',
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#E5E5EA',
        marginLeft: 18,
        marginVertical: 4,
    },
    routeDetails: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 2,
    },
    routeAddress: {
        fontSize: 14,
        color: '#000000',
        marginBottom: 2,
    },
    routeTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    serviceText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    modalClose: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    filterOptions: {
        padding: 20,
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    selectedFilter: {
        backgroundColor: '#E3F2FD',
    },
    filterOptionText: {
        fontSize: 16,
        color: '#000000',
    },
    selectedFilterText: {
        color: '#007AFF',
        fontWeight: '500',
    },
    filterCount: {
        fontSize: 14,
        color: '#8E8E93',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 24,
        textAlign: 'center',
    },
    bottomPadding: {
        height: 100,
    },
});

export default OrdersScreen;