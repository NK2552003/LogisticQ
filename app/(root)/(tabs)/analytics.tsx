import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { BarChart3 } from 'lucide-react-native';

const AnalyticsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <BarChart3 size={40} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Analytics & Reports
          </Text>
          <Text className="text-gray-600 text-center">
            Track your business performance
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Business Insights
            </Text>
            <Text className="text-gray-600">
              • Shipment volume trends
            </Text>
            <Text className="text-gray-600">
              • Cost analysis
            </Text>
            <Text className="text-gray-600">
              • Delivery performance
            </Text>
            <Text className="text-gray-600">
              • Carbon footprint savings
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;