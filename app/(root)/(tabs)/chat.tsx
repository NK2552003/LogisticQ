import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Image,
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
    Mic
} from 'lucide-react-native';

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

    const messages: Message[] = [
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

    const renderMessage = (message: Message) => (
        <View key={message.id} style={[
            styles.messageContainer,
            message.isMe ? styles.myMessage : styles.theirMessage
        ]}>
            <Text style={[
                styles.messageText,
                message.isMe ? styles.myMessageText : styles.theirMessageText
            ]}>
                {message.text}
            </Text>
            <Text style={styles.messageTime}>{message.time}</Text>
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
                    {messages.map(renderMessage)}
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
});

export default Chat;