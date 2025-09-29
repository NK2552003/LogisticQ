import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Platform,
    SafeAreaView,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { 
    Home, 
    Phone, 
    Headphones, 
    User, 
    Menu,
    ChevronUp,
    ChevronDown
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CollapsibleTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
}

const CollapsibleTabBar: React.FC<CollapsibleTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [autoHideTimeout, setAutoHideTimeout] = useState<number | null>(null);
    const translateY = useRef(new Animated.Value(100)).current;

    const showTabBar = () => {
        setIsVisible(true);
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();

        // Auto-hide after 5 seconds
        if (autoHideTimeout) {
            clearTimeout(autoHideTimeout);
        }
        const timeout = setTimeout(() => {
            hideTabBar();
        }, 5000);
        setAutoHideTimeout(timeout);
    };

    const hideTabBar = () => {
        Animated.spring(translateY, {
            toValue: 100,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start(() => {
            setIsVisible(false);
        });

        if (autoHideTimeout) {
            clearTimeout(autoHideTimeout);
            setAutoHideTimeout(null);
        }
    };

    const toggleTabBar = () => {
        if (isVisible) {
            hideTabBar();
        } else {
            showTabBar();
        }
    };

    const getTabIcon = (routeName: string, color: string, focused: boolean) => {
        const size = focused ? 26 : 24;
        const strokeWidth = focused ? 2.2 : 2;

        switch (routeName) {
            case 'home':
                return <Home color={color} size={size} strokeWidth={strokeWidth} />;
            case 'call-logs':
                return <Phone color={color} size={size} strokeWidth={strokeWidth} />;
            case 'helpline':
                return <Headphones color={color} size={size} strokeWidth={strokeWidth} />;
            case 'profile':
                return <User color={color} size={size} strokeWidth={strokeWidth} />;
            case 'more':
                return (
                    <View style={{ position: 'relative' }}>
                        <Menu color={color} size={size} strokeWidth={strokeWidth} />
                        <View style={styles.badge} />
                    </View>
                );
            default:
                return <Home color={color} size={size} strokeWidth={strokeWidth} />;
        }
    };

    const visibleTabs = ['home', 'call-logs', 'helpline', 'profile', 'more'];

    return (
        <>
            {/* Push-up Button */}
            <TouchableOpacity
                style={[
                    styles.pushUpButton,
                    {
                        opacity: isVisible ? 0 : 1,
                        transform: [{ scale: isVisible ? 0 : 1 }],
                    },
                ]}
                onPress={showTabBar}
                disabled={isVisible}
            >
                <View style={styles.pushUpButtonInner}>
                    <ChevronUp color="#FFFFFF" size={24} strokeWidth={2.5} />
                </View>
            </TouchableOpacity>

            {/* Collapsible Tab Bar */}
            <Animated.View
                style={[
                    styles.tabBarContainer,
                    {
                        transform: [{ translateY }],
                        opacity: isVisible ? 1 : 0,
                    },
                ]}
                pointerEvents={isVisible ? 'auto' : 'none'}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.tabBar}>
                        {/* Hide Button */}
                        <TouchableOpacity
                            style={styles.hideButton}
                            onPress={hideTabBar}
                        >
                            <ChevronDown color="#64748B" size={20} strokeWidth={2} />
                        </TouchableOpacity>

                        {/* Tab Items */}
                        <View style={styles.tabItems}>
                            {state.routes
                                .filter((route: any) => visibleTabs.includes(route.name))
                                .map((route: any, index: number) => {
                                    const { options } = descriptors[route.key];
                                    const label = options.tabBarLabel !== undefined
                                        ? options.tabBarLabel
                                        : options.title !== undefined
                                        ? options.title
                                        : route.name;

                                    const isFocused = state.index === state.routes.indexOf(route);

                                    const onPress = () => {
                                        const event = navigation.emit({
                                            type: 'tabPress',
                                            target: route.key,
                                            canPreventDefault: true,
                                        });

                                        if (!isFocused && !event.defaultPrevented) {
                                            navigation.navigate(route.name);
                                        }

                                        // Keep tab bar open when navigating
                                        if (autoHideTimeout) {
                                            clearTimeout(autoHideTimeout);
                                        }
                                        const timeout = setTimeout(() => {
                                            hideTabBar();
                                        }, 5000);
                                        setAutoHideTimeout(timeout);
                                    };

                                    const color = isFocused ? '#FACC15' : '#64748B';

                                    return (
                                        <TouchableOpacity
                                            key={route.key}
                                            style={[
                                                styles.tabItem,
                                                isFocused && styles.tabItemFocused,
                                            ]}
                                            onPress={onPress}
                                        >
                                            {getTabIcon(route.name, color, isFocused)}
                                            <Text
                                                style={[
                                                    styles.tabLabel,
                                                    { color },
                                                    isFocused && styles.tabLabelFocused,
                                                ]}
                                            >
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                        </View>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    pushUpButton: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        alignSelf: 'center',
        zIndex: 1000,
    },
    pushUpButtonInner: {
        backgroundColor: '#FACC15',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 12,
    },
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
    },
    safeArea: {
        backgroundColor: 'transparent',
    },
    tabBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: Platform.OS === 'ios' ? 0 : 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 12,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    },
    hideButton: {
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    tabItems: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 12,
        marginHorizontal: 2,
    },
    tabItemFocused: {
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    tabLabelFocused: {
        fontWeight: '700',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
    },
});

export default CollapsibleTabBar;