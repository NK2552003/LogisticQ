import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Settings } from 'lucide-react-native';

const SettingsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
            <Settings size={40} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            System Settings
          </Text>
          <Text className="text-gray-600 text-center">
            Configure platform settings
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              System Configuration
            </Text>
            <Text className="text-gray-600">
              • Language settings
            </Text>
            <Text className="text-gray-600">
              • AI algorithm configuration
            </Text>
            <Text className="text-gray-600">
              • Admin role management
            </Text>
            <Text className="text-gray-600">
              • System maintenance
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;