import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Star } from 'lucide-react-native';

const RatingsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Star size={40} color="#10B981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Ratings & Reviews
          </Text>
          <Text className="text-gray-600 text-center">
            View your performance ratings
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Performance Metrics
            </Text>
            <Text className="text-gray-600">
              • Overall rating
            </Text>
            <Text className="text-gray-600">
              • Customer reviews
            </Text>
            <Text className="text-gray-600">
              • Delivery performance
            </Text>
            <Text className="text-gray-600">
              • Improvement suggestions
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RatingsScreen;