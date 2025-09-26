import React, { useState } from "react";
import { View, Text, SafeAreaView, StatusBar, TouchableOpacity, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { useUser } from '@clerk/clerk-expo';
import { Truck, Building2, User, Shield } from "lucide-react-native";
import Header from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { fetchAPI } from "../lib/fetch";

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
}

const RoleSelection = () => {
  const { user } = useUser();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const roles: RoleOption[] = [
    {
      id: "business",
      title: "Business / Shipper",
      description: "Ship goods and manage logistics",
      icon: Building2,
      color: "border-blue-500 bg-blue-50",
      features: [
        "Create and manage shipments",
        "Track multiple orders",
        "Access analytics and reports",
        "Manage invoices and payments"
      ]
    },
    {
      id: "transporter",
      title: "Transporter / Driver",
      description: "Transport goods and earn money",
      icon: Truck,
      color: "border-green-500 bg-green-50",
      features: [
        "Accept delivery requests",
        "Real-time GPS tracking",
        "Earnings management",
        "Route optimization"
      ]
    },
    {
      id: "customer",
      title: "Customer / Receiver",
      description: "Receive shipments and track deliveries",
      icon: User,
      color: "border-purple-500 bg-purple-50",
      features: [
        "Track incoming shipments",
        "Real-time delivery updates",
        "Chat with transporters",
        "Delivery confirmations"
      ]
    },
    {
      id: "admin",
      title: "Administrator",
      description: "Manage platform and users",
      icon: Shield,
      color: "border-red-500 bg-red-50",
      features: [
        "User management",
        "System analytics",
        "Dispute resolution",
        "Platform settings"
      ]
    }
  ];

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert("Error", "Please select a role to continue");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not found. Please try logging in again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchAPI('/user/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          role: selectedRole,
        })
      });

      console.log('✅ Role updated successfully:', response);
      
      // Navigate to role-specific onboarding or main app
      switch (selectedRole) {
        case 'business':
          router.push('/(auth)/business-setup');
          break;
        case 'transporter':
          router.push('/(auth)/transporter-setup');
          break;
        case 'customer':
          router.push('/(auth)/customer-setup');
          break;
        case 'admin':
          router.replace('/(root)/(tabs)/home');
          break;
        default:
          router.replace('/(root)/(tabs)/home');
      }
    } catch (error) {
      console.error('❌ Error updating role:', error);
      Alert.alert(
        "Error", 
        `Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <Header />
      
      <ScrollView className="flex-1 px-6 mt-8">
        <View className="top-20">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            Choose Your Role
          </Text>
          
          <Text className="text-gray-600 text-center mb-8">
            Select how you'll be using our logistics platform
          </Text>

          <View className="space-y-6 gap-4">
            {roles.map((role) => {
              const IconComponent = role.icon;
              const isSelected = selectedRole === role.id;
              
              return (
                <TouchableOpacity
                  key={role.id}
                  onPress={() => setSelectedRole(role.id)}
                  className={`p-6 rounded-2xl border-2 ${
                    isSelected 
                      ? role.color + " border-opacity-100" 
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View className="flex-row items-start mb-4">
                    <View className={`p-3 rounded-full ${
                      isSelected ? "bg-white" : "bg-gray-100"
                    } mr-4`}>
                      <IconComponent 
                        size={24} 
                        color={isSelected ? role.color.includes('blue') ? '#3B82F6' : 
                               role.color.includes('green') ? '#10B981' :
                               role.color.includes('purple') ? '#8B5CF6' : '#EF4444' : '#6B7280'} 
                      />
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`text-lg font-bold mb-2 ${
                        isSelected ? "text-gray-900" : "text-gray-800"
                      }`}>
                        {role.title}
                      </Text>
                      <Text className={`text-sm mb-3 ${
                        isSelected ? "text-gray-700" : "text-gray-600"
                      }`}>
                        {role.description}
                      </Text>
                      
                      <View className="space-y-1">
                        {role.features.map((feature, index) => (
                          <Text 
                            key={index}
                            className={`text-xs ${
                              isSelected ? "text-gray-600" : "text-gray-500"
                            }`}
                          >
                            • {feature}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  {isSelected && (
                    <View className="absolute top-4 right-4">
                      <View className="w-6 h-6 bg-yellow-500 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">✓</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="mt-8 mb-20">
            <PrimaryButton
              title={isLoading ? "Setting up..." : "Continue"}
              onPress={handleRoleSelection}
              disabled={isLoading || !selectedRole}
              loading={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RoleSelection;