import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./en.json";
import si from "./si.json";

const i18n = new I18n({ en, si });

i18n.enableFallback = true;

const loc = Localization.getLocales()?.[0]?.languageCode || "en";
i18n.locale = loc.startsWith("si") ? "si" : "en";

const LANG_KEY = "app_language";

export async function loadLanguage() {
  const saved = await AsyncStorage.getItem(LANG_KEY);
  if (saved === "en" || saved === "si") {
    i18n.locale = saved;
  }
  return i18n.locale;
}

export async function setLanguage(lang: "en" | "si") {
  i18n.locale = lang;
  await AsyncStorage.setItem(LANG_KEY, lang);
}

export function t(key: string, options?: any) {
  return i18n.t(key, options);
}

export function getLanguage(): "en" | "si" {
  return (i18n.locale?.startsWith("si") ? "si" : "en") as "en" | "si";
}