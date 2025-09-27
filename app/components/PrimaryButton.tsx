import React from "react";
import { Text, TouchableOpacity } from "react-native";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  backgroundColor = "bg-yellow-400",
  textColor = "text-black",
  disabled = false,
  loading = false,
}) => {
  return (
    <TouchableOpacity
      className={`${backgroundColor} rounded-3xl py-4 ${
        disabled ? "opacity-50" : ""
      }`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text className={`${textColor} text-center text-lg font-semibold`}>
        {loading ? "Loading..." : title}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;
