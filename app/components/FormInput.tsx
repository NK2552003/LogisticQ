import { LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: LucideIcon;
  secureTextEntry?: boolean;
  showSecureText?: boolean;
  onToggleSecureText?: () => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  rightIcon?: LucideIcon;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  secureTextEntry = false,
  showSecureText,
  onToggleSecureText,
  keyboardType = "default",
  rightIcon: RightIcon,
}) => {
  return (
    <View className="relative">
      <View className="flex-row items-center bg-white rounded-3xl px-4 py-4 border border-gray-200">
        <Icon size={20} color="#9ca3af" className="mr-3" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showSecureText}
          keyboardType={keyboardType}
          className="flex-1 text-gray-900 text-base ml-3 mr-3"
          placeholderTextColor="#9ca3af"
        />
        {onToggleSecureText && RightIcon && (
          <TouchableOpacity onPress={onToggleSecureText}>
            <RightIcon size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
      <View className="absolute -top-2 left-4 bg-gray-50 px-2 rounded-full">
        <Text className="text-gray-600 text-sm">{label}</Text>
      </View>
    </View>
  );
};
