import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AuthFooterProps {
  text: string;
  linkText: string;
  onLinkPress: () => void;
  textColor?: string;
  linkColor?: string;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({
  text,
  linkText,
  onLinkPress,
  textColor = "text-gray-500",
  linkColor = "text-black",
}) => {
  return (
    <View className="flex-row justify-center items-center mt-8">
      <Text className={textColor}>{text} </Text>
      <TouchableOpacity onPress={onLinkPress}>
        <Text className={`${linkColor} font-semibold`}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
};