import { API_URL } from '@/config/env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleSignUp = () => {
  router.push("./signup");
};

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }

  setIsLoading(true);

  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    
    if (response.data.success) {
      await AsyncStorage.setItem("token", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      router.push("./dashboard");
    } else {
      Alert.alert("Error", response.data.message || "Login failed");
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong");
  } finally {
    setIsLoading(false);
  }
};


  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset link sent to your email');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="items-center mt-[10%] mb-7">
            <View className="mb-5">
              <View className="w-20 h-20 rounded-full bg-white/20 justify-center items-center border-2 border-white/30">
                <Ionicons name="person-outline" size={40} color="#fff" />
              </View>
            </View>
            <Text className="text-white text-2xl font-bold">Welcome Back !</Text>
          </View>
{/* Login Form */}
          <View className="bg-white rounded-3xl px-6 py-8">
            {/* Email */}
            <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-200 mb-4">
              <Ionicons
                name="mail-outline"
                size={20}
                color="#666"
                style={{ marginLeft: 16, marginRight: 12 }}
              />
              <TextInput
                className="flex-1 h-14 text-base text-gray-800"
                placeholder="Email address"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-200 mb-4">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={{ marginLeft: 16, marginRight: 12 }}
              />
              <TextInput
                className="flex-1 h-14 text-base text-gray-800"
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="px-4"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              className="items-end mb-4"
            >
              <Text className="text-indigo-500 text-sm font-semibold">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`rounded-xl overflow-hidden mb-8 ${
                isLoading ? "opacity-70" : ""
              }`}
            >
              <LinearGradient
                colors={isLoading ? ['#ccc', '#999'] : ['#ff6b6b', '#ee5a52']}
                style={styles.buttonGradient}
              >
               {isLoading ? (
                  <View className="flex-row items-center">
                    <Text className="text-white text-lg font-semibold">
                      Signing In...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white text-xl font-semibold">
                    Sign In
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

           {/* Divider */}
            <View className="flex-row items-center mb-8">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-4 text-gray-600 text-sm">or continue with</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Social Buttons */}
            <View className="flex-row justify-center gap-4 mb-8">
              <TouchableOpacity className="w-14 h-14 rounded-xl bg-gray-100 justify-center items-center border border-gray-200">
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-xl bg-gray-100 justify-center items-center border border-gray-200">
                <Ionicons name="logo-apple" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-xl bg-gray-100 justify-center items-center border border-gray-200">
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-base">
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text className="text-indigo-500 text-base font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
