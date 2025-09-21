import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useSignUp } from '@clerk/clerk-expo';
import { AuthFooter } from "../components/AuthFooter";
import { CustomCheckbox } from "../components/CustomCheckbox";
import { FormInput } from "../components/FormInput";
import { GoogleIcon } from "../components/GoogleIcon";
import Header from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SocialButton } from "../components/SocialButton";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validate form inputs
  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }
    return true;
  };

  // Handle sign up
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Create user with Clerk
      await signUp.create({
        emailAddress: email,
        password,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // Show verification form
      setPendingVerification(true);
      Alert.alert(
        "Verification Required", 
        "Please check your email for a verification code"
      );
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        "Sign Up Error", 
        err.errors?.[0]?.message || "An error occurred during sign up"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    if (!verificationCode.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setIsLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        Alert.alert("Error", "Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        "Verification Error", 
        err.errors?.[0]?.message || "An error occurred during verification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const resendCode = async () => {
    if (!isLoaded) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert("Success", "Verification code sent to your email");
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", "Failed to resend verification code");
    }
  };

  // If pending verification, show verification screen
  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <Header />
        
        <View className="flex-1 px-6 mt-8 top-32 relative">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            Verify Your Email
          </Text>
          
          <Text className="text-gray-600 text-center mb-12">
            We've sent a verification code to {email}
          </Text>

          <View className="space-y-6 gap-6">
            <FormInput
              label="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter verification code"
              icon={Mail}
            />

            <PrimaryButton
              title={isLoading ? "Verifying..." : "Verify Email"}
              onPress={onVerifyPress}
              disabled={isLoading}
            />

            <View className="items-center w-full">
              <Text className="text-gray-500 mb-4">
                Didn't receive the code?
              </Text>
              <TouchableOpacity onPress={resendCode} className="border border-yellow-500 w-full items-center justify-center px-3 py-4 rounded-3xl">
                <Text className="font-bold text-yellow-500">Resend Code</Text>
              </TouchableOpacity>
            </View>

            <AuthFooter
              text="Back to"
              linkText="Sign Up"
              onLinkPress={() => setPendingVerification(false)}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            title={isLoading ? "Creating Account..." : "Sign Up"}
            onPress={onSignUpPress}
            disabled={isLoading}
          />

          <View className="items-center">
            <Text className="text-gray-500 mb-6">Or Login with</Text>
            <SocialButton
              title="Google"
              onPress={() => {
                // TODO: Implement Google OAuth with Clerk
                Alert.alert("Coming Soon", "Google sign-in will be available soon");
              }}
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