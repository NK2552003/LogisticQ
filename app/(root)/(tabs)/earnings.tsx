import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { DollarSign } from 'lucide-react-native';

const EarningsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <DollarSign size={40} color="#10B981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Earnings
          </Text>
          <Text className="text-gray-600 text-center">
            Track your earnings and payouts
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Earnings Overview
            </Text>
            <Text className="text-gray-600">
              • Total earnings
            </Text>
            <Text className="text-gray-600">
              • Pending payments
            </Text>
            <Text className="text-gray-600">
              • Commission breakdown
            </Text>
            <Text className="text-gray-600">
              • Payout history
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EarningsScreen;