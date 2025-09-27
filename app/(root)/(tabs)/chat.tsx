import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Image,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Linking,
} from 'react-native';
import { 
    Search, 
    MessageCircle, 
    Phone, 
    Video, 
    MoreHorizontal,
    Send,
    Paperclip,
    Camera,
    Mic,
    ArrowLeft,
    Plus,
    Check,
    CheckCheck,
    Clock
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

interface ChatContact {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
    avatar: string;
    type: 'customer' | 'driver' | 'support' | 'team';
}

interface Message {
    id: string;
    text: string;
    time: string;
    isMe: boolean;
    status: 'sent' | 'delivered' | 'read';
}

const Chat = () => {
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [searchText, setSearchText] = useState('');
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [typing, setTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const flatListRef = useRef<FlatList>(null);

    // Load messages when chat is selected
    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat);
        }
    }, [selectedChat]);

    // Mock data for when API is unavailable
    const loadMessages = async (chatId: string) => {
        setLoading(true);
        try {
            // Try to fetch from API first
            try {
                const response = await fetchAPI(`/chat/messages?chatId=${chatId}`);
                if (response.messages) {
                    setChatMessages(response.messages);
                } else {
                    setChatMessages(getMockMessages(chatId));
                }
            } catch (apiError) {
                console.log('API unavailable, using mock data');
                setChatMessages(getMockMessages(chatId));
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            setChatMessages(getMockMessages(chatId));
        } finally {
            setLoading(false);
        }
    };

    const getMockMessages = (chatId: string): Message[] => {
        const mockMessagesMap: Record<string, Message[]> = {
            '1': [
                {
                    id: '1',
                    text: 'Hi! I have a delivery scheduled for today. What time should I expect it?',
                    time: '10:30 AM',
                    isMe: false,
                    status: 'read'
                },
                {
                    id: '2',
                    text: 'Hello! Your delivery is scheduled between 2-4 PM today. I\'ll send you a notification when I\'m 15 minutes away.',
                    time: '10:32 AM',
                    isMe: true,
                    status: 'delivered'
                },
                {
                    id: '3',
                    text: 'Perfect! I\'ll be home all afternoon. Should I prepare anything?',
                    time: '10:33 AM',
                    isMe: false,
                    status: 'read'
                },
                {
                    id: '4',
                    text: 'Just have someone available to receive the package. It requires a signature.',
                    time: '10:34 AM',
                    isMe: true,
                    status: 'delivered'
                },
                {
                    id: '5',
                    text: 'Got it! Thank you for the update.',
                    time: '10:35 AM',
                    isMe: false,
                    status: 'read'
                }
            ],
            '2': [
                {
                    id: '1',
                    text: 'Hey, I\'m running about 10 minutes late due to traffic. Still good to deliver?',
                    time: '2:45 PM',
                    isMe: false,
                    status: 'read'
                },
                {
                    id: '2',
                    text: 'No problem! I\'m flexible with timing. Take your time and drive safely.',
                    time: '2:46 PM',
                    isMe: true,
                    status: 'delivered'
                },
                {
                    id: '3',
                    text: 'Thanks for understanding! ETA is now 3:10 PM.',
                    time: '2:47 PM',
                    isMe: false,
                    status: 'read'
                }
            ]
        };
        
        return mockMessagesMap[chatId] || [];
    };

    const sendMessage = async () => {
        if (!messageText.trim() || !selectedChat) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: messageText.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            status: 'sent'
        };

        // Add message to local state immediately
        setChatMessages(prev => [...prev, newMessage]);
        setMessageText('');

        // Scroll to bottom
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            // Try to send via API
            const response = await fetchAPI('/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: selectedChat,
                    message: newMessage.text,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.success) {
                // Update message status to delivered
                setChatMessages(prev => 
                    prev.map(msg => 
                        msg.id === newMessage.id 
                            ? { ...msg, status: 'delivered' }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.log('API unavailable, message sent locally only');
        }

        // Simulate typing indicator and response for demo
        if (selectedChat === '1' || selectedChat === '2') {
            setTyping(true);
            setTimeout(() => {
                setTyping(false);
                const autoReply: Message = {
                    id: (Date.now() + 1).toString(),
                    text: selectedChat === '1' 
                        ? 'Thanks for your message! I\'ll get back to you shortly.' 
                        : 'Received! Let me check on that for you.',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: false,
                    status: 'delivered'
                };
                setChatMessages(prev => [...prev, autoReply]);
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }, 2000);
        }
    };

    const makeCall = async (contact: ChatContact) => {
        // Simulate phone number based on contact type
        const phoneNumbers = {
            'customer': '+1 (555) 123-4567',
            'driver': '+1 (555) 987-6543',
            'support': '+1 (555) 456-7890',
            'team': '+1 (555) 321-0987'
        };

        const phoneNumber = phoneNumbers[contact.type];
        
        Alert.alert(
            'Call Contact',
            `Call ${contact.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Call', 
                    onPress: () => Linking.openURL(`tel:${phoneNumber}`)
                }
            ]
        );
    };

    const startVideoCall = (contact: ChatContact) => {
        Alert.alert(
            'Video Call',
            `Start video call with ${contact.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Start Call', 
                    onPress: () => Alert.alert('Feature Coming Soon', 'Video calling will be available in a future update.')
                }
            ]
        );
    };

    const chatContacts: ChatContact[] = [
        {
            id: '1',
            name: 'Sarah Johnson (Customer)',
            lastMessage: 'When will my package arrive?',
            time: '2m ago',
            unread: 2,
            online: true,
            avatar: '👩‍💼',
            type: 'customer'
        },
        {
            id: '2',
            name: 'Mike Driver',
            lastMessage: 'Completed delivery at downtown',
            time: '15m ago',
            unread: 0,
            online: true,
            avatar: '🚚',
            type: 'driver'
        },
        {
            id: '3',
            name: 'Support Team',
            lastMessage: 'Issue resolved successfully',
            time: '1h ago',
            unread: 1,
            online: false,
            avatar: '🎧',
            type: 'support'
        },
        {
            id: '4',
            name: 'Warehouse Team',
            lastMessage: 'Ready for pickup - 12 packages',
            time: '2h ago',
            unread: 0,
            online: true,
            avatar: '📦',
            type: 'team'
        },
        {
            id: '5',
            name: 'Alex Thompson (Customer)',
            lastMessage: 'Thank you for the quick delivery!',
            time: '3h ago',
            unread: 0,
            online: false,
            avatar: '👨‍💻',
            type: 'customer'
        }
    ];

    // Mock messages data - will be replaced with API calls
    const mockMessages: Message[] = [
        {
            id: '1',
            text: 'Hello! I wanted to check on my delivery status.',
            time: '10:30 AM',
            isMe: false,
            status: 'read'
        },
        {
            id: '2',
            text: 'Hi Sarah! Let me check that for you right away.',
            time: '10:31 AM',
            isMe: true,
            status: 'read'
        },
        {
            id: '3',
            text: 'Your package is currently out for delivery and should arrive within the next 2 hours.',
            time: '10:32 AM',
            isMe: true,
            status: 'read'
        },
        {
            id: '4',
            text: 'Great! Will someone be there to receive it?',
            time: '10:33 AM',
            isMe: false,
            status: 'read'
        },
        {
            id: '5',
            text: 'Yes, I\'ll be home all day. Thank you for the update!',
            time: '10:34 AM',
            isMe: false,
            status: 'delivered'
        }
    ];

    const getContactTypeColor = (type: string) => {
        switch (type) {
            case 'customer': return '#007AFF';
            case 'driver': return '#34C759';
            case 'support': return '#FF9500';
            case 'team': return '#AF52DE';
            default: return '#8E8E93';
        }
    };

    const renderChatItem = (contact: ChatContact) => (
        <TouchableOpacity 
            key={contact.id} 
            style={[
                styles.chatItem,
                selectedChat === contact.id && styles.selectedChatItem
            ]}
            onPress={() => setSelectedChat(contact.id)}
        >
            <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{contact.avatar}</Text>
                {contact.online && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.messageTime}>{contact.time}</Text>
                </View>
                <View style={styles.messagePreview}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {contact.lastMessage}
                    </Text>
                    {contact.unread > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: getContactTypeColor(contact.type) }]}>
                            <Text style={styles.unreadText}>{contact.unread}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent':
                return <Check size={12} color="#8E8E93" />;
            case 'delivered':
                return <CheckCheck size={12} color="#8E8E93" />;
            case 'read':
                return <CheckCheck size={12} color="#007AFF" />;
            default:
                return <Clock size={12} color="#8E8E93" />;
        }
    };

    const renderMessage = (message: Message) => (
        <View key={message.id} style={[
            styles.messageContainer,
            message.isMe ? styles.myMessage : styles.theirMessage
        ]}>
            <View style={[
                styles.messageBubble,
                message.isMe ? styles.myMessageBubble : styles.theirMessageBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    message.isMe ? styles.myMessageText : styles.theirMessageText
                ]}>
                    {message.text}
                </Text>
                <View style={styles.messageFooter}>
                    <Text style={[
                        styles.messageTime,
                        message.isMe ? styles.myMessageTime : styles.theirMessageTime
                    ]}>
                        {message.time}
                    </Text>
                    {message.isMe && (
                        <View style={styles.messageStatus}>
                            {getStatusIcon(message.status)}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    if (selectedChat) {
        const contact = chatContacts.find(c => c.id === selectedChat);
        
        return (
            <SafeAreaView style={styles.container}>
                {/* Chat Header */}
                <View style={styles.chatScreenHeader}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => setSelectedChat(null)}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.chatHeaderInfo}>
                        <Text style={styles.chatHeaderName}>{contact?.name}</Text>
                        <Text style={styles.chatHeaderStatus}>
                            {contact?.online ? 'Online' : 'Last seen 2h ago'}
                        </Text>
                    </View>
                    <View style={styles.chatHeaderActions}>
                        <TouchableOpacity style={styles.headerAction}>
                            <Phone size={20} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerAction}>
                            <Video size={20} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerAction}>
                            <MoreHorizontal size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Messages */}
                <ScrollView style={styles.messagesContainer}>
                    {(selectedChat ? chatMessages : mockMessages).map(renderMessage)}
                </ScrollView>

                {/* Message Input */}
                <View style={styles.messageInputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Paperclip size={20} color="#8E8E93" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Type a message..."
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                    />
                    <TouchableOpacity style={styles.cameraButton}>
                        <Camera size={20} color="#8E8E93" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.micButton}>
                        <Mic size={20} color="#8E8E93" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sendButton}>
                        <Send size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.newChatButton}>
                    <MessageCircle size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#8E8E93" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search messages..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </View>

            {/* Chat List */}
            <ScrollView style={styles.chatList}>
                {chatContacts.map(renderChatItem)}
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
    newChatButton: {
        padding: 8,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    searchBar: {
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
    chatList: {
        flex: 1,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    selectedChatItem: {
        backgroundColor: '#E3F2FD',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        fontSize: 32,
        width: 48,
        height: 48,
        textAlign: 'center',
        lineHeight: 48,
        backgroundColor: '#F2F2F7',
        borderRadius: 24,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34C759',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    chatInfo: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    messageTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    messagePreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        flex: 1,
        fontSize: 14,
        color: '#8E8E93',
        marginRight: 8,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Chat Screen Styles
    chatScreenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        marginRight: 12,
    },
    backText: {
        fontSize: 16,
        color: '#007AFF',
    },
    chatHeaderInfo: {
        flex: 1,
    },
    chatHeaderName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    chatHeaderStatus: {
        fontSize: 12,
        color: '#8E8E93',
    },
    chatHeaderActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerAction: {
        padding: 4,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    messageContainer: {
        marginBottom: 12,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        borderRadius: 18,
        borderBottomRightRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#E5E5EA',
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    theirMessageText: {
        color: '#000000',
    },
    messageInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        gap: 8,
    },
    attachButton: {
        padding: 8,
    },
    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 16,
    },
    cameraButton: {
        padding: 8,
    },
    micButton: {
        padding: 8,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        padding: 8,
    },
    
    // Enhanced message styles
    messageBubble: {
        maxWidth: '80%',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginVertical: 2,
    },
    myMessageBubble: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
        alignSelf: 'flex-end',
    },
    theirMessageBubble: {
        backgroundColor: '#E5E5EA',
        borderBottomLeftRadius: 4,
        alignSelf: 'flex-start',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4,
    },
    myMessageTime: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    theirMessageTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    messageStatus: {
        marginLeft: 4,
    },
    
    // Chat header styles
    contactAvatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        textAlign: 'center',
        lineHeight: 40,
        fontSize: 16,
    },
    contactTextInfo: {
        flex: 1,
    },
    
    // Chat body
    chatBody: {
        flex: 1,
    },
    
    // Typing indicator
    typingIndicator: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    typingBubble: {
        backgroundColor: '#E5E5EA',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignSelf: 'flex-start',
        maxWidth: '80%',
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#8E8E93',
    },
    typingDot1: {
        opacity: 0.4,
    },
    typingDot2: {
        opacity: 0.6,
    },
    typingDot3: {
        opacity: 0.8,
    },
    
    // Input container styles
    textInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        paddingRight: 8,
    },
    
    // Chat back button
    chatBackButton: {
        padding: 8,
        marginRight: 8,
    },
});

export default Chat;