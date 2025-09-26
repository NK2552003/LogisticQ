import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Switch,
    Alert,
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
    Edit3
} from 'lucide-react-native';

interface ProfileOption {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
}

const Profile = () => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [locationEnabled, setLocationEnabled] = React.useState(true);

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

    const profileStats = [
        { label: 'Deliveries', value: '247' },
        { label: 'Rating', value: '4.8' },
        { label: 'Years', value: '2.5' }
    ];

    const profileOptions: ProfileOption[] = [
        {
            id: 'personal',
            title: 'Personal Information',
            subtitle: 'Update your personal details',
            icon: <User size={20} color="#007AFF" />,
            action: () => console.log('Personal Info'),
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
                    onValueChange={setNotificationsEnabled}
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
                    onValueChange={setLocationEnabled}
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
            action: () => console.log('Security'),
            showArrow: true
        },
        {
            id: 'help',
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            icon: <HelpCircle size={20} color="#007AFF" />,
            action: () => console.log('Help'),
            showArrow: true
        }
    ];

    const renderStatItem = (stat: { label: string; value: string }, index: number) => (
        <View key={index} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
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
});

export default Profile;