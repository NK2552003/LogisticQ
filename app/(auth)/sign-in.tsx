// screens/Login.tsx
import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthFooter } from "../components/AuthFooter";
import { CustomCheckbox } from "../components/CustomCheckbox";
import { FormInput } from "../components/FormInput";
import { GoogleIcon } from "../components/GoogleIcon";
import Header from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SocialButton } from "../components/SocialButton";

const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // Add your login logic here
    console.log("Login attempt:", { email, password, rememberMe });
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to main app or handle login success
      // router.push("/(tabs)/home");
    }, 2000);
  };

  const handleGoogleLogin = () => {
    console.log("Google login pressed");
    // Add Google authentication logic here
  };

  const handleForgotPassword = () => {
    console.log("Forgot password pressed");
    // Navigate to forgot password screen
    // router.push("/(auth)/forgot-password");
  };

  const handleSignUpNavigation = () => {
    router.push("/(auth)/sign-up");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <Header />
      
      {/* Content */}
      <View className="flex-1 px-6 mt-8 top-28 relative">
        <Text className="text-3xl font-bold text-gray-900 text-center mb-12">
          Welcome Back!
        </Text>

        {/* Form */}
        <View className="space-y-6 gap-6">
          {/* Email Input */}
          <FormInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            icon={Mail}
            keyboardType="email-address"
          />

          {/* Password Input */}
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

          {/* Remember Me & Forgot Password Row */}
          <View className="flex-row justify-between items-center">
            <CustomCheckbox
              checked={rememberMe}
              onToggle={() => setRememberMe(!rememberMe)}
              label="Remember me"
            />
            
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text className="text-yellow-600 font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <PrimaryButton
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!email || !password}
          />

          {/* Or Login With */}
          <View className="items-center">
            <Text className="text-gray-500 mb-6">Or Login with</Text>
            
            <SocialButton
              title="Google"
              onPress={handleGoogleLogin}
              icon={<GoogleIcon />}
            />
          </View>

          {/* Sign Up Link */}
          <AuthFooter
            text="Don't have an account?"
            linkText="Sign Up"
            onLinkPress={handleSignUpNavigation}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;