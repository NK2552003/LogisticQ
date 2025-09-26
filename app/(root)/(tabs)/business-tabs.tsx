import { Tabs } from 'expo-router';
import { 
    Home, 
    Package,
    Plus,
    BarChart3,
    CreditCard,
    User
} from 'lucide-react-native';
import { Platform, View } from 'react-native';

const BusinessTabsLayout = () => {
    return (
        <Tabs
            initialRouteName='home'
            screenOptions={{
                tabBarActiveTintColor: '#3B82F6', // Blue theme for business
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
                name='orders' 
                options={{
                    title: 'Shipments',
                    tabBarLabel: 'Shipments',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View>
                            <Package 
                                color={color} 
                                size={focused ? 26 : 24}
                                strokeWidth={focused ? 2.2 : 2}
                            />
                        </View>
                    ),
                }}
            />
            
            <Tabs.Screen 
                name='create-shipment' 
                options={{
                    title: 'Create Shipment',
                    tabBarLabel: 'Create',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Plus 
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
                name='payments' 
                options={{
                    title: 'Payments',
                    tabBarLabel: 'Payments',
                    tabBarIcon: ({ color, size, focused }) => (
                        <CreditCard 
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

export default BusinessTabsLayout;