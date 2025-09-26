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
    TextInput,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import {
    Users,
    Search,
    Filter,
    Shield,
    CheckCircle,
    XCircle,
    User,
    Truck,
    Building,
    Star,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Edit,
    Trash2,
    Eye,
    Plus,
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

interface UserData {
    id: string;
    clerk_user_id: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    full_name?: string;
    business_name?: string;
    business_type?: string;
    vehicle_type?: string;
    vehicle_number?: string;
    license_number?: string;
    address?: string;
    rating?: number;
    total_jobs?: number;
    created_at: string;
    updated_at: string;
}

const UsersScreen = () => {
    const { user } = useUser();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userProfile?.role === 'admin') {
            fetchUsers();
        }
    }, [userProfile]);

    useEffect(() => {
        filterUsers();
    }, [users, searchQuery, activeFilter]);

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

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetchAPI('/users');
            if (response.success) {
                setUsers(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = [...users];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user =>
                user.email.toLowerCase().includes(query) ||
                user.full_name?.toLowerCase().includes(query) ||
                user.business_name?.toLowerCase().includes(query) ||
                user.phone?.toLowerCase().includes(query) ||
                user.vehicle_number?.toLowerCase().includes(query)
            );
        }

        // Filter by role/status
        if (activeFilter !== 'all') {
            if (['customer', 'business', 'transporter', 'admin'].includes(activeFilter)) {
                filtered = filtered.filter(user => user.role === activeFilter);
            } else if (['active', 'pending', 'suspended', 'rejected'].includes(activeFilter)) {
                filtered = filtered.filter(user => user.status === activeFilter);
            }
        }

        setFilteredUsers(filtered);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    }, [fetchUsers]);

    const handleUserAction = async (userData: UserData, action: string) => {
        try {
            let endpoint = '';
            let body = {};

            switch (action) {
                case 'approve':
                    endpoint = `/users/${userData.id}`;
                    body = { status: 'active' };
                    break;
                case 'reject':
                    endpoint = `/users/${userData.id}`;
                    body = { status: 'rejected' };
                    break;
                case 'suspend':
                    endpoint = `/users/${userData.id}`;
                    body = { status: 'suspended' };
                    break;
                case 'activate':
                    endpoint = `/users/${userData.id}`;
                    body = { status: 'active' };
                    break;
                case 'delete':
                    Alert.alert(
                        'Delete User',
                        `Are you sure you want to delete ${userData.full_name || userData.email}?`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                    const response = await fetchAPI(`/users/${userData.id}`, {
                                        method: 'DELETE'
                                    });
                                    if (response.success) {
                                        Alert.alert('Success', 'User deleted successfully');
                                        fetchUsers();
                                    } else {
                                        Alert.alert('Error', 'Failed to delete user');
                                    }
                                }
                            }
                        ]
                    );
                    return;
                default:
                    return;
            }

            const response = await fetchAPI(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.success) {
                Alert.alert('Success', `User ${action}d successfully`);
                fetchUsers();
            } else {
                Alert.alert('Error', `Failed to ${action} user`);
            }
        } catch (error) {
            Alert.alert('Error', `Failed to ${action} user`);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield size={16} color="#8B5CF6" />;
            case 'business': return <Building size={16} color="#007AFF" />;
            case 'transporter': return <Truck size={16} color="#10B981" />;
            case 'customer': return <User size={16} color="#8E8E93" />;
            default: return <User size={16} color="#8E8E93" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'pending': return '#FACC15';
            case 'suspended': return '#EF4444';
            case 'rejected': return '#EF4444';
            default: return '#8E8E93';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle size={16} color="#10B981" />;
            case 'pending': return <Eye size={16} color="#FACC15" />;
            case 'suspended': return <XCircle size={16} color="#EF4444" />;
            case 'rejected': return <XCircle size={16} color="#EF4444" />;
            default: return <Eye size={16} color="#8E8E93" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getFilterCount = (filter: string) => {
        if (filter === 'all') return users.length;
        if (['customer', 'business', 'transporter', 'admin'].includes(filter)) {
            return users.filter(u => u.role === filter).length;
        }
        return users.filter(u => u.status === filter).length;
    };

    const renderFilterChip = (filter: string, label: string) => (
        <TouchableOpacity
            key={filter}
            style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive
            ]}
            onPress={() => setActiveFilter(filter)}
        >
            <Text style={[
                styles.filterChipText,
                activeFilter === filter && styles.filterChipTextActive
            ]}>
                {label} ({getFilterCount(filter)})
            </Text>
        </TouchableOpacity>
    );

    const renderUserCard = (userData: UserData) => (
        <View key={userData.id} style={styles.userCard}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                        {userData.full_name || userData.business_name || userData.email}
                    </Text>
                    <View style={styles.userMeta}>
                        {getRoleIcon(userData.role)}
                        <Text style={styles.roleText}>
                            {userData.role.toUpperCase()}
                        </Text>
                        {getStatusIcon(userData.status)}
                        <Text style={[
                            styles.statusText,
                            { color: getStatusColor(userData.status) }
                        ]}>
                            {userData.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <View style={styles.userStats}>
                    {userData.rating && (
                        <View style={styles.ratingContainer}>
                            <Star size={12} color="#FACC15" />
                            <Text style={styles.ratingText}>{userData.rating.toFixed(1)}</Text>
                        </View>
                    )}
                    <Text style={styles.joinDate}>
                        Joined {formatDate(userData.created_at)}
                    </Text>
                </View>
            </View>

            {/* Contact Info */}
            <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                    <Mail size={14} color="#8E8E93" />
                    <Text style={styles.contactText}>{userData.email}</Text>
                </View>
                {userData.phone && (
                    <View style={styles.contactItem}>
                        <Phone size={14} color="#8E8E93" />
                        <Text style={styles.contactText}>{userData.phone}</Text>
                    </View>
                )}
                {userData.address && (
                    <View style={styles.contactItem}>
                        <MapPin size={14} color="#8E8E93" />
                        <Text style={styles.contactText} numberOfLines={1}>
                            {userData.address}
                        </Text>
                    </View>
                )}
            </View>

            {/* Role-specific Info */}
            {userData.role === 'business' && userData.business_type && (
                <View style={styles.businessInfo}>
                    <Text style={styles.businessType}>
                        Business Type: {userData.business_type}
                    </Text>
                </View>
            )}

            {userData.role === 'transporter' && (
                <View style={styles.transporterInfo}>
                    {userData.vehicle_type && (
                        <Text style={styles.vehicleInfo}>
                            Vehicle: {userData.vehicle_type}
                        </Text>
                    )}
                    {userData.vehicle_number && (
                        <Text style={styles.vehicleInfo}>
                            Number: {userData.vehicle_number}
                        </Text>
                    )}
                    {userData.total_jobs && (
                        <Text style={styles.vehicleInfo}>
                            Jobs Completed: {userData.total_jobs}
                        </Text>
                    )}
                </View>
            )}

            {/* Actions */}
            <View style={styles.cardActions}>
                {userData.status === 'pending' && (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleUserAction(userData, 'approve')}
                        >
                            <CheckCircle size={16} color="#FFFFFF" />
                            <Text style={[styles.actionButtonText, styles.whiteText]}>
                                Approve
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleUserAction(userData, 'reject')}
                        >
                            <XCircle size={16} color="#FFFFFF" />
                            <Text style={[styles.actionButtonText, styles.whiteText]}>
                                Reject
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {userData.status === 'active' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.suspendButton]}
                        onPress={() => handleUserAction(userData, 'suspend')}
                    >
                        <XCircle size={16} color="#FFFFFF" />
                        <Text style={[styles.actionButtonText, styles.whiteText]}>
                            Suspend
                        </Text>
                    </TouchableOpacity>
                )}

                {userData.status === 'suspended' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.activateButton]}
                        onPress={() => handleUserAction(userData, 'activate')}
                    >
                        <CheckCircle size={16} color="#FFFFFF" />
                        <Text style={[styles.actionButtonText, styles.whiteText]}>
                            Activate
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleUserAction(userData, 'delete')}
                >
                    <Trash2 size={16} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.whiteText]}>
                        Delete
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
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

    if (userProfile.role !== 'admin') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.notAuthorizedContainer}>
                    <Shield size={48} color="#8E8E93" />
                    <Text style={styles.notAuthorizedTitle}>Access Denied</Text>
                    <Text style={styles.notAuthorizedText}>
                        This feature is only available for administrators
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>User Management</Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Search size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
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
                {renderFilterChip('active', 'Active')}
                {renderFilterChip('suspended', 'Suspended')}
                {renderFilterChip('customer', 'Customers')}
                {renderFilterChip('business', 'Businesses')}
                {renderFilterChip('transporter', 'Transporters')}
                {renderFilterChip('admin', 'Admins')}
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
                        <Text style={styles.loadingText}>Loading users...</Text>
                    </View>
                ) : filteredUsers.length > 0 ? (
                    <View style={styles.usersList}>
                        {filteredUsers.map(renderUserCard)}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Users size={48} color="#8E8E93" />
                        <Text style={styles.emptyStateTitle}>
                            {searchQuery || activeFilter !== 'all' ? 'No matching users' : 'No users found'}
                        </Text>
                        <Text style={styles.emptyStateText}>
                            {searchQuery || activeFilter !== 'all' 
                                ? 'Try adjusting your search or filters'
                                : 'Users will appear here once they register'
                            }
                        </Text>
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
    notAuthorizedContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    notAuthorizedTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginTop: 16,
        marginBottom: 8,
    },
    notAuthorizedText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
    },
    usersList: {
        padding: 20,
        gap: 16,
    },
    userCard: {
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
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    userMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    userStats: {
        alignItems: 'flex-end',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginBottom: 2,
    },
    ratingText: {
        fontSize: 12,
        color: '#FACC15',
        fontWeight: '600',
    },
    joinDate: {
        fontSize: 12,
        color: '#8E8E93',
    },
    contactInfo: {
        marginBottom: 12,
        gap: 6,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: {
        fontSize: 14,
        color: '#000000',
        flex: 1,
    },
    businessInfo: {
        marginBottom: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    businessType: {
        fontSize: 12,
        color: '#8E8E93',
    },
    transporterInfo: {
        marginBottom: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        gap: 2,
    },
    vehicleInfo: {
        fontSize: 12,
        color: '#8E8E93',
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
        gap: 4,
    },
    approveButton: {
        backgroundColor: '#10B981',
    },
    rejectButton: {
        backgroundColor: '#EF4444',
    },
    suspendButton: {
        backgroundColor: '#EF4444',
    },
    activateButton: {
        backgroundColor: '#10B981',
    },
    deleteButton: {
        backgroundColor: '#8E8E93',
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    whiteText: {
        color: '#FFFFFF',
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
    },
});

export default UsersScreen;