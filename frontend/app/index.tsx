import { API_URL } from '@/config/env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image as ExpoImage } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { Asset } from "expo-asset";
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
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const handleSignUp = () => {
  router.push("./signup");

};
useEffect(() => {
    (async () => {
      await Asset.loadAsync([require("../assets/images/logo.png")]);
      setReady(true);
      SplashScreen.hideAsync();
    })();
  }, []);

  if (!ready) return null;

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }

  setIsLoading(true);

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    
  if (response.data.access_token) {  // check the token instead of success
    await AsyncStorage.setItem("token", response.data.access_token);
    router.push("./dashboard");
  } else {
    Alert.alert("Error", "Login failed");
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
  {/* Deep, nearly-flat dark background */}
  <LinearGradient
    colors={["#0B121A", "#0B121A"]}
    style={styles.gradient}
  >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="items-center mt-[22%] mb-6">
        <View className="mb-4">
          <View className="w-28 h-28 rounded-full bg-white/5 justify-center items-center overflow-hidden">
            <ExpoImage
              source={require("../assets/images/logo.png")}
              style={{ width: 100, height: 100, borderRadius: 999 }}
              contentFit="contain"
              cachePolicy="memory-disk"   // strong cache
              transition={0}              // no fade
              />
          </View>
        </View>

        {/* Brand + Tagline */}
        <View className="items-center mb-6">
          <Text className="text-white text-[34px] font-extrabold leading-tight">
            Part
            <Text className="text-[#1E63D9]">Pal</Text>
          </Text>
          <Text className="text-slate-300 text-base mt-1">
            AI-Powered Spare Parts
          </Text>
        </View>

        <Text className="text-white text-3xl font-extrabold">
          Welcome Back
        </Text>
      </View>

      {/* Form – dark surfaces, soft borders */}
      <View className="px-1">
        {/* Email */}
        <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 mb-4">
          <Ionicons
            name="mail-outline"
            size={20}
            color="#94A3B8"
            style={{ marginLeft: 16, marginRight: 12 }}
          />
          <TextInput
            className="flex-1 h-14 text-base text-white"
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 mb-2">
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#94A3B8"
            style={{ marginLeft: 16, marginRight: 12 }}
          />
          <TextInput
            className="flex-1 h-14 text-base text-white"
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-4">
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity onPress={handleForgotPassword} className="items-end mb-6">
          <Text className="text-[#1E63D9] text-sm font-semibold">
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* CTA – blue, subtle glow */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className={`rounded-2xl overflow-hidden mb-10 ${isLoading ? "opacity-70" : ""}`}
        >
          <LinearGradient
            colors={isLoading ? ["#334155", "#1F2937"] : ["#1E63D9", "#0B56C6"]}
            style={styles.buttonGradient}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-semibold">Signing In...</Text>
              </View>
            ) : (
              <Text className="text-white text-xl font-semibold">Login</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-px bg-white/10" />
          <Text className="px-4 text-slate-400 text-sm">or continue with</Text>
          <View className="flex-1 h-px bg-white/10" />
        </View>

        {/* Socials – dark tiles */}
        <View className="flex-row justify-center gap-4 mb-10">
          <TouchableOpacity className="w-14 h-14 rounded-2xl bg-white/5 justify-center items-center border border-white/10">
            <Ionicons name="logo-google" size={24} color="#4285F4" />
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 rounded-2xl bg-white/5 justify-center items-center border border-white/10">
            <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 rounded-2xl bg-white/5 justify-center items-center border border-white/10">
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center items-center mb-14">
          <Text className="text-slate-400 text-base">Don’t have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text className="text-[#1E63D9] text-base font-semibold">Sign Up</Text>
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
