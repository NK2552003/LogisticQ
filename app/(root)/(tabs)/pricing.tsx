import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { DollarSign } from 'lucide-react-native';

const PricingScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
            <DollarSign size={40} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Pricing & Commission
          </Text>
          <Text className="text-gray-600 text-center">
            Configure platform pricing
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Pricing Controls
            </Text>
            <Text className="text-gray-600">
              • Set per-km rates
            </Text>
            <Text className="text-gray-600">
              • Configure weight-based pricing
            </Text>
            <Text className="text-gray-600">
              • Platform commission rates
            </Text>
            <Text className="text-gray-600">
              • Special pricing rules
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PricingScreen;