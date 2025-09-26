import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Switch,
    StyleSheet,
    Alert,
    Share,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
    Settings,
    User,
    Bell,
    MapPin,
    Moon,
    Globe,
    Shield,
    HelpCircle,
    Share2,
    LogOut,
    ChevronRight,
    Smartphone,
    Mail,
    Lock,
    Database,
    Trash2,
    Download,
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

const SettingsScreen = () => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [settings, setSettings] = useState({
        notifications: {
            push: true,
            email: true,
            sms: false,
            orderUpdates: true,
            promotional: false,
        },
        location: {
            tracking: true,
            shareLocation: true,
        },
        preferences: {
            darkMode: false,
            language: 'English',
            units: 'Metric',
        },
    });

    useEffect(() => {
        fetchUserProfile();
        loadSettings();
    }, []);

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

    const loadSettings = () => {
        // In a real app, load settings from AsyncStorage or API
        console.log('Loading user settings...');
    };

    const updateSetting = (category: string, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category as keyof typeof prev],
                [key]: value,
            },
        }));
        // In a real app, save to AsyncStorage or API
        console.log(`Updated ${category}.${key} to:`, value);
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/(auth)/sign-in');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to sign out');
                        }
                    },
                },
            ]
        );
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out LogisticQ - The best logistics platform! Download now.',
                url: 'https://logisticq.com', // Replace with actual app store URL
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all associated data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Account Deletion', 'Please contact support to delete your account.');
                    },
                },
            ]
        );
    };

    const renderSettingItem = (
        icon: React.ComponentType<any>,
        title: string,
        subtitle?: string,
        onPress?: () => void,
        rightComponent?: React.ReactNode,
        showChevron = true
    ) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                    {React.createElement(icon, { size: 20, color: '#007AFF' })}
                </View>
                <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.settingRight}>
                {rightComponent}
                {showChevron && onPress && (
                    <ChevronRight size={16} color="#8E8E93" style={{ marginLeft: 8 }} />
                )}
            </View>
        </TouchableOpacity>
    );

    const renderSwitchItem = (
        icon: React.ComponentType<any>,
        title: string,
        subtitle: string,
        value: boolean,
        onValueChange: (value: boolean) => void
    ) => (
        renderSettingItem(
            icon,
            title,
            subtitle,
            undefined,
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
            />,
            false
        )
    );

    const renderSection = (title: string, children: React.ReactNode) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                {renderSection('Account', (
                    <>
                        {renderSettingItem(
                            User,
                            'Edit Profile',
                            'Update your personal information',
                            () => router.push('/(root)/(tabs)/profile')
                        )}
                        {renderSettingItem(
                            Mail,
                            'Email',
                            user?.emailAddresses[0]?.emailAddress || 'Not set'
                        )}
                        {renderSettingItem(
                            Smartphone,
                            'Phone',
                            userProfile?.phone || 'Not set'
                        )}
                    </>
                ))}

                {/* Notifications Section */}
                {renderSection('Notifications', (
                    <>
                        {renderSwitchItem(
                            Bell,
                            'Push Notifications',
                            'Receive push notifications',
                            settings.notifications.push,
                            (value) => updateSetting('notifications', 'push', value)
                        )}
                        {renderSwitchItem(
                            Mail,
                            'Email Notifications',
                            'Receive email updates',
                            settings.notifications.email,
                            (value) => updateSetting('notifications', 'email', value)
                        )}
                        {renderSwitchItem(
                            Smartphone,
                            'SMS Notifications',
                            'Receive SMS updates',
                            settings.notifications.sms,
                            (value) => updateSetting('notifications', 'sms', value)
                        )}
                        {renderSwitchItem(
                            Bell,
                            'Order Updates',
                            'Get notified about order status',
                            settings.notifications.orderUpdates,
                            (value) => updateSetting('notifications', 'orderUpdates', value)
                        )}
                    </>
                ))}

                {/* Location Section */}
                {renderSection('Location & Privacy', (
                    <>
                        {renderSwitchItem(
                            MapPin,
                            'Location Tracking',
                            'Allow location tracking for better service',
                            settings.location.tracking,
                            (value) => updateSetting('location', 'tracking', value)
                        )}
                        {renderSwitchItem(
                            MapPin,
                            'Share Location',
                            'Share location with drivers during delivery',
                            settings.location.shareLocation,
                            (value) => updateSetting('location', 'shareLocation', value)
                        )}
                        {renderSettingItem(
                            Shield,
                            'Privacy Policy',
                            'Read our privacy policy',
                            () => Alert.alert('Privacy Policy', 'Privacy policy would be shown here')
                        )}
                    </>
                ))}

                {/* Preferences Section */}
                {renderSection('Preferences', (
                    <>
                        {renderSwitchItem(
                            Moon,
                            'Dark Mode',
                            'Use dark appearance',
                            settings.preferences.darkMode,
                            (value) => updateSetting('preferences', 'darkMode', value)
                        )}
                        {renderSettingItem(
                            Globe,
                            'Language',
                            settings.preferences.language,
                            () => Alert.alert('Language', 'Language selection would be shown here')
                        )}
                        {renderSettingItem(
                            Database,
                            'Units',
                            settings.preferences.units,
                            () => Alert.alert('Units', 'Unit selection would be shown here')
                        )}
                    </>
                ))}

                {/* Support Section */}
                {renderSection('Support', (
                    <>
                        {renderSettingItem(
                            HelpCircle,
                            'Help Center',
                            'Get help and support',
                            () => router.push('/(root)/(tabs)/helpline')
                        )}
                        {renderSettingItem(
                            Share2,
                            'Share App',
                            'Tell your friends about LogisticQ',
                            handleShare
                        )}
                        {renderSettingItem(
                            Download,
                            'Export Data',
                            'Download your data',
                            () => Alert.alert('Export Data', 'Data export would be initiated here')
                        )}
                    </>
                ))}

                {/* Danger Zone */}
                {renderSection('Account Management', (
                    <>
                        {renderSettingItem(
                            LogOut,
                            'Sign Out',
                            'Sign out of your account',
                            handleSignOut,
                            undefined,
                            true
                        )}
                        {renderSettingItem(
                            Trash2,
                            'Delete Account',
                            'Permanently delete your account',
                            handleDeleteAccount,
                            undefined,
                            true
                        )}
                    </>
                ))}

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>LogisticQ v1.0.0</Text>
                    <Text style={styles.appInfoText}>© 2024 LogisticQ. All rights reserved.</Text>
                </View>
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
    content: {
        flex: 1,
    },
    section: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 20,
        marginBottom: 8,
    },
    sectionContent: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingContent: {
        marginLeft: 12,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    appInfoText: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 4,
        textAlign: 'center',
    },
});

export default SettingsScreen;