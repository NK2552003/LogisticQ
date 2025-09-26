import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Plus, Package, BarChart3, DollarSign } from 'lucide-react-native';

const CreateShipmentScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Plus size={40} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Create Shipment
          </Text>
          <Text className="text-gray-600 text-center">
            Create and manage your shipments
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Quick Actions
            </Text>
            <Text className="text-gray-600">
              • Create new shipment
            </Text>
            <Text className="text-gray-600">
              • Set pickup and delivery locations
            </Text>
            <Text className="text-gray-600">
              • Calculate shipping costs
            </Text>
            <Text className="text-gray-600">
              • Assign transporters
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateShipmentScreen;