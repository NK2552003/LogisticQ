import { Tabs } from 'expo-router';
import { 
    Home, 
    Phone, 
    Headphones, 
    User, 
    MessageCircle,
    Package,
    TimerReset,
    LocateIcon,
    Menu
} from 'lucide-react-native';
import { Platform, View } from 'react-native';
import CollapsibleTabBar from '../../components/CollapsibleTabBar';

const Layout = () => {
    return (
        <Tabs
            initialRouteName='home'
            tabBar={(props) => <CollapsibleTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen 
                name='home' 
                options={{
                    title: 'Home',
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View>
                            <Home 
                                color={color} 
                                size={focused ? 26 : 24}
                                strokeWidth={focused ? 2.2 : 2}
                            />
                        </View>
                    ),
                }}
            />
            
            <Tabs.Screen 
                name='call-logs' 
                options={{
                    title: 'Call Logs',
                    tabBarLabel: 'Call Logs',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View>
                            <Phone 
                                color={color} 
                                size={focused ? 26 : 24}
                                strokeWidth={focused ? 2.2 : 2}
                            />
                        </View>
                    ),
                }}
            />
            
            <Tabs.Screen 
                name='helpline' 
                options={{
                    title: 'Helpline',
                    tabBarLabel: 'Helpline',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Headphones 
                            color={color} 
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    ),
                }}
            />
            
            <Tabs.Screen 
                name='profile' 
                options={{
                    title: 'Profile',
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size, focused }) => (
                        <User 
                            color={color} 
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    ),
                }}
            />

            {/* More tab that opens top navigation */}
            <Tabs.Screen 
                name='more' 
                options={{
                    title: 'More',
                    tabBarLabel: 'More',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={{ position: 'relative' }}>
                            <Menu 
                                color={color} 
                                size={focused ? 26 : 24}
                                strokeWidth={focused ? 2.2 : 2}
                            />
                            {/* Small indicator badge */}
                            <View style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#FF3B30',
                            }} />
                        </View>
                    ),
                }}
            />

            {/* Hidden tabs - accessible only through top navigation */}
            <Tabs.Screen
                name='chat'
                options={{
                    title:"Chat",
                    tabBarLabel: 'Chat',
                    href: null, // Hide from tab bar
                    tabBarIcon: ({ color, size, focused }) => (
                        <MessageCircle
                            color={color}
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name='orders'
                options={{
                    title:"Orders",
                    tabBarLabel: 'Orders',
                    href: null, // Hide from tab bar
                    tabBarIcon: ({ color, size, focused }) => (
                        <Package
                            color={color}
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name='history'
                options={{
                    title:"History",
                    tabBarLabel: 'History',
                    href: null, // Hide from tab bar
                    tabBarIcon: ({ color, size, focused }) => (
                        <TimerReset
                            color={color}
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name='tracking'
                options={{
                    title:"Tracking",
                    tabBarLabel: 'Tracking',
                    href: null, // Hide from tab bar
                    tabBarIcon: ({ color, size, focused }) => (
                        <LocateIcon
                            color={color}
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    )
                }}
            />

            {/* Hide all other tabs from tab bar */}
            <Tabs.Screen name='admin-tabs' options={{ href: null }} />
            <Tabs.Screen name='analytics' options={{ href: null }} />
            <Tabs.Screen name='business-tabs' options={{ href: null }} />
            <Tabs.Screen name='create-shipment' options={{ href: null }} />
            <Tabs.Screen name='customer-tabs' options={{ href: null }} />
            <Tabs.Screen name='disputes' options={{ href: null }} />
            <Tabs.Screen name='earnings' options={{ href: null }} />
            <Tabs.Screen name='invoices' options={{ href: null }} />
            <Tabs.Screen name='jobs' options={{ href: null }} />
            <Tabs.Screen name='payments' options={{ href: null }} />
            <Tabs.Screen name='pricing' options={{ href: null }} />
            <Tabs.Screen name='ratings' options={{ href: null }} />
            <Tabs.Screen name='settings' options={{ href: null }} />
            <Tabs.Screen name='shipments' options={{ href: null }} />
            <Tabs.Screen name='transporter-tabs' options={{ href: null }} />
            <Tabs.Screen name='users' options={{ href: null }} />
        </Tabs>
    );
};

export default Layout;