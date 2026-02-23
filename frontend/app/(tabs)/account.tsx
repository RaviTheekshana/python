import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "@/config/env";
import { useRouter } from "expo-router";
import { ArrowRightOnRectangleIcon } from "react-native-heroicons/outline";

import { t } from "@/i18n";
import { useLanguage } from "@/context/LanguageContext";

type Me = {
  id: number;
  email: string;
  name?: string | null;
  phone?: string | null;
};

export default function Account() {
  const router = useRouter();

  // ✅ Force instant re-render on language change
  const { version } = useLanguage();

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
        Alert.alert(t("account.login_required_title"), t("account.login_required_msg"));
        router.replace("/");
        return;
      }

      const res = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data as Me;
      setMe(data);
      setName(data.name || "");
      setPhone(data.phone || "");
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || e?.message || t("account.load_profile_failed"));
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
      Alert.alert(t("common.saved"), t("account.profile_updated"));
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || e?.message || t("account.update_profile_failed"));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert(t("account.missing_fields_title"), t("account.missing_fields_msg"));
      return;
    }
    if (newPw.length < 6) {
      Alert.alert(t("account.weak_password_title"), t("account.weak_password_msg"));
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert(t("account.mismatch_title"), t("account.mismatch_msg"));
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
      Alert.alert(t("account.password_success_title"), t("account.password_success_msg"));
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || e?.message || t("account.update_password_failed"));
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
            <Text className="text-gray-300 ml-2">{t("common.logout")}</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
          <Text className="text-gray-400 mt-3">{t("account.loading_account")}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Profile card */}
          <View className="mx-6 mt-6 bg-gray-800 border border-gray-700 rounded-3xl p-5">
            <Text className="text-white text-xl font-extrabold">{t("account.settings_title")}</Text>
            <Text className="text-gray-400 mt-1">{t("account.settings_subtitle")}</Text>

            {/* Email readonly */}
            <Text className="text-gray-300 font-bold mt-5">{t("account.email_label")}</Text>
            <View className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3">
              <Text className="text-gray-400">{me?.email || "-"}</Text>
            </View>

            {/* Name */}
            <Text className="text-gray-300 font-bold mt-4">{t("account.name_label")}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("account.name_placeholder")}
              placeholderTextColor="#6B7280"
              className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white"
            />

            {/* Phone */}
            <Text className="text-gray-300 font-bold mt-4">{t("account.phone_label")}</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={t("account.phone_placeholder")}
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
                {savingProfile ? t("common.saving") : t("account.save_changes")}
              </Text>
            </Pressable>
          </View>

          {/* Password card */}
          <View className="mx-6 mt-5 bg-gray-800 border border-gray-700 rounded-3xl p-5">
            <Text className="text-white text-xl font-extrabold">{t("account.change_password_title")}</Text>
            <Text className="text-gray-400 mt-1">{t("account.change_password_subtitle")}</Text>

            <Text className="text-gray-300 font-bold mt-4">{t("account.current_password_label")}</Text>
            <TextInput
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder={t("account.password_mask")}
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white"
            />

            <Text className="text-gray-300 font-bold mt-4">{t("account.new_password_label")}</Text>
            <TextInput
              value={newPw}
              onChangeText={setNewPw}
              placeholder={t("account.new_password_placeholder")}
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="mt-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white"
            />

            <Text className="text-gray-300 font-bold mt-4">{t("account.confirm_password_label")}</Text>
            <TextInput
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder={t("account.confirm_password_placeholder")}
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
                {savingPassword ? t("common.updating") : t("account.update_password")}
              </Text>
            </Pressable>
          </View>

          {/* About card */}
          <View className="mx-6 mt-5 bg-gray-800 border border-gray-700 rounded-3xl p-5">
            <Text className="text-white text-xl font-extrabold">{t("account.about_title")}</Text>
            <Text className="text-gray-400 mt-2 leading-5">
              {t("account.about_body")}
            </Text>

            <Text className="text-gray-500 mt-4">
              © {new Date().getFullYear()} {t("account.rights")}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}