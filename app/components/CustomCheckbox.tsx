import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CustomCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  checkmarkColor?: string;
  checkedBackgroundColor?: string;
  checkedBorderColor?: string;
  uncheckedBorderColor?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onToggle,
  label,
  checkmarkColor = "text-white",
  checkedBackgroundColor = "bg-yellow-400",
  checkedBorderColor = "border-yellow-400",
  uncheckedBorderColor = "border-gray-300",
}) => {
  return (
    <View className="flex-row items-center">
      <TouchableOpacity
        onPress={onToggle}
        className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
          checked
            ? `${checkedBackgroundColor} ${checkedBorderColor}`
            : uncheckedBorderColor
        }`}
      >
        {checked && <Text className={`${checkmarkColor} text-xs`}>✓</Text>}
      </TouchableOpacity>
      <Text className="text-gray-600">{label}</Text>
    </View>
  );
};

export default CustomCheckbox;
