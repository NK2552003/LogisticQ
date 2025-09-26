import { Tabs } from 'expo-router';
import { 
    Home, 
    Navigation,
    Briefcase,
    DollarSign,
    MessageCircle,
    User,
    Star
} from 'lucide-react-native';
import { Platform, View } from 'react-native';

const TransporterTabsLayout = () => {
    return (
        <Tabs
            initialRouteName='home'
            screenOptions={{
                tabBarActiveTintColor: '#10B981', // Green theme for transporter
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
                name='jobs' 
                options={{
                    title: 'Jobs',
                    tabBarLabel: 'Jobs',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View>
                            <Briefcase 
                                color={color} 
                                size={focused ? 26 : 24}
                                strokeWidth={focused ? 2.2 : 2}
                            />
                        </View>
                    ),
                }}
            />
            
            <Tabs.Screen 
                name='tracking' 
                options={{
                    title: 'Tracking',
                    tabBarLabel: 'Tracking',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Navigation 
                            color={color} 
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    ),
                }}
            />
            
            <Tabs.Screen 
                name='earnings' 
                options={{
                    title: 'Earnings',
                    tabBarLabel: 'Earnings',
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
                name='chat' 
                options={{
                    title: 'Chat',
                    tabBarLabel: 'Chat',
                    tabBarIcon: ({ color, size, focused }) => (
                        <MessageCircle 
                            color={color} 
                            size={focused ? 26 : 24}
                            strokeWidth={focused ? 2.2 : 2}
                        />
                    ),
                }}
            />

            <Tabs.Screen 
                name='ratings' 
                options={{
                    title: 'Ratings',
                    tabBarLabel: 'Ratings',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Star 
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

export default TransporterTabsLayout;