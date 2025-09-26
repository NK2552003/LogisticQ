import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { Menu, Grid3X3, ArrowUp } from 'lucide-react-native';
import TopNavigation from '../../components/TopNavigation';

const MoreScreen = () => {
    const [showTopNav, setShowTopNav] = useState(false);

    React.useEffect(() => {
        // Auto-open the navigation when this screen is accessed
        setShowTopNav(true);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Grid3X3 color="#FACC15" size={48} strokeWidth={1.5} />
                </View>
                <Text style={styles.title}>More Options</Text>
                <Text style={styles.subtitle}>
                    Access additional features and screens from the top menu
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setShowTopNav(true)}
                    activeOpacity={0.8}
                >
                    <ArrowUp color="#fff" size={20} strokeWidth={2} />
                    <Text style={styles.buttonText}>Open Menu</Text>
                </TouchableOpacity>
                
                <Text style={styles.hint}>
                    Tap above to see Chat, Orders, History, and Tracking
                </Text>
            </View>

            <TopNavigation 
                isVisible={showTopNav} 
                onClose={() => setShowTopNav(false)} 
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FACC15',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    hint: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
});

export default MoreScreen;