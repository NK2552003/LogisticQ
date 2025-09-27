import React from "react";
import { Text, TouchableOpacity } from "react-native";

interface SocialButtonProps {
  title: string;
  onPress: () => void;
  icon: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  title,
  onPress,
  icon,
  backgroundColor = "bg-white",
  textColor = "text-gray-700",
  borderColor = "border-gray-200",
}) => {
  return (
    <TouchableOpacity
      className={`${backgroundColor} rounded-3xl px-8 py-4 border ${borderColor} flex-row items-center w-full justify-center gap-2`}
      onPress={onPress}
    >
      {icon}
      <Text className={`${textColor} font-medium`}>{title}</Text>
    </TouchableOpacity>
  );
};

export default SocialButton;