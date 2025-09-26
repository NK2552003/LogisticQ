import React, { useState } from "react";
import { View, Text, SafeAreaView, StatusBar, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useUser } from '@clerk/clerk-expo';
import { MapPin, FileText } from "lucide-react-native";
import Header from "../components/Header";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { fetchAPI } from "../lib/fetch";

const CustomerSetup = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    preferredDeliveryAddress: "",
    deliveryInstructions: "",
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSetup = async () => {
    if (!user?.id) {
      Alert.alert("Error", "User not found. Please try logging in again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchAPI('/user/customer-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          ...formData,
        })
      });

      console.log('✅ Customer profile created successfully:', response);
      Alert.alert(
        "Success", 
        "Customer profile created successfully!",
        [{ text: "OK", onPress: () => router.replace("/(root)/(tabs)/home") }]
      );
    } catch (error) {
      console.error('❌ Error creating customer profile:', error);
      Alert.alert(
        "Error", 
        `Failed to create customer profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Setup",
      "You can complete your profile later in settings. Would you like to continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Skip", onPress: () => router.replace("/(root)/(tabs)/home") }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <Header />
      
      <ScrollView className="flex-1 px-6 mt-8">
        <View className="top-20">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            Customer Setup
          </Text>
          
          <Text className="text-gray-600 text-center mb-8">
            Setup your delivery preferences (optional)
          </Text>

          <View className="space-y-6 gap-6">
            <FormInput
              label="Preferred Delivery Address"
              value={formData.preferredDeliveryAddress}
              onChangeText={(value) => updateFormData('preferredDeliveryAddress', value)}
              placeholder="Enter your default delivery address"
              icon={MapPin}
            />

            <FormInput
              label="Delivery Instructions"
              value={formData.deliveryInstructions}
              onChangeText={(value) => updateFormData('deliveryInstructions', value)}
              placeholder="Any special delivery instructions"
              icon={FileText}
            />

            <View className="bg-green-50 p-4 rounded-lg border border-green-200">
              <Text className="text-green-800 font-medium mb-2">
                📦 Ready to Receive
              </Text>
              <Text className="text-green-700 text-sm">
                As a customer, you can track all your incoming shipments, communicate with transporters, and manage deliveries all in one place.
              </Text>
            </View>

            <View className="mt-8 mb-8 space-y-4 gap-4">
              <PrimaryButton
                title={isLoading ? "Setting up..." : "Complete Setup"}
                onPress={handleSetup}
                disabled={isLoading}
                loading={isLoading}
              />
              
              <PrimaryButton
                title="Skip for Now"
                onPress={handleSkip}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CustomerSetup;