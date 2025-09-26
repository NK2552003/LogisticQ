import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Phone, PhoneCall, PhoneIncoming, PhoneOutgoing } from 'lucide-react-native';

interface CallLog {
    id: string;
    name: string;
    number: string;
    type: 'incoming' | 'outgoing' | 'missed';
    duration: string;
    time: string;
    date: string;
}

const CallLogsScreen = () => {
    // Sample call logs data
    const callLogs: CallLog[] = [
        {
            id: '1',
            name: 'Customer Service',
            number: '+1 (555) 123-4567',
            type: 'incoming',
            duration: '5:23',
            time: '10:30 AM',
            date: 'Today'
        },
        {
            id: '2',
            name: 'Delivery Partner',
            number: '+1 (555) 987-6543',
            type: 'outgoing',
            duration: '2:15',
            time: '9:45 AM',
            date: 'Today'
        },
        {
            id: '3',
            name: 'Support Team',
            number: '+1 (555) 456-7890',
            type: 'missed',
            duration: '0:00',
            time: '8:20 AM',
            date: 'Yesterday'
        },
        {
            id: '4',
            name: 'Warehouse Manager',
            number: '+1 (555) 321-0987',
            type: 'outgoing',
            duration: '7:45',
            time: '4:15 PM',
            date: 'Yesterday'
        },
    ];

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
        <TouchableOpacity key={item.id} style={styles.callLogItem}>
            <View style={styles.callIconContainer}>
                {getCallIcon(item.type)}
            </View>
            
            <View style={styles.callInfoContainer}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.phoneNumber}>{item.number}</Text>
                <View style={styles.callDetails}>
                    <Text style={[styles.callType, { color: getCallTypeColor(item.type) }]}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Text>
                    {item.duration !== '0:00' && (
                        <Text style={styles.duration}> • {item.duration}</Text>
                    )}
                </View>
            </View>
            
            <View style={styles.timeContainer}>
                <Text style={styles.time}>{item.time}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>
            
            <TouchableOpacity style={styles.callButton}>
                <PhoneCall size={20} color="#007AFF" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Call Logs</Text>
                <Text style={styles.headerSubtitle}>Recent call history</Text>
            </View>
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.callLogsList}>
                    {callLogs.map(renderCallLogItem)}
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
    callLogsList: {
        padding: 20,
    },
    callLogItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 12,
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
    callIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    callInfoContainer: {
        flex: 1,
        marginRight: 12,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    phoneNumber: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
    },
    callDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    callType: {
        fontSize: 12,
        fontWeight: '500',
    },
    duration: {
        fontSize: 12,
        color: '#8E8E93',
    },
    timeContainer: {
        alignItems: 'flex-end',
        marginRight: 12,
    },
    time: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 2,
    },
    date: {
        fontSize: 10,
        color: '#C7C7CC',
    },
    callButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CallLogsScreen;