import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { FileText } from 'lucide-react-native';

const InvoicesScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
            <FileText size={40} color="#8B5CF6" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Invoices & Receipts
          </Text>
          <Text className="text-gray-600 text-center">
            Manage your shipping documents
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Document Management
            </Text>
            <Text className="text-gray-600">
              • Shipping invoices
            </Text>
            <Text className="text-gray-600">
              • Delivery receipts
            </Text>
            <Text className="text-gray-600">
              • Proof of delivery
            </Text>
            <Text className="text-gray-600">
              • Download documents
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvoicesScreen;