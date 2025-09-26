// screens/Login.tsx
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import { AuthFooter } from "../components/AuthFooter";
import { CustomCheckbox } from "../components/CustomCheckbox";
import { FormInput } from "../components/FormInput";
import { GoogleIcon } from "../components/GoogleIcon";
import Header from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SocialButton } from "../components/SocialButton";

const Login = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!isLoaded) return;
    
    setIsLoading(true);
    
    try {
      // Start the sign-in process using the email and password provided
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/'); // Navigate to your main app
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
        Alert.alert('Sign In', 'Please complete the additional steps required.');
      }
    } catch (err: any) {
      // Handle authentication errors
      console.error(JSON.stringify(err, null, 2));
      
      // Show user-friendly error message
      const errorMessage = err.errors?.[0]?.message || 'An error occurred during sign in';
      Alert.alert('Sign In Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    try {
      const { createdSessionId, signIn: googleSignIn, signUp, setActive: googleSetActive } = await startOAuthFlow();

      if (createdSessionId) {
        // User signed in successfully with Google
        if (typeof googleSetActive === "function") {
          await googleSetActive({ session: createdSessionId });
        }
        
        // Navigate to your main app screen
        router.replace("/"); // Adjust this path based on your app structure
      } else {
        // Handle sign-up or sign-in flow
        // This happens when the user needs to complete additional steps
        console.log("Additional steps required for Google sign-in");
        Alert.alert(
          'Sign In', 
          'Please complete the additional steps required to finish signing in with Google.'
        );
      }
    } catch (err: any) {
      console.error("Google OAuth error", err);
      
      // Show user-friendly error message
      const errorMessage = err.errors?.[0]?.message || 'Failed to sign in with Google';
      Alert.alert(
        "Google Sign In Error", 
        `${errorMessage}. Please try again.`
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot password pressed");
    // Navigate to forgot password screen
    router.push("/(auth)/forgot-password");
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
            secureTextEntry={!showPassword}
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
            disabled={!email || !password || !isLoaded || isGoogleLoading}
          />

          {/* Or Login With */}
          <View className="items-center">
            <Text className="text-gray-500 mb-6">Or Login with</Text>
            
            <SocialButton
              title="Continue with Google"
              onPress={handleGoogleLogin}
              icon={<GoogleIcon />}
              backgroundColor="bg-white"
              textColor="text-gray-700"
              borderColor="border-gray-200"
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