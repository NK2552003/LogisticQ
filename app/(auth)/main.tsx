// screens/Welcome.tsx
import { router } from "expo-router";
import React from "react";
import { Dimensions, Image, SafeAreaView, Text, View, Alert } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { GoogleIcon } from "../components/GoogleIcon";
import { PrimaryButton } from "../components/PrimaryButton";
import { SocialButton } from "../components/SocialButton";

const { width, height } = Dimensions.get("window");

const MainPage = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleSignUp = () => {
    router.push("/(auth)/sign-up");
  };

  const handleSignIn = () => {
    router.push("/(auth)/sign-in");
  };

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        // User signed in successfully
        if (setActive) {
          await setActive({ session: createdSessionId });
        }
        
        // Navigate to your main app screen
        router.replace("/"); // Adjust this path based on your app structure
      } else {
        // Handle sign-up or sign-in flow
        // This happens when the user needs to complete additional steps
        console.log("Additional steps required");
      }
    } catch (err) {
      console.error("OAuth error", err);
      Alert.alert(
        "Sign In Error", 
        "Failed to sign in with Google. Please try again."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Content */}
      <View className="flex-1 px-6 justify-center items-center">
        {/* Welcome Illustration/Logo Area */}
        <View className="items-center mb-12">
          {/* You can replace this with your app's illustration or logo */}
          <View className="w-48 h-48 bg-yellow-100 rounded-full items-center justify-center mb-8">
            <View className="w-32 h-32 bg-yellow-400 rounded-full items-center justify-center">
              <Image
                source={require("../Utils/semi.png")}
                className="w-20 h-20"
                resizeMode="contain"
              />
            </View>
          </View>

          <Text className="text-3xl font-bold text-gray-900 text-center mb-4 flex-row items-center justify-center">
            Welcome to
            <View className="flex-row items-center justify-center">
              <Text className="text-3xl font-bold text-gray-900">L</Text>
              <View className="w-8 h-8 bg-yellow-400 rounded-full mx-1 items-center justify-center">
                <View className="w-4 h-4 bg-white rounded-full" />
              </View>
              <Text className="text-3xl font-bold text-gray-900">gistic</Text>
              <View className="w-8 h-8 bg-yellow-400 rounded-full mx-1 items-center justify-center">
                <Text className="text-xl font-bold text-white">Q</Text>
              </View>
            </View>
            <View className="w-10" />
          </Text>

          <Text className="text-gray-600 text-center text-base leading-6 px-4">
            Join thousands of users who trust us with their daily tasks and
            goals
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="w-full space-y-4 gap-4">
          {/* Sign Up Button */}
          <PrimaryButton
            title="Create Account"
            onPress={handleSignUp}
            backgroundColor="bg-yellow-400"
            textColor="text-black"
          />

          {/* Sign In Button */}
          <PrimaryButton
            title="Sign In"
            onPress={handleSignIn}
            backgroundColor="bg-white"
            textColor="text-gray-900"
          />

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="px-4 text-gray-500 text-sm">or continue with</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Google Sign In */}
          <SocialButton
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            icon={<GoogleIcon size={20} />}
            backgroundColor="bg-white"
            textColor="text-gray-700"
            borderColor="border-gray-200"
          />
        </View>

        {/* Terms and Privacy */}
        <View className="mt-4 px-8">
          <Text className="text-center text-xs text-gray-400 leading-5">
            By continuing, you agree to our{" "}
            <Text className="text-yellow-600 underline">Terms of Service</Text>{" "}
            and{" "}
            <Text className="text-yellow-600 underline">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MainPage;