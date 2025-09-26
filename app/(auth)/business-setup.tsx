import React, { useState } from "react";
import { View, Text, SafeAreaView, StatusBar, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useUser } from '@clerk/clerk-expo';
import { Building2, Mail, Phone, MapPin, FileText } from "lucide-react-native";
import Header from "../components/Header";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { fetchAPI } from "../lib/fetch";

const BusinessSetup = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "",
    gstNumber: "",
    businessAddress: "",
    contactPerson: "",
    businessPhone: "",
    businessEmail: "",
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      Alert.alert("Error", "Please enter your company name");
      return false;
    }
    if (!formData.businessType.trim()) {
      Alert.alert("Error", "Please enter your business type");
      return false;
    }
    if (!formData.businessAddress.trim()) {
      Alert.alert("Error", "Please enter your business address");
      return false;
    }
    if (!formData.contactPerson.trim()) {
      Alert.alert("Error", "Please enter contact person name");
      return false;
    }
    if (!formData.businessPhone.trim()) {
      Alert.alert("Error", "Please enter business phone number");
      return false;
    }
    if (!formData.businessEmail.trim()) {
      Alert.alert("Error", "Please enter business email");
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
      const response = await fetchAPI('/user/business-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          ...formData,
        })
      });

      console.log('✅ Business profile created successfully:', response);
      Alert.alert(
        "Success", 
        "Business profile created successfully!",
        [{ text: "OK", onPress: () => router.replace("/(root)/(tabs)/home") }]
      );
    } catch (error) {
      console.error('❌ Error creating business profile:', error);
      Alert.alert(
        "Error", 
        `Failed to create business profile: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            Business Setup
          </Text>
          
          <Text className="text-gray-600 text-center mb-8">
            Tell us about your business to get started
          </Text>

          <View className="space-y-6 gap-6">
            <FormInput
              label="Company Name"
              value={formData.companyName}
              onChangeText={(value) => updateFormData('companyName', value)}
              placeholder="Enter your company name"
              icon={Building2}
            />

            <FormInput
              label="Business Type"
              value={formData.businessType}
              onChangeText={(value) => updateFormData('businessType', value)}
              placeholder="e.g., E-commerce, Manufacturing, Retail"
              icon={FileText}
            />

            <FormInput
              label="GST Number (Optional)"
              value={formData.gstNumber}
              onChangeText={(value) => updateFormData('gstNumber', value)}
              placeholder="Enter GST number"
              icon={FileText}
            />

            <FormInput
              label="Business Address"
              value={formData.businessAddress}
              onChangeText={(value) => updateFormData('businessAddress', value)}
              placeholder="Enter complete business address"
              icon={MapPin}
            />

            <FormInput
              label="Contact Person"
              value={formData.contactPerson}
              onChangeText={(value) => updateFormData('contactPerson', value)}
              placeholder="Enter contact person name"
              icon={Building2}
            />

            <FormInput
              label="Business Phone"
              value={formData.businessPhone}
              onChangeText={(value) => updateFormData('businessPhone', value)}
              placeholder="Enter business phone number"
              icon={Phone}
              keyboardType="phone-pad"
            />

            <FormInput
              label="Business Email"
              value={formData.businessEmail}
              onChangeText={(value) => updateFormData('businessEmail', value)}
              placeholder="Enter business email"
              icon={Mail}
              keyboardType="email-address"
            />

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

export default BusinessSetup;