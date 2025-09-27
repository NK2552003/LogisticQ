import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";

interface BackButtonProps {
  onPress?: () => void;
  route?: any;
  backgroundColor?: string;
  borderColor?: string;
  iconColor?: string;
  size?: number;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  route,
  backgroundColor = "bg-white",
  borderColor = "border-yellow-400",
  iconColor = "#374151",
  size = 20,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (route) {
      router.push(route);
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      className={`absolute top-12 left-6 z-50 p-3 rounded-2xl border ${borderColor} ${backgroundColor} shadow-lg`}
      onPress={handlePress}
    >
      <ArrowLeft size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

export default BackButton;