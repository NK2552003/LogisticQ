import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Linking,
    Alert,
    Modal,
    FlatList,
    Pressable,
} from 'react-native';
import { 
    Phone, 
    PhoneCall, 
    PhoneIncoming, 
    PhoneOutgoing, 
    Search,
    Grid3x3,
    Heart,
    Clock,
    Star,
    UserPlus,
    MoreVertical,
    Delete,
    Info,
    MessageCircle
} from 'lucide-react-native';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';

interface CallLog {
    id: string;
    name: string;
    number: string;
    type: 'incoming' | 'outgoing' | 'missed';
    duration: string;
    time: string;
    date: string;
    avatar?: string;
    location?: string;
}

interface Contact {
    id: string;
    name: string;
    number: string;
    avatar?: string;
    isFavorite: boolean;
}

interface KeypadButton {
    number: string;
    letters: string;
}

const CallLogsScreen = () => {
    const [selectedTab, setSelectedTab] = useState<'recents' | 'favorites' | 'keypad'>('recents');
    const [searchQuery, setSearchQuery] = useState('');
    const [dialNumber, setDialNumber] = useState('');
    const [showCallScreen, setShowCallScreen] = useState(false);
    const [currentCall, setCurrentCall] = useState<CallLog | null>(null);

    // Sample call logs data with more realistic entries
    const [callLogs, setCallLogs] = useState<CallLog[]>([
        {
            id: '1',
            name: 'Customer Service',
            number: '+1 (555) 123-4567',
            type: 'incoming',
            duration: '5:23',
            time: '10:30 AM',
            date: 'Today',
            avatar: '👥',
            location: 'San Francisco, CA'
        },
        {
            id: '2',
            name: 'Delivery Partner - John',
            number: '+1 (555) 987-6543',
            type: 'outgoing',
            duration: '2:15',
            time: '9:45 AM',
            date: 'Today',
            avatar: '🚚',
            location: 'Oakland, CA'
        },
        {
            id: '3',
            name: 'Support Team',
            number: '+1 (555) 456-7890',
            type: 'missed',
            duration: '0:00',
            time: '8:20 AM',
            date: 'Yesterday',
            avatar: '🎧',
            location: 'LogisticQ HQ'
        },
        {
            id: '4',
            name: 'Warehouse Manager',
            number: '+1 (555) 321-0987',
            type: 'outgoing',
            duration: '7:45',
            time: '4:15 PM',
            date: 'Yesterday',
            avatar: '📦',
            location: 'Central Warehouse'
        },
        {
            id: '5',
            name: 'Emergency Hotline',
            number: '+1 (555) 911-HELP',
            type: 'outgoing',
            duration: '1:30',
            time: '2:22 PM',
            date: '2 days ago',
            avatar: '🚨',
            location: 'Emergency Services'
        },
        {
            id: '6',
            name: 'Customer - Sarah Johnson',
            number: '+1 (555) 234-5678',
            type: 'incoming',
            duration: '8:12',
            time: '11:15 AM',
            date: '3 days ago',
            avatar: '👩‍💼',
            location: 'New York, NY'
        }
    ]);

    // Favorite contacts
    const [favoriteContacts, setFavoriteContacts] = useState<Contact[]>([
        {
            id: 'fav1',
            name: 'Customer Service',
            number: '+1 (555) 123-4567',
            avatar: '👥',
            isFavorite: true
        },
        {
            id: 'fav2',
            name: 'Emergency Hotline',
            number: '+1 (555) 911-HELP',
            avatar: '🚨',
            isFavorite: true
        },
        {
            id: 'fav3',
            name: 'Delivery Support',
            number: '+1 (555) 456-7890',
            avatar: '🎧',
            isFavorite: true
        }
    ]);

    // Keypad configuration
    const keypadButtons: KeypadButton[] = [
        { number: '1', letters: '' },
        { number: '2', letters: 'ABC' },
        { number: '3', letters: 'DEF' },
        { number: '4', letters: 'GHI' },
        { number: '5', letters: 'JKL' },
        { number: '6', letters: 'MNO' },
        { number: '7', letters: 'PQRS' },
        { number: '8', letters: 'TUV' },
        { number: '9', letters: 'WXYZ' },
        { number: '*', letters: '' },
        { number: '0', letters: '+' },
        { number: '#', letters: '' }
    ];

    // Filter call logs based on search
    const filteredCallLogs = callLogs.filter(call => 
        call.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.number.includes(searchQuery)
    );

    const filteredFavorites = favoriteContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.number.includes(searchQuery)
    );

    const makeCall = async (number: string, contact?: CallLog | Contact) => {
        try {
            const cleanNumber = number.replace(/[^\d+()-]/g, '');
            const url = `tel:${cleanNumber}`;
            
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                // Show call screen modal before making call
                if (contact) {
                    setCurrentCall(contact as CallLog);
                    setShowCallScreen(true);
                }
                
                // Add to call logs if it's a new call
                const newCall: CallLog = {
                    id: Date.now().toString(),
                    name: contact?.name || 'Unknown',
                    number: number,
                    type: 'outgoing',
                    duration: '0:00',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: 'Today',
                    avatar: contact?.avatar || '📞'
                };
                
                setCallLogs(prev => [newCall, ...prev]);
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot make call on this device');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to make call');
        }
    };

    const addToFavorites = (contact: CallLog) => {
        const newFavorite: Contact = {
            id: `fav_${Date.now()}`,
            name: contact.name,
            number: contact.number,
            avatar: contact.avatar,
            isFavorite: true
        };
        
        setFavoriteContacts(prev => [...prev, newFavorite]);
        Alert.alert('Success', `${contact.name} added to favorites`);
    };

    const removeFromFavorites = (contactId: string) => {
        setFavoriteContacts(prev => prev.filter(contact => contact.id !== contactId));
        Alert.alert('Success', 'Contact removed from favorites');
    };

    const deleteCallLog = (callId: string) => {
        Alert.alert(
            'Delete Call Log',
            'Are you sure you want to delete this call log?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => setCallLogs(prev => prev.filter(call => call.id !== callId))
                }
            ]
        );
    };

    const sendMessage = (number: string) => {
        Alert.alert('Send Message', `Send SMS to ${number}?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Send', 
                onPress: () => Linking.openURL(`sms:${number}`)
            }
        ]);
    };

    const addDigit = (digit: string) => {
        setDialNumber(prev => prev + digit);
    };

    const removeDigit = () => {
        setDialNumber(prev => prev.slice(0, -1));
    };

    const clearNumber = () => {
        setDialNumber('');
    };

    const getCallIcon = (type: string) => {
        switch (type) {
            case 'incoming':
                return <PhoneIncoming size={20} color="#007AFF" />;
            case 'outgoing':
                return <PhoneOutgoing size={20} color="#34C759" />;
            case 'missed':
                return <Phone size={20} color="#FF3B30" />;
            default:
                return <Phone size={20} color="#8E8E93" />;
        }
    };

    const getCallTypeColor = (type: string) => {
        switch (type) {
            case 'incoming':
                return '#007AFF';
            case 'outgoing':
                return '#34C759';
            case 'missed':
                return '#FF3B30';
            default:
                return '#8E8E93';
        }
    };

    const renderCallLogItem = (item: CallLog) => (
        <TouchableOpacity 
            key={item.id} 
            style={styles.callLogItem} 
            activeOpacity={0.7}
            onLongPress={() => {
                Alert.alert(
                    item.name,
                    'Choose an action',
                    [
                        { text: 'Call', onPress: () => makeCall(item.number, item) },
                        { text: 'Message', onPress: () => sendMessage(item.number) },
                        { text: 'Add to Favorites', onPress: () => addToFavorites(item) },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteCallLog(item.id) },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
            }}
        >
            <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{item.avatar || '📞'}</Text>
            </View>
            
            <View style={styles.callInfoContainer}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.phoneNumber}>{item.number}</Text>
                <View style={styles.callDetails}>
                    <View style={styles.callIconContainer}>
                        {getCallIcon(item.type)}
                    </View>
                    <Text style={[styles.callType, { color: getCallTypeColor(item.type) }]}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Text>
                    {item.duration !== '0:00' && (
                        <Text style={styles.duration}> • {item.duration}</Text>
                    )}
                </View>
                {item.location && (
                    <Text style={styles.location}>{item.location}</Text>
                )}
            </View>
            
            <View style={styles.timeContainer}>
                <Text style={styles.time}>{item.time}</Text>
                <Text style={styles.date}>{item.date}</Text>
                <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => makeCall(item.number, item)}
                >
                    <PhoneCall size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderFavoriteContact = ({ item }: { item: Contact }) => (
        <TouchableOpacity 
            style={styles.favoriteItem}
            onPress={() => makeCall(item.number, item as any)}
            onLongPress={() => {
                Alert.alert(
                    item.name,
                    'Remove from favorites?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeFromFavorites(item.id) }
                    ]
                );
            }}
        >
            <View style={styles.favoriteAvatar}>
                <Text style={styles.favoriteAvatarText}>{item.avatar || '👤'}</Text>
            </View>
            <Text style={styles.favoriteNameText}>{item.name}</Text>
            <Text style={styles.favoriteNumberText}>{item.number}</Text>
        </TouchableOpacity>
    );

    const renderKeypadButton = (button: KeypadButton) => (
        <TouchableOpacity
            key={button.number}
            style={styles.keypadButton}
            onPress={() => addDigit(button.number)}
            activeOpacity={0.7}
        >
            <Text style={styles.keypadNumber}>{button.number}</Text>
            {button.letters && (
                <Text style={styles.keypadLetters}>{button.letters}</Text>
            )}
        </TouchableOpacity>
    );

    const renderTabContent = () => {
        switch (selectedTab) {
            case 'recents':
                return (
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.callLogsList}>
                            {filteredCallLogs.map(renderCallLogItem)}
                        </View>
                    </ScrollView>
                );
            
            case 'favorites':
                return (
                    <View style={styles.favoritesContainer}>
                        <FlatList
                            data={filteredFavorites}
                            renderItem={renderFavoriteContact}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            contentContainerStyle={styles.favoritesList}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                );
            
            case 'keypad':
                return (
                    <View style={styles.keypadContainer}>
                        <View style={styles.numberDisplay}>
                            <TextInput
                                style={styles.numberInput}
                                value={dialNumber}
                                placeholder="Enter phone number"
                                placeholderTextColor="#8E8E93"
                                editable={false}
                            />
                            {dialNumber.length > 0 && (
                                <TouchableOpacity onPress={clearNumber} style={styles.clearButton}>
                                    <Text style={styles.clearButtonText}>×</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <View style={styles.keypadGrid}>
                            <View style={styles.keypadRow}>
                                {keypadButtons.slice(0, 3).map(renderKeypadButton)}
                            </View>
                            <View style={styles.keypadRow}>
                                {keypadButtons.slice(3, 6).map(renderKeypadButton)}
                            </View>
                            <View style={styles.keypadRow}>
                                {keypadButtons.slice(6, 9).map(renderKeypadButton)}
                            </View>
                            <View style={styles.keypadRow}>
                                {keypadButtons.slice(9, 12).map(renderKeypadButton)}
                            </View>
                        </View>
                        
                        <View style={styles.keypadActions}>
                            <TouchableOpacity 
                                style={styles.backspaceButton}
                                onPress={removeDigit}
                                disabled={dialNumber.length === 0}
                            >
                                <Text style={[styles.backspaceText, { opacity: dialNumber.length === 0 ? 0.3 : 1 }]}>⌫</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.callButton, styles.largeCallButton]}
                                onPress={() => dialNumber && makeCall(dialNumber)}
                                disabled={dialNumber.length === 0}
                            >
                                <Phone size={24} color="white" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.messageButton}>
                                <MessageCircle size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            
            default:
                return null;
        }
    };

    return (
        <SafeAreaWrapper backgroundColor="#F2F2F7">
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Phone</Text>
                <Text style={styles.headerSubtitle}>LogisticQ Communications</Text>
            </View>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={20} color="#8E8E93" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search contacts or numbers"
                    placeholderTextColor="#8E8E93"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === 'favorites' && styles.activeTab]}
                    onPress={() => setSelectedTab('favorites')}
                >
                    <Heart size={20} color={selectedTab === 'favorites' ? '#007AFF' : '#8E8E93'} />
                    <Text style={[styles.tabText, selectedTab === 'favorites' && styles.activeTabText]}>
                        Favorites
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === 'recents' && styles.activeTab]}
                    onPress={() => setSelectedTab('recents')}
                >
                    <Clock size={20} color={selectedTab === 'recents' ? '#007AFF' : '#8E8E93'} />
                    <Text style={[styles.tabText, selectedTab === 'recents' && styles.activeTabText]}>
                        Recents
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === 'keypad' && styles.activeTab]}
                    onPress={() => setSelectedTab('keypad')}
                >
                    <Grid3x3 size={20} color={selectedTab === 'keypad' ? '#007AFF' : '#8E8E93'} />
                    <Text style={[styles.tabText, selectedTab === 'keypad' && styles.activeTabText]}>
                        Keypad
                    </Text>
                </TouchableOpacity>
            </View>
            
            {/* Tab Content */}
            {renderTabContent()}
            
            {/* Call Screen Modal */}
            <Modal
                visible={showCallScreen}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <View style={styles.callScreenContainer}>
                    <View style={styles.callScreenHeader}>
                        <Text style={styles.callScreenName}>{currentCall?.name}</Text>
                        <Text style={styles.callScreenNumber}>{currentCall?.number}</Text>
                        <Text style={styles.callScreenStatus}>Calling...</Text>
                    </View>
                    
                    <View style={styles.callScreenAvatar}>
                        <Text style={styles.callScreenAvatarText}>{currentCall?.avatar || '📞'}</Text>
                    </View>
                    
                    <View style={styles.callScreenActions}>
                        <TouchableOpacity 
                            style={styles.endCallButton}
                            onPress={() => setShowCallScreen(false)}
                        >
                            <Phone size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    
    // Search Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginVertical: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#1E293B',
    },
    
    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    activeTab: {
        backgroundColor: '#EFF6FF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    activeTabText: {
        color: '#007AFF',
    },
    
    // Call Logs Styles
    scrollView: {
        flex: 1,
    },
    callLogsList: {
        padding: 20,
    },
    callLogItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatar: {
        fontSize: 24,
    },
    callIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    callInfoContainer: {
        flex: 1,
        marginRight: 16,
    },
    contactName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    phoneNumber: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
    },
    callDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    callType: {
        fontSize: 13,
        fontWeight: '500',
    },
    duration: {
        fontSize: 13,
        color: '#64748B',
    },
    location: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    timeContainer: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 60,
    },
    time: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 8,
    },
    callButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    
    // Favorites Styles
    favoritesContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    favoritesList: {
        paddingVertical: 10,
    },
    favoriteItem: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        margin: 8,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    favoriteAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    favoriteAvatarText: {
        fontSize: 28,
    },
    favoriteNameText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 4,
    },
    favoriteNumberText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    
    // Keypad Styles
    keypadContainer: {
        flex: 1,
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    numberDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginBottom: 30,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 20,
        minHeight: 60,
    },
    numberInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '300',
        color: '#1E293B',
        textAlign: 'center',
    },
    clearButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 20,
        color: '#6B7280',
        fontWeight: '300',
    },
    keypadGrid: {
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    keypadButton: {
        width: '28%',
        aspectRatio: 1,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 65,
        maxHeight: 80,
    },
    keypadNumber: {
        fontSize: 28,
        fontWeight: '300',
        color: '#1E293B',
    },
    keypadLetters: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
        fontWeight: '500',
        letterSpacing: 1,
    },
    keypadActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backspaceButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backspaceText: {
        fontSize: 24,
        color: '#6B7280',
    },
    largeCallButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#34C759',
        borderColor: '#34C759',
    },
    messageButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Call Screen Styles
    callScreenContainer: {
        flex: 1,
        backgroundColor: '#1E293B',
        justifyContent: 'space-between',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    callScreenHeader: {
        alignItems: 'center',
        marginTop: 40,
    },
    callScreenName: {
        fontSize: 28,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    callScreenNumber: {
        fontSize: 18,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 16,
    },
    callScreenStatus: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
    callScreenAvatar: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        borderWidth: 4,
        borderColor: '#4B5563',
    },
    callScreenAvatarText: {
        fontSize: 80,
    },
    callScreenActions: {
        alignItems: 'center',
        marginBottom: 40,
    },
    endCallButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default CallLogsScreen;