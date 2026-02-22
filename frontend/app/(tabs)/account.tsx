import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "@/config/env";
import { useRouter } from "expo-router";
import { ArrowRightOnRectangleIcon } from "react-native-heroicons/outline";

type Me = {
  id: number;
  email: string;
  name?: string | null;
  phone?: string | null;
};

export default function Account() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [me, setMe] = useState<Me | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const api = axios.create({
    baseURL: API_URL,
    timeout: 25000,
  });

  const loadMe = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Please login again.");
        router.replace("/");
        return;
      }

      const res = await api.get("/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data as Me;
      setMe(data);
      setName(data.name || "");
      setPhone(data.phone || "");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.put(
        "/user/profile",
        { name, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMe(res.data);
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || e?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert("Missing fields", "Please fill all password fields.");
      return;
    }
    if (newPw.length < 6) {
      Alert.alert("Weak password", "New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert("Mismatch", "New password and confirm password do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await api.put(
        "/user/password",
        { current_password: currentPw, new_password: newPw },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      Alert.alert("Success", "Password updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || e?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("role");
    router.replace("/");
  };

  useEffect(() => {
    loadMe();
  }, []);

  return (
    <View className="flex-1 bg-gray-900">
      {/* Top bar (your UI) */}
      <View className="bg-gray-800 pt-12 px-6 shadow-lg">
        <View className="px-3 pt-4 pb-4 flex-row items-center justify-between">
          <Text className="text-white text-3xl font-extrabold">PartPal</Text>

          <Pressable onPress={logout} className="flex-row items-center">
            <ArrowRightOnRectangleIcon size={22} color="#9CA3AF" />
            <Text className="text-gray-300 ml-2">Logout</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
          <Text className="text-gray-400 mt-3">Loading account…</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Profile card */}
          <View className="mx-6 mt-6 bg-gray-800 border border-gray-700 rounded-3xl p-5">
            <Text className="text-white text-xl font-extrabold">Account Settings</Text>
            <Text className="text-gray-400 mt-1">Update your name and phone number.</Text>

            {/* Email readonly */}
            <Text className="text-gray-300 font-bold mt-5">Email (cannot be changed)</Text>
            <View className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3">
              <Text className="text-gray-400">{me?.email || "-"}</Text>
            </View>

            {/* Name */}
            <Text className="text-gray-300 font-bold mt-4">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#6B7280"
              className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white"
            />

            {/* Phone */}
            <Text className="text-gray-300 font-bold mt-4">Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="07X XXX XXXX"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white"
            />

            <Pressable
              onPress={saveProfile}
              disabled={savingProfile}
              className="mt-5 bg-yellow-500 py-4 rounded-2xl items-center"
            >
              <Text className="text-gray-900 font-extrabold">
                {savingProfile ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>
          </View>

          {/* Password card */}
          <View className="mx-6 mt-5 bg-gray-800 border border-gray-700 rounded-3xl p-5">
            <Text className="text-white text-xl font-extrabold">Change Password</Text>
            <Text className="text-gray-400 mt-1">For your security, use a strong password.</Text>

            <Text className="text-gray-300 font-bold mt-4">Current password</Text>
            <TextInput
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white"
            />

            <Text className="text-gray-300 font-bold mt-4">New password</Text>
            <TextInput
              value={newPw}
              onChangeText={setNewPw}
              placeholder="At least 6 characters"
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white"
            />

            <Text className="text-gray-300 font-bold mt-4">Confirm new password</Text>
            <TextInput
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Re-type new password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white"
            />

            <Pressable
              onPress={changePassword}
              disabled={savingPassword}
              className="mt-5 bg-gray-900 border border-gray-700 py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-extrabold">
                {savingPassword ? "Updating..." : "Update Password"}
              </Text>
            </Pressable>
          </View>

          {/* About card */}
          <View className="mx-6 mt-5 bg-gray-800 border border-gray-700 rounded-3xl p-5">
            <Text className="text-white text-xl font-extrabold">About PartPal</Text>
            <Text className="text-gray-400 mt-2 leading-5">
              PartPal is a smart spare-parts assistant that helps users identify car parts using AI.
              It supports part detection (YOLO) and verification/risk checking (EfficientNet),
              and provides seller recommendations with price comparison.
            </Text>

            <Text className="text-gray-500 mt-4">
              © {new Date().getFullYear()} PartPal. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}