import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Switch,
    Alert,
    ActivityIndicator,
    TextInput,
    Modal,
    Image,
} from 'react-native';
import { useUser, useAuth } from "@clerk/clerk-expo";
import { 
    User, 
    Settings, 
    Bell, 
    Shield, 
    HelpCircle, 
    LogOut,
    ChevronRight,
    Star,
    Award,
    MapPin,
    Phone,
    Mail,
    Camera,
    Edit3,
    Truck,
    Package,
    DollarSign,
    Calendar,
    TrendingUp,
    CheckCircle,
    Clock
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

interface ProfileOption {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
}

interface UserProfile {
    id: string;
    role: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    name?: string;
    profile_image_url?: string;
    profile_completed: boolean;
    created_at: string;
    updated_at: string;
}

interface BusinessProfile {
    company_name?: string;
    business_type?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    tax_id?: string;
}

interface TransporterProfile {
    vehicle_type?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    license_plate?: string;
    driver_license?: string;
    vehicle_capacity_kg?: number;
    is_verified?: boolean;
    rating?: number;
    total_deliveries?: number;
    is_available?: boolean;
}

interface CustomerProfile {
    preferred_delivery_address?: string;
    delivery_instructions?: string;
}

interface ProfileStats {
    totalOrders?: number;
    completedDeliveries?: number;
    totalEarnings?: number;
    rating?: number;
    joinDate?: string;
    activeOrders?: number;
}

const Profile = () => {
    const { user } = useUser();
    const { signOut } = useAuth();
    
    // State Management
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
    const [transporterProfile, setTransporterProfile] = useState<TransporterProfile | null>(null);
    const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
    const [profileStatsData, setProfileStatsData] = useState<ProfileStats>({});
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingField, setEditingField] = useState<string>('');
    const [editValue, setEditValue] = useState<string>('');

    // Mock data for when API is unavailable
    const mockProfileStats = {
        totalOrders: 247,
        completedDeliveries: 234,
        totalEarnings: 8640,
        rating: 4.8,
        joinDate: 'Jan 2022',
        activeOrders: 3
    };

    const mockBusinessProfile = {
        company_name: 'Sample Logistics Co.',
        business_type: 'Transportation',
        address: '123 Business Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94105',
        tax_id: 'XX-XXXXXXX'
    };

    const mockTransporterProfile = {
        vehicle_type: 'Truck',
        vehicle_make: 'Ford',
        vehicle_model: 'Transit',
        vehicle_year: 2022,
        license_plate: 'ABC123',
        driver_license: 'DL123456789',
        vehicle_capacity_kg: 1500,
        is_verified: true,
        rating: 4.8,
        total_deliveries: 234,
        is_available: true
    };

    useEffect(() => {
        fetchUserProfile();
    }, [user?.id]);

    const fetchUserProfile = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // Try to fetch from API first
            try {
                const response = await fetchAPI(`/user?clerkUserId=${user.id}`);
                if (response.user) {
                    setUserProfile(response.user);
                    
                    // Fetch role-specific profile data
                    if (response.user.role === 'business') {
                        await fetchBusinessProfile(response.user.id);
                    } else if (response.user.role === 'transporter') {
                        await fetchTransporterProfile(response.user.id);
                    } else if (response.user.role === 'customer') {
                        await fetchCustomerProfile(response.user.id);
                    }
                    
                    await fetchProfileStats(response.user.id, response.user.role);
                } else {
                    // Use mock data if no user found
                    useMockData();
                }
            } catch (apiError) {
                console.log('API unavailable, using mock data');
                useMockData();
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            useMockData();
        } finally {
            setLoading(false);
        }
    };

    const useMockData = () => {
        // Create mock user profile
        const mockUser: UserProfile = {
            id: 'mock-id',
            role: 'transporter',
            first_name: user?.firstName || 'John',
            last_name: user?.lastName || 'Driver',
            email: user?.primaryEmailAddress?.emailAddress || 'john.driver@example.com',
            phone: '+1 (555) 123-4567',
            name: `${user?.firstName || 'John'} ${user?.lastName || 'Driver'}`,
            profile_image_url: user?.imageUrl,
            profile_completed: true,
            created_at: '2022-01-15T10:00:00Z',
            updated_at: new Date().toISOString()
        };
        
        setUserProfile(mockUser);
        setProfileStatsData(mockProfileStats);
        setTransporterProfile(mockTransporterProfile);
        setBusinessProfile(mockBusinessProfile);
    };

    const fetchBusinessProfile = async (userId: string) => {
        try {
            const response = await fetchAPI(`/user/business-profile?userId=${userId}`);
            if (response.profile) {
                setBusinessProfile(response.profile);
            }
        } catch (error) {
            console.error('Error fetching business profile:', error);
            setBusinessProfile(mockBusinessProfile);
        }
    };

    const fetchTransporterProfile = async (userId: string) => {
        try {
            const response = await fetchAPI(`/user/transporter-profile?userId=${userId}`);
            if (response.profile) {
                setTransporterProfile(response.profile);
            }
        } catch (error) {
            console.error('Error fetching transporter profile:', error);
            setTransporterProfile(mockTransporterProfile);
        }
    };

    const fetchCustomerProfile = async (userId: string) => {
        try {
            const response = await fetchAPI(`/user/customer-profile?userId=${userId}`);
            if (response.profile) {
                setCustomerProfile(response.profile);
            }
        } catch (error) {
            console.error('Error fetching customer profile:', error);
        }
    };

    const fetchProfileStats = async (userId: string, role: string) => {
        try {
            const response = await fetchAPI(`/user/stats?userId=${userId}&role=${role}`);
            if (response.stats) {
                setProfileStatsData(response.stats);
            }
        } catch (error) {
            console.error('Error fetching profile stats:', error);
            setProfileStatsData(mockProfileStats);
        }
    };

    const updateProfile = async (field: string, value: string) => {
        try {
            const response = await fetchAPI('/user/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userProfile?.id,
                    field,
                    value
                })
            });
            
            if (response.success) {
                // Update local state
                setUserProfile(prev => prev ? { ...prev, [field]: value } : null);
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    const handleEditField = (field: string, currentValue: string) => {
        setEditingField(field);
        setEditValue(currentValue);
        setShowEditModal(true);
    };

    const saveEditedField = () => {
        if (editingField && editValue.trim()) {
            updateProfile(editingField, editValue.trim());
        }
        setShowEditModal(false);
        setEditingField('');
        setEditValue('');
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }
            ]
        );
    };

    const getProfileStats = () => {
        if (!userProfile) return [];
        
        const joinYear = new Date(userProfile.created_at).getFullYear();
        const currentYear = new Date().getFullYear();
        const yearsActive = currentYear - joinYear;
        
        switch (userProfile.role) {
            case 'transporter':
                return [
                    { 
                        label: 'Deliveries', 
                        value: transporterProfile?.total_deliveries?.toString() || profileStatsData.completedDeliveries?.toString() || '0',
                        icon: <Package size={16} color="#007AFF" />
                    },
                    { 
                        label: 'Rating', 
                        value: transporterProfile?.rating?.toFixed(1) || profileStatsData.rating?.toFixed(1) || '5.0',
                        icon: <Star size={16} color="#FF9500" />
                    },
                    { 
                        label: 'Years Active', 
                        value: yearsActive.toString(),
                        icon: <Calendar size={16} color="#34C759" />
                    },
                    {
                        label: 'Available',
                        value: transporterProfile?.is_available ? 'Yes' : 'No',
                        icon: <CheckCircle size={16} color={transporterProfile?.is_available ? "#34C759" : "#FF3B30"} />
                    }
                ];
            case 'business':
                return [
                    { 
                        label: 'Total Orders', 
                        value: profileStatsData.totalOrders?.toString() || '0',
                        icon: <Package size={16} color="#007AFF" />
                    },
                    { 
                        label: 'Active Orders', 
                        value: profileStatsData.activeOrders?.toString() || '0',
                        icon: <Clock size={16} color="#FF9500" />
                    },
                    { 
                        label: 'Total Spent', 
                        value: `$${profileStatsData.totalEarnings?.toLocaleString() || '0'}`,
                        icon: <DollarSign size={16} color="#34C759" />
                    },
                    { 
                        label: 'Member Since', 
                        value: profileStatsData.joinDate || `${joinYear}`,
                        icon: <Calendar size={16} color="#8E8E93" />
                    }
                ];
            case 'customer':
                return [
                    { 
                        label: 'Orders', 
                        value: profileStatsData.totalOrders?.toString() || '0',
                        icon: <Package size={16} color="#007AFF" />
                    },
                    { 
                        label: 'Completed', 
                        value: profileStatsData.completedDeliveries?.toString() || '0',
                        icon: <CheckCircle size={16} color="#34C759" />
                    },
                    { 
                        label: 'Total Spent', 
                        value: `$${profileStatsData.totalEarnings?.toLocaleString() || '0'}`,
                        icon: <DollarSign size={16} color="#34C759" />
                    },
                    { 
                        label: 'Member Since', 
                        value: profileStatsData.joinDate || `${joinYear}`,
                        icon: <Calendar size={16} color="#8E8E93" />
                    }
                ];
            default:
                return [
                    { 
                        label: 'Member Since', 
                        value: `${joinYear}`,
                        icon: <Calendar size={16} color="#8E8E93" />
                    }
                ];
        }
    };

    const profileStats = getProfileStats();

    const profileOptions: ProfileOption[] = [
        {
            id: 'personal',
            title: 'Personal Information',
            subtitle: 'Update your personal details',
            icon: <User size={20} color="#007AFF" />,
            action: () => {
                Alert.alert(
                    'Personal Information',
                    'Edit your personal details here. This feature is coming soon!',
                    [{ text: 'OK' }]
                );
            },
            showArrow: true
        },
        {
            id: 'notifications',
            title: 'Push Notifications',
            subtitle: 'Receive delivery updates',
            icon: <Bell size={20} color="#007AFF" />,
            action: () => setNotificationsEnabled(!notificationsEnabled),
            rightComponent: (
                <Switch
                    value={notificationsEnabled}
                    onValueChange={(value) => {
                        setNotificationsEnabled(value);
                        Alert.alert(
                            'Notifications',
                            value ? 'Push notifications enabled' : 'Push notifications disabled',
                            [{ text: 'OK' }]
                        );
                    }}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                />
            )
        },
        {
            id: 'location',
            title: 'Location Services',
            subtitle: 'Allow location tracking',
            icon: <MapPin size={20} color="#007AFF" />,
            action: () => setLocationEnabled(!locationEnabled),
            rightComponent: (
                <Switch
                    value={locationEnabled}
                    onValueChange={(value) => {
                        setLocationEnabled(value);
                        Alert.alert(
                            'Location Services',
                            value ? 'Location tracking enabled' : 'Location tracking disabled',
                            [{ text: 'OK' }]
                        );
                    }}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                />
            )
        },
        {
            id: 'security',
            title: 'Security & Privacy',
            subtitle: 'Manage your account security',
            icon: <Shield size={20} color="#007AFF" />,
            action: () => {
                Alert.alert(
                    'Security & Privacy',
                    'Manage your password, two-factor authentication, and privacy settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => console.log('Open security settings') }
                    ]
                );
            },
            showArrow: true
        },
        {
            id: 'help',
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            icon: <HelpCircle size={20} color="#007AFF" />,
            action: () => {
                Alert.alert(
                    'Help & Support',
                    'Need assistance? We\'re here to help!',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Contact Support', onPress: () => console.log('Contact support') },
                        { text: 'View FAQ', onPress: () => console.log('View FAQ') }
                    ]
                );
            },
            showArrow: true
        }
    ];

    const renderStatItem = (stat: { label: string; value: string; icon?: React.ReactNode }, index: number) => (
        <View key={index} style={styles.statItem}>
            <View style={styles.statHeader}>
                {stat.icon}
                <Text style={styles.statValue}>{stat.value}</Text>
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
    );

    const renderProfileOption = (option: ProfileOption) => (
        <TouchableOpacity key={option.id} style={styles.optionItem} onPress={option.action}>
            <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                    {option.icon}
                </View>
                <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    {option.subtitle && (
                        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    )}
                </View>
            </View>
            <View style={styles.optionRight}>
                {option.rightComponent || (
                    option.showArrow && <ChevronRight size={16} color="#C7C7CC" />
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity style={styles.editButton}>
                        <Edit3 size={20} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileImageContainer}>
                        <View style={styles.profileImage}>
                            <User size={40} color="#8E8E93" />
                        </View>
                        <TouchableOpacity style={styles.cameraButton}>
                            <Camera size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>
                            {user?.firstName} {user?.lastName} 
                        </Text>
                        <Text style={styles.userEmail}>
                            {user?.primaryEmailAddress?.emailAddress}
                        </Text>
                        <View style={styles.userBadge}>
                            <Star size={14} color="#FF9500" />
                            <Text style={styles.badgeText}>Premium Driver</Text>
                        </View>
                    </View>
                </View>

                {/* Profile Stats */}
                <View style={styles.statsContainer}>
                    {profileStats.map(renderStatItem)}
                </View>

                {/* Contact Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.contactInfo}>
                        <View style={styles.contactItem}>
                            <Phone size={16} color="#8E8E93" />
                            <Text style={styles.contactText}>+1 (555) 123-4567</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <Mail size={16} color="#8E8E93" />
                            <Text style={styles.contactText}>
                                {user?.primaryEmailAddress?.emailAddress}
                            </Text>
                        </View>
                        <View style={styles.contactItem}>
                            <MapPin size={16} color="#8E8E93" />
                            <Text style={styles.contactText}>New York, NY</Text>
                        </View>
                    </View>
                </View>

                {/* Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <View style={styles.optionsList}>
                        {profileOptions.map(renderProfileOption)}
                    </View>
                </View>

                {/* Sign Out */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <LogOut size={20} color="#FF3B30" />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Version Info */}
                <View style={styles.versionInfo}>
                    <Text style={styles.versionText}>LogisticQ v1.0.0</Text>
                    <Text style={styles.versionSubText}>© 2024 LogisticQ Inc.</Text>
                </View>

                {/* Bottom Padding */}
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
    editButton: {
        padding: 8,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    profileInfo: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 8,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FF9500',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
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
        paddingVertical: 20,
        borderRightWidth: 1,
        borderRightColor: '#F2F2F7',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#8E8E93',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },
    contactInfo: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    contactText: {
        fontSize: 16,
        color: '#000000',
    },
    optionsList: {
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
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
    },
    optionRight: {
        marginLeft: 12,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    signOutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
    versionInfo: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    versionText: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
    },
    versionSubText: {
        fontSize: 12,
        color: '#C7C7CC',
    },
    bottomPadding: {
        height: 100,
    },
    
    // Loading styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    modalCancel: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        color: '#1E293B',
    },
    modalSaveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    modalSaveText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    
    // Profile specific styles
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    vehicleInfo: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    vehicleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    vehicleText: {
        fontSize: 15,
        color: '#374151',
        flex: 1,
    },
    businessInfo: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    businessItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    businessLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        flex: 1,
    },
    businessValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '400',
        flex: 2,
        textAlign: 'right',
    },
    versionSubtext: {
        fontSize: 12,
        color: '#C7C7CC',
        textAlign: 'center',
        marginTop: 4,
    },
});

export default Profile;