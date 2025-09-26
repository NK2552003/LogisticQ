import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { fetchAPI } from '../lib/fetch';

// Import role-based tab layouts
import BusinessTabsLayout from './(tabs)/business-tabs';
import TransporterTabsLayout from './(tabs)/transporter-tabs';
import CustomerTabsLayout from './(tabs)/customer-tabs';
import AdminTabsLayout from './(tabs)/admin-tabs';

const RoleBasedRouter = () => {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isLoaded || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching user role for:', user.id);
        const response = await fetchAPI(`/user?clerkUserId=${user.id}`, {
          method: 'GET',
        });

        if (response.user) {
          console.log('✅ User data fetched:', response.user);
          const { role, profile_completed } = response.user;
          
          if (!role) {
            // User hasn't selected a role yet
            console.log('❌ No role found, redirecting to role selection');
            router.replace('/(auth)/role-selection');
            return;
          }

          if (!profile_completed && role !== 'admin') {
            // User hasn't completed their profile setup
            console.log('❌ Profile not completed, redirecting to setup');
            switch (role) {
              case 'business':
                router.replace('/(auth)/business-setup');
                break;
              case 'transporter':
                router.replace('/(auth)/transporter-setup');
                break;
              case 'customer':
                router.replace('/(auth)/customer-setup');
                break;
            }
            return;
          }

          setUserRole(role);
        }
      } catch (error) {
        console.error('❌ Error fetching user role:', error);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [isLoaded, user?.id]);

  if (!isLoaded || isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FACC15" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-red-600 text-center text-lg font-medium mb-4">
          {error}
        </Text>
        <Text className="text-gray-600 text-center">
          Please check your connection and try again.
        </Text>
      </View>
    );
  }

  if (!user) {
    // User not authenticated
    router.replace('/(auth)/welcome');
    return null;
  }

  // Render role-based tabs
  switch (userRole) {
    case 'business':
      return <BusinessTabsLayout />;
    case 'transporter':
      return <TransporterTabsLayout />;
    case 'customer':
      return <CustomerTabsLayout />;
    case 'admin':
      return <AdminTabsLayout />;
    default:
      // Fallback - redirect to role selection
      router.replace('/(auth)/role-selection');
      return null;
  }
};

export default RoleBasedRouter;