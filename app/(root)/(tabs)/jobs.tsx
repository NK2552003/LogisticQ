import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Briefcase } from 'lucide-react-native';

const JobsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Briefcase size={40} color="#10B981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Available Jobs
          </Text>
          <Text className="text-gray-600 text-center">
            Find and accept delivery jobs
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Job Features
            </Text>
            <Text className="text-gray-600">
              • Browse available jobs
            </Text>
            <Text className="text-gray-600">
              • Accept/reject requests
            </Text>
            <Text className="text-gray-600">
              • View job details
            </Text>
            <Text className="text-gray-600">
              • Track earnings
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobsScreen;