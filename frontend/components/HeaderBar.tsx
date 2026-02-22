import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Bars3Icon, ArrowLeftEndOnRectangleIcon } from "react-native-heroicons/outline";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";
import { loadLanguage, t } from "@/i18n";

type HeaderProps = {
  user: { name: string; email?: string } | null;
  photo?: string | null;
  onLogout: () => void;
};

export default function Header({ user, photo, onLogout }: HeaderProps) {
  const { version } = useLanguage();
  return (
    <View className="bg-gray-800 pt-12 pb-6 px-6 shadow-lg">
      {/* Top Row */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">PartPal</Text>
          <LanguageToggle />
      </View>

      {/* User Welcome Row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">
            {t("header.hello", { name: user?.name || "User" })}
          </Text>
          <Text className="text-gray-300 text-base mt-1">
            {t("header.subtitle")}
          </Text>
        </View>
        <View className="flex-row items-center space-x-3">
          <View className="w-12 h-12 bg-gray-600 rounded-full items-center justify-center mr-2">
            {photo ? (
              <Image
                source={{ uri: photo }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <Text className="text-white text-lg font-semibold">
                {user?.name?.charAt(0) || "U"}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onLogout}>
            <ArrowLeftEndOnRectangleIcon size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
