import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

const DisputesScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
            <AlertTriangle size={40} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Dispute Resolution
          </Text>
          <Text className="text-gray-600 text-center">
            Handle platform disputes
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Dispute Management
            </Text>
            <Text className="text-gray-600">
              • Review disputes
            </Text>
            <Text className="text-gray-600">
              • Chat log analysis
            </Text>
            <Text className="text-gray-600">
              • Mediation tools
            </Text>
            <Text className="text-gray-600">
              • Refund processing
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DisputesScreen;