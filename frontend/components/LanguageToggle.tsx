import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { t } from "@/i18n";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageToggle() {
  const { lang, changeLang } = useLanguage();

  return (
    <View className="flex-row items-center bg-gray-800 rounded-xl p-2">
      <TouchableOpacity
        onPress={() => changeLang("en")}
        className={`px-3 py-2 rounded-lg ${lang === "en" ? "bg-gray-700" : ""}`}
      >
        <Text className="text-white text-sm">{t("lang.english")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => changeLang("si")}
        className={`ml-2 px-3 py-2 rounded-lg ${lang === "si" ? "bg-gray-700" : ""}`}
      >
        <Text className="text-white text-sm">{t("lang.sinhala")}</Text>
      </TouchableOpacity>
    </View>
  );
}