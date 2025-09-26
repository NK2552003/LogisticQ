import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Pressable,
    Animated,
    Easing,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import {
    Menu,
    X,
    MessageCircle,
    Package,
    TimerReset,
    LocateIcon,
    Truck,
    BarChart3,
    DollarSign,
    Users,
    CreditCard,
    AlertTriangle,
    Star,
    Settings,
    HelpCircle,
    Phone,
    FileText,
    MapPin,
    ShoppingCart,
    Building,
} from 'lucide-react-native';
import { fetchAPI } from '../lib/fetch';

interface TopNavigationProps {
    isVisible: boolean;
    onClose: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ isVisible, onClose }) => {
    const router = useRouter();
    const { user } = useUser();
    const [animation] = useState(new Animated.Value(0));
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        if (user?.id) {
            fetchUserProfile();
        }
    }, [user?.id]);

    React.useEffect(() => {
        if (isVisible) {
            Animated.timing(animation, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(animation, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

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

    const navigateToScreen = (screenName: string) => {
        onClose();
        // Small delay to allow modal to close smoothly
        setTimeout(() => {
            router.push(`/(root)/(tabs)/${screenName}` as any);
        }, 200);
    };

    const getMenuItems = () => {
        const commonItems = [
            {
                name: 'Chat',
                route: 'chat',
                icon: MessageCircle,
                description: 'Messages & Support',
                category: 'communication'
            },
            {
                name: 'Tracking',
                route: 'tracking',
                icon: LocateIcon,
                description: 'Track Shipments',
                category: 'logistics'
            },
            {
                name: 'History',
                route: 'history',
                icon: TimerReset,
                description: 'Past Activities',
                category: 'records'
            },
            {
                name: 'Call Logs',
                route: 'call-logs',
                icon: Phone,
                description: 'Call History',
                category: 'communication'
            },
            {
                name: 'Helpline',
                route: 'helpline',
                icon: HelpCircle,
                description: 'Get Support',
                category: 'support'
            },
            {
                name: 'Settings',
                route: 'settings',
                icon: Settings,
                description: 'App Settings',
                category: 'account'
            },
        ];

        const roleSpecificItems = [];

        if (userProfile?.role === 'customer' || userProfile?.role === 'business') {
            roleSpecificItems.push(
                {
                    name: 'Orders',
                    route: 'orders',
                    icon: ShoppingCart,
                    description: 'My Orders',
                    category: 'logistics'
                },
                {
                    name: 'Shipments',
                    route: 'shipments',
                    icon: Package,
                    description: 'My Shipments',
                    category: 'logistics'
                },
                {
                    name: 'Payments',
                    route: 'payments',
                    icon: CreditCard,
                    description: 'Payment History',
                    category: 'financial'
                },
                {
                    name: 'Pricing',
                    route: 'pricing',
                    icon: DollarSign,
                    description: 'Service Pricing',
                    category: 'information'
                },
                {
                    name: 'Ratings',
                    route: 'ratings',
                    icon: Star,
                    description: 'Rate Services',
                    category: 'feedback'
                }
            );
        }

        if (userProfile?.role === 'business') {
            roleSpecificItems.push(
                {
                    name: 'Analytics',
                    route: 'analytics',
                    icon: BarChart3,
                    description: 'Business Analytics',
                    category: 'insights'
                },
                {
                    name: 'Invoices',
                    route: 'invoices',
                    icon: FileText,
                    description: 'Billing & Invoices',
                    category: 'financial'
                }
            );
        }

        if (userProfile?.role === 'transporter') {
            roleSpecificItems.push(
                {
                    name: 'Jobs',
                    route: 'jobs',
                    icon: Truck,
                    description: 'Available Jobs',
                    category: 'work'
                },
                {
                    name: 'Earnings',
                    route: 'earnings',
                    icon: DollarSign,
                    description: 'My Earnings',
                    category: 'financial'
                },
                {
                    name: 'Shipments',
                    route: 'shipments',
                    icon: Package,
                    description: 'My Deliveries',
                    category: 'work'
                }
            );
        }

        if (userProfile?.role === 'admin') {
            roleSpecificItems.push(
                {
                    name: 'Users',
                    route: 'users',
                    icon: Users,
                    description: 'User Management',
                    category: 'admin'
                },
                {
                    name: 'Analytics',
                    route: 'analytics',
                    icon: BarChart3,
                    description: 'Platform Analytics',
                    category: 'insights'
                },
                {
                    name: 'Shipments',
                    route: 'shipments',
                    icon: Package,
                    description: 'All Shipments',
                    category: 'logistics'
                },
                {
                    name: 'Disputes',
                    route: 'disputes',
                    icon: AlertTriangle,
                    description: 'Handle Disputes',
                    category: 'admin'
                }
            );
        }

        return [...roleSpecificItems, ...commonItems];
    };

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 0],
    });

    const opacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Animated.View
                    style={[
                        styles.menuContainer,
                        {
                            transform: [{ translateY }],
                            opacity,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>More Options</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color="#666" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
                        <View style={styles.gridContainer}>
                            {getMenuItems().map((item, index) => (
                                <TouchableOpacity
                                    key={item.route}
                                    style={styles.gridItem}
                                    onPress={() => navigateToScreen(item.route)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.gridIconContainer}>
                                        <item.icon color="#FACC15" size={24} strokeWidth={2} />
                                    </View>
                                    <Text style={styles.gridItemTitle}>{item.name}</Text>
                                    <Text style={styles.gridItemDescription}>
                                        {item.description}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    menuContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 60,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    menuItems: {
        maxHeight: 400,
        padding: 12,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    gridIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    gridItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    gridItemDescription: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        lineHeight: 14,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#f9f9f9',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    textContainer: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    menuItemDescription: {
        fontSize: 12,
        color: '#666',
    },
});

export default TopNavigation;