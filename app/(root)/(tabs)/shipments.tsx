import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Package } from 'lucide-react-native';

const ShipmentsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
            <Package size={40} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Shipment Management
          </Text>
          <Text className="text-gray-600 text-center">
            Oversee all platform shipments
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Shipment Operations
            </Text>
            <Text className="text-gray-600">
              • View all shipments
            </Text>
            <Text className="text-gray-600">
              • Edit shipment details
            </Text>
            <Text className="text-gray-600">
              • Reassign transporters
            </Text>
            <Text className="text-gray-600">
              • Handle disputes
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShipmentsScreen;