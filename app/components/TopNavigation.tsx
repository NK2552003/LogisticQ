import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Pressable,
    Animated,
    Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Menu,
    X,
    MessageCircle,
    Package,
    TimerReset,
    LocateIcon,
} from 'lucide-react-native';

interface TopNavigationProps {
    isVisible: boolean;
    onClose: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ isVisible, onClose }) => {
    const router = useRouter();
    const [animation] = useState(new Animated.Value(0));

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

    const navigateToScreen = (screenName: string) => {
        onClose();
        // Small delay to allow modal to close smoothly
        setTimeout(() => {
            router.push(`/(root)/(tabs)/${screenName}` as any);
        }, 200);
    };

    const menuItems = [
        {
            name: 'Chat',
            route: 'chat',
            icon: MessageCircle,
            description: 'Messages and conversations',
        },
        {
            name: 'Orders',
            route: 'orders',
            icon: Package,
            description: 'Manage your orders',
        },
        {
            name: 'History',
            route: 'history',
            icon: TimerReset,
            description: 'View past activities',
        },
        {
            name: 'Tracking',
            route: 'tracking',
            icon: LocateIcon,
            description: 'Track shipments',
        },
    ];

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

                    <View style={styles.menuItems}>
                        <View style={styles.gridContainer}>
                            {menuItems.map((item, index) => (
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
                    </View>
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