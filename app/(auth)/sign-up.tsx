import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import { SafeAreaView, StatusBar, Text, View } from "react-native";
import { AuthFooter } from "../components/AuthFooter";
import { CustomCheckbox } from "../components/CustomCheckbox";
import { FormInput } from "../components/FormInput";
import { GoogleIcon } from "../components/GoogleIcon";
import Header from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SocialButton } from "../components/SocialButton";

const SignUp = () => {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <Header />
      
      <View className="flex-1 px-6 mt-8 top-28 relative">
        <Text className="text-3xl font-bold text-gray-900 text-center mb-12">
          Create an Account?
        </Text>

        <View className="space-y-6 gap-6">
          <FormInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            icon={User}
          />

          <FormInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            icon={Mail}
            keyboardType="email-address"
          />

          <FormInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            icon={Lock}
            secureTextEntry
            showSecureText={showPassword}
            onToggleSecureText={() => setShowPassword(!showPassword)}
            rightIcon={showPassword ? EyeOff : Eye}
          />

          <FormInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            icon={Lock}
            secureTextEntry
            showSecureText={showConfirmPassword}
            onToggleSecureText={() => setShowConfirmPassword(!showConfirmPassword)}
            rightIcon={showConfirmPassword ? EyeOff : Eye}
          />

          <CustomCheckbox
            checked={rememberMe}
            onToggle={() => setRememberMe(!rememberMe)}
            label="Remember me"
          />

          <PrimaryButton
            title="Sign Up"
            onPress={() => {}}
          />

          <View className="items-center">
            <Text className="text-gray-500 mb-6">Or Login with</Text>
            <SocialButton
              title="Google"
              onPress={() => {}}
              icon={<GoogleIcon />}
            />
          </View>

          <AuthFooter
            text="Already have an account?"
            linkText="Login"
            onLinkPress={() => {router.push("/(auth)/sign-in");}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignUp;
