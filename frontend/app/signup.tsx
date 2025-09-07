import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { API_URL } from '@/config/env';
import axios from "axios";

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

export default function SignUpScreen() {
  const [name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== password_confirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the Terms and Conditions');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        phone,
        password,
        password_confirmation
      });

      if (response.data.success) {
        Alert.alert('Success', 'Account created successfully');
        router.push("/");
      } else {
        Alert.alert('Error', response.data.message || 'Sign up failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const router = useRouter();
  const handleSignIn = () => {
    router.push("/");
  };


  return (
    <KeyboardAvoidingView
  className="flex-1"
  behavior={Platform.OS === "ios" ? "padding" : "height"}
>
  {/* Deep, flat dark background like login */}
  <LinearGradient colors={["#0B121A", "#0B121A"]} style={styles.gradient}>
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="items-center mt-[14%] mb-5">
        <View className="w-24 h-24 rounded-full bg-white/5 justify-center items-center mb-3">
          <Image
            source={require("../assets/images/logo.png")}
            style={{ width: 96, height: 96, resizeMode: "contain" }}
          />
        </View>

        <Text className="text-white text-[34px] font-extrabold leading-tight">
          Part<Text className="text-[#1E63D9]">Pal</Text>
        </Text>
        <Text className="text-slate-300 text-base mt-1">
          AI-Powered Spare Parts
        </Text>

        <Text className="text-white text-3xl font-extrabold mt-5">
          Welcome to PartPal
        </Text>
      </View>

      {/* Form */}
      <View className="mt-2">
        {/* Name */}
        <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 mb-4">
          <Ionicons
            name="person-outline"
            size={20}
            color="#94A3B8"
            style={{ marginLeft: 16, marginRight: 12 }}
          />
          <TextInput
            className="flex-1 h-14 text-base text-white pr-11"
            placeholder="Name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Email */}
        <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 mb-4">
          <Ionicons
            name="mail-outline"
            size={20}
            color="#94A3B8"
            style={{ marginLeft: 16, marginRight: 12 }}
          />
          <TextInput
            className="flex-1 h-14 text-base text-white pr-11"
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Phone */}
        <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 mb-4">
          <Ionicons
            name="call-outline"
            size={20}
            color="#94A3B8"
            style={{ marginLeft: 16, marginRight: 12 }}
          />
          <TextInput
            className="flex-1 h-14 text-base text-white pr-11"
            placeholder="Phone"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 mb-4">
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
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-3">
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 mb-2">
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#94A3B8"
            style={{ marginLeft: 16, marginRight: 12 }}
          />
          <TextInput
            className="flex-1 h-14 text-base text-white"
            placeholder="Confirm Password"
            placeholderTextColor="#94A3B8"
            value={password_confirmation}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            className="px-3"
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* (Optional) Forgot Password link, if you want it here */}
        {/* <TouchableOpacity onPress={handleForgotPassword} className="items-end mb-4">
          <Text className="text-[#1E63D9] text-sm font-semibold">Forgot Password?</Text>
        </TouchableOpacity> */}

        {/* Terms */}
        <TouchableOpacity
          onPress={() => setAcceptTerms(!acceptTerms)}
          className="flex-row items-center mb-5"
        >
          <View
            className={`w-5 h-5 rounded-md mr-2 items-center justify-center ${
              acceptTerms ? "bg-[#1E63D9] border-[#1E63D9]" : "bg-transparent border-white/25"
            } border`}
          >
            {acceptTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text className="text-slate-200 flex-1">
            I agree to the <Text className="text-[#1E63D9] font-semibold">Terms and Conditions</Text> and{" "}
            <Text className="text-[#1E63D9] font-semibold">Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* CTA – blue gradient like login */}
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={isLoading}
          className={`rounded-2xl overflow-hidden mb-10 ${isLoading ? "opacity-70" : ""}`}
        >
          <LinearGradient
            colors={isLoading ? ["#334155", "#1F2937"] : ["#1E63D9", "#0B56C6"]}
            style={styles.buttonGradient}
          >
            <Text className="text-white text-xl font-semibold">
              {isLoading ? "Creating Account..." : "Sign Up / Login"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <View className="flex-row justify-center items-center mb-12">
          <Text className="text-slate-400 text-base">Already have an account? </Text>
          <TouchableOpacity onPress={handleSignIn}>
            <Text className="text-[#1E63D9] text-base font-semibold">Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </LinearGradient>
</KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: 12,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 14,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#667eea',
    fontWeight: '600',
  },
  signUpButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  signInText: {
    color: '#666',
    fontSize: 16,
  },
  signInLink: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});