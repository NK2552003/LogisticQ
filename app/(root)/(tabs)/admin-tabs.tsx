import { Tabs } from 'expo-router';
import { 
    Home, 
    Users,
    Package,
    DollarSign,
    AlertTriangle,
    BarChart3,
    Settings,
    User
} from 'lucide-react-native';
import { Platform, View } from 'react-native';

const AdminTabsLayout = () => {
    return (
        <Tabs
            initialRouteName='home'
            screenOptions={{
                tabBarActiveTintColor: '#EF4444', // Red theme for admin
                tabBarInactiveTintColor: '#8E8E93',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#F2F2F7',
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 88 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    paddingTop: 8,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: -2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                    borderRadius: 12,
                    marginHorizontal: 10,
                    marginBottom: Platform.OS === 'ios' ? 0 : 10,
                    position: 'absolute',
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    marginTop: 2,
                },
                tabBarIconStyle: {
                    marginTop: -4,
                    marginBottom: -2
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
            }}
        >
            <Tabs.Screen 
                name='home' 
                options={{
                    title: 'Dashboard',
                    tabBarLabel: 'Dashboard',
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
                name='users' 
                options={{
                    title: 'Users',
                    tabBarLabel: 'Users',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View>
                            <Users 
                                color={color} 
                                size={focused ? 26 : 24}
                                strokeWidth={focused ? 2.2 : 2}
                            />
                        </View>
                    ),
                }}
            />
            
            <Tabs.Screen 
                name='shipments' 
                options={{
                    title: 'Shipments',
                    tabBarLabel: 'Shipments',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Package 
                            color={color} 
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    ),
                }}
            />
            
            <Tabs.Screen 
                name='pricing' 
                options={{
                    title: 'Pricing',
                    tabBarLabel: 'Pricing',
                    tabBarIcon: ({ color, size, focused }) => (
                        <DollarSign 
                            color={color} 
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    ),
                }}
            />

            <Tabs.Screen 
                name='disputes' 
                options={{
                    title: 'Disputes',
                    tabBarLabel: 'Disputes',
                    tabBarIcon: ({ color, size, focused }) => (
                        <AlertTriangle 
                            color={color} 
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    ),
                }}
            />

            <Tabs.Screen 
                name='analytics' 
                options={{
                    title: 'Analytics',
                    tabBarLabel: 'Analytics',
                    tabBarIcon: ({ color, size, focused }) => (
                        <BarChart3 
                            color={color} 
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    ),
                }}
            />

            <Tabs.Screen 
                name='settings' 
                options={{
                    title: 'Settings',
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Settings 
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
        </Tabs>
    );
};

export default AdminTabsLayout;