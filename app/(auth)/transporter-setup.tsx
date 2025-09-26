import React, { useState } from "react";
import { View, Text, SafeAreaView, StatusBar, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useUser } from '@clerk/clerk-expo';
import { Truck, FileText, MapPin, Star } from "lucide-react-native";
import Header from "../components/Header";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { fetchAPI } from "../lib/fetch";

const TransporterSetup = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
    vehicleCapacityKg: "",
    serviceAreas: "",
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.vehicleType.trim()) {
      Alert.alert("Error", "Please enter your vehicle type");
      return false;
    }
    if (!formData.vehicleNumber.trim()) {
      Alert.alert("Error", "Please enter your vehicle number");
      return false;
    }
    if (!formData.licenseNumber.trim()) {
      Alert.alert("Error", "Please enter your license number");
      return false;
    }
    if (!formData.vehicleCapacityKg.trim()) {
      Alert.alert("Error", "Please enter vehicle capacity");
      return false;
    }
    if (!formData.serviceAreas.trim()) {
      Alert.alert("Error", "Please enter service areas");
      return false;
    }
    return true;
  };

  const handleSetup = async () => {
    if (!validateForm()) return;

    if (!user?.id) {
      Alert.alert("Error", "User not found. Please try logging in again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchAPI('/user/transporter-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          ...formData,
          vehicleCapacityKg: parseFloat(formData.vehicleCapacityKg),
          serviceAreas: formData.serviceAreas.split(',').map(area => area.trim()),
        })
      });

      console.log('✅ Transporter profile created successfully:', response);
      Alert.alert(
        "Success", 
        "Transporter profile created successfully! Your account will be verified within 24 hours.",
        [{ text: "OK", onPress: () => router.replace("/(root)/(tabs)/home") }]
      );
    } catch (error) {
      console.error('❌ Error creating transporter profile:', error);
      Alert.alert(
        "Error", 
        `Failed to create transporter profile: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            Transporter Setup
          </Text>
          
          <Text className="text-gray-600 text-center mb-8">
            Setup your vehicle and service details
          </Text>

          <View className="space-y-6 gap-6">
            <FormInput
              label="Vehicle Type"
              value={formData.vehicleType}
              onChangeText={(value) => updateFormData('vehicleType', value)}
              placeholder="e.g., Truck, Van, Motorcycle"
              icon={Truck}
            />

            <FormInput
              label="Vehicle Number"
              value={formData.vehicleNumber}
              onChangeText={(value) => updateFormData('vehicleNumber', value)}
              placeholder="Enter vehicle registration number"
              icon={FileText}
            />

            <FormInput
              label="License Number"
              value={formData.licenseNumber}
              onChangeText={(value) => updateFormData('licenseNumber', value)}
              placeholder="Enter driving license number"
              icon={FileText}
            />

            <FormInput
              label="Vehicle Capacity (KG)"
              value={formData.vehicleCapacityKg}
              onChangeText={(value) => updateFormData('vehicleCapacityKg', value)}
              placeholder="Enter maximum load capacity"
              icon={Star}
              keyboardType="numeric"
            />

            <FormInput
              label="Service Areas"
              value={formData.serviceAreas}
              onChangeText={(value) => updateFormData('serviceAreas', value)}
              placeholder="Enter cities/areas (comma separated)"
              icon={MapPin}
            />

            <View className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Text className="text-blue-800 font-medium mb-2">
                📋 Verification Required
              </Text>
              <Text className="text-blue-700 text-sm">
                After setup, you'll need to upload verification documents including driving license, vehicle registration, and insurance papers for account approval.
              </Text>
            </View>

            <View className="mt-8 mb-20">
              <PrimaryButton
                title={isLoading ? "Setting up..." : "Complete Setup"}
                onPress={handleSetup}
                disabled={isLoading}
                loading={isLoading}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransporterSetup;