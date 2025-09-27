import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Linking,
    Alert,
} from 'react-native';
import { 
    Phone, 
    MessageCircle, 
    Mail, 
    Clock, 
    HeadphonesIcon,
    Users,
    AlertCircle,
    BookOpen
} from 'lucide-react-native';

interface HelplineContact {
    id: string;
    title: string;
    description: string;
    phone: string;
    email?: string;
    hours: string;
    icon: React.ReactNode;
    type: 'emergency' | 'support' | 'general';
}

const HelplineScreen = () => {
    const helplineContacts: HelplineContact[] = [
        {
            id: '1',
            title: 'Emergency Support',
            description: 'Urgent delivery issues, accidents, or emergencies',
            phone: '+1 (555) 911-HELP',
            email: 'emergency@logisticq.com',
            hours: '24/7 Available',
            icon: <AlertCircle size={24} color="#FF3B30" />,
            type: 'emergency'
        },
        {
            id: '2',
            title: 'Customer Support',
            description: 'General inquiries, order status, and assistance',
            phone: '+1 (555) 123-HELP',
            email: 'support@logisticq.com',
            hours: 'Mon-Fri: 8AM-8PM',
            icon: <HeadphonesIcon size={24} color="#007AFF" />,
            type: 'support'
        },
        {
            id: '3',
            title: 'Technical Support',
            description: 'App issues, account problems, and technical help',
            phone: '+1 (555) 456-TECH',
            email: 'tech@logisticq.com',
            hours: 'Mon-Fri: 9AM-6PM',
            icon: <Users size={24} color="#34C759" />,
            type: 'support'
        },
        {
            id: '4',
            title: 'General Inquiries',
            description: 'Information about services, pricing, and partnerships',
            phone: '+1 (555) 789-INFO',
            email: 'info@logisticq.com',
            hours: 'Mon-Fri: 9AM-5PM',
            icon: <BookOpen size={24} color="#FF9500" />,
            type: 'general'
        }
    ];

    const handlePhoneCall = async (phoneNumber: string) => {
        try {
            const cleanNumber = phoneNumber.replace(/[^\d+()-]/g, '');
            const url = `tel:${cleanNumber}`;
            
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert(
                    'Cannot Make Call',
                    'Your device does not support phone calls or the number is invalid.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error making phone call:', error);
            Alert.alert(
                'Call Failed',
                'Unable to make the call. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleEmail = async (email: string) => {
        try {
            const url = `mailto:${email}`;
            const canOpen = await Linking.canOpenURL(url);
            
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert(
                    'Cannot Send Email',
                    'No email app is configured on your device.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error opening email:', error);
            Alert.alert(
                'Email Failed',
                'Unable to open email app. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const getCardStyle = (type: string) => {
        switch (type) {
            case 'emergency':
                return [styles.helplineCard, styles.emergencyCard];
            case 'support':
                return [styles.helplineCard, styles.supportCard];
            case 'general':
                return [styles.helplineCard, styles.generalCard];
            default:
                return styles.helplineCard;
        }
    };

    const renderHelplineCard = (item: HelplineContact) => (
        <View key={item.id} style={getCardStyle(item.type)}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    {item.icon}
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
            </View>
            
            <View style={styles.contactInfo}>
                <View style={styles.hoursContainer}>
                    <Clock size={16} color="#8E8E93" />
                    <Text style={styles.hoursText}>{item.hours}</Text>
                </View>
                
                <View style={styles.contactActions}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handlePhoneCall(item.phone)}
                    >
                        <Phone size={18} color="#007AFF" />
                        <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>
                    
                    {item.email && (
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleEmail(item.email!)}
                        >
                            <Mail size={18} color="#007AFF" />
                            <Text style={styles.actionButtonText}>Email</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            
            <View style={styles.contactDetails}>
                <Text style={styles.phoneNumber}>{item.phone}</Text>
                {item.email && (
                    <Text style={styles.emailAddress}>{item.email}</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Helpline</Text>
                <Text style={styles.headerSubtitle}>Get help when you need it</Text>
            </View>
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.helplineList}>
                    {helplineContacts.map(renderHelplineCard)}
                </View>
                
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        For urgent matters, please call our emergency support line immediately.
                    </Text>
                    <Text style={styles.footerSubtext}>
                        All calls are recorded for quality assurance and training purposes.
                    </Text>
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
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#8E8E93',
    },
    scrollView: {
        flex: 1,
    },
    helplineList: {
        padding: 20,
    },
    helplineCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    emergencyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF3B30',
    },
    supportCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    generalCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#8E8E93',
        lineHeight: 20,
    },
    contactInfo: {
        marginBottom: 16,
    },
    hoursContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    hoursText: {
        fontSize: 14,
        color: '#8E8E93',
        marginLeft: 8,
    },
    contactActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
    },
    contactDetails: {
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        paddingTop: 16,
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 4,
    },
    emailAddress: {
        fontSize: 14,
        color: '#007AFF',
    },
    footer: {
        padding: 20,
        paddingTop: 0,
    },
    footerText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
    },
    footerSubtext: {
        fontSize: 12,
        color: '#C7C7CC',
        textAlign: 'center',
        lineHeight: 16,
    },
});

export default HelplineScreen;