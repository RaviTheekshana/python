import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { API_URL } from "@/config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CameraIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "react-native-heroicons/outline";
import { useLocalSearchParams, useRouter } from "expo-router";

import { t } from "@/i18n";
import { useLanguage } from "@/context/LanguageContext";

type VerifyResponse = {
  success: boolean;
  scan_id?: number;

  yolo?: { label: string; confidence: number; bbox?: number[] };
  effnet?: { label: string; confidence: number; top5?: { label: string; confidence: number }[] };
  risk?: { level: "LOW" | "MEDIUM" | "HIGH" | "UNSURE"; score: number; reason: string };

  match?: {
    found: boolean;
    distance?: number;
    verified_status?: string | null;
    verified_by?: string | null;
    verified_at?: string | null;
    verified_note?: string | null;
    matched_scan_id?: number;
  };

  message?: string;
};

export default function Search() {
  const router = useRouter();
  const { version } = useLanguage();

  const params = useLocalSearchParams();
  const initialPhoto = Array.isArray(params.photo) ? params.photo[0] : params.photo;
  const initialPrediction = Array.isArray(params.prediction) ? params.prediction[0] : params.prediction;
  const initialConfidence = Array.isArray(params.confidence) ? params.confidence[0] : params.confidence;
  const initialVerification = Array.isArray(params.verification_status) ? params.verification_status[0] : params.verification_status;
  const initialAuthenticity = Array.isArray(params.authenticity) ? params.authenticity[0] : params.authenticity;

  const [photo, setPhoto] = useState<string | null>(initialPhoto ?? null);
  const [prediction, setPrediction] = useState<string | null>(initialPrediction || null);
  const [confidence, setConfidence] = useState<string | null>(initialConfidence || null);
  const [isUploading, setIsUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(initialVerification || null);
  const [authenticity, setAuthenticity] = useState<string | null>(initialAuthenticity || null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null);

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      alert(t("search.alert_camera_permission"));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      aspect: [4, 3],
    });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setPhoto(uri);
      await uploadImage(uri);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      alert(t("search.alert_gallery_permission"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setPhoto(uri);
      await uploadImage(uri);
    }
  };

  const buildFormData = (uri: string) => {
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match?.[1]?.toLowerCase();
    const type = ext ? `image/${ext === "jpg" ? "jpeg" : ext}` : "image/jpeg";

    const form = new FormData();
    form.append("file", { uri, name: filename, type } as any);
    return form;
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);
      setPrediction(null);
      setConfidence(null);
      setVerificationStatus(null);
      setAuthenticity(null);
      setVerifyData(null);
      setIsVerifying(false);

      const form = buildFormData(uri);
      const token = await AsyncStorage.getItem("token");

      const r = await axios.post(`${API_URL}/scan`, form, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 60000,
      });

      if (r.data?.success) {
        const scan = r.data?.scan;
        setPrediction(scan?.yolo_label || "");
        setConfidence(String(scan?.yolo_conf ?? ""));
        setVerificationStatus(scan?.verification_status || "pending");
        setAuthenticity(scan?.authenticity || null);
      } else {
        alert(r.data?.message || t("search.alert_no_part"));
      }
    } catch (e: any) {
      console.log("Upload error:", e?.response?.data || e?.message || e);
      alert(t("search.alert_prediction_failed"));
    } finally {
      setIsUploading(false);
    }
  };

    const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("role");
    router.replace("/");
  };

  const verifyRisk = async () => {
  if (!photo) return;

  try {
    setIsVerifying(true);
    setVerifyData(null);

    const token = await AsyncStorage.getItem("token");
    const form = buildFormData(photo);

    const r = await axios.post(`${API_URL}/verify`, form, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 60000,
    });

    const data = r.data as VerifyResponse;
    setVerifyData(data);

    const scan = (data as any)?.scan;
    if (scan?.verification_status) setVerificationStatus(scan.verification_status);
    if (scan?.authenticity) setAuthenticity(scan.authenticity);
  } catch (e: any) {
    console.log("Verify error:", e?.response?.data || e?.message || e);
    alert(t("search.alert_risk_failed"));
  } finally {
    setIsVerifying(false);
  }
};

  const history = [
    {
      id: "1",
      title: "Brake Pad - Model X",
      when: "Scanned: 2 days ago",
      img: "https://www.boschautoparts.com/documents/647135/656978/BlueDiscPads_PDP_Carousel.jpg",
    },
    {
      id: "2",
      title: "Air Filter - Civic ’19",
      when: "Scanned: 5 days ago",
      img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    },
    {
      id: "3",
      title: "Spark Plug – NGK BKR6E",
      when: "Scanned: 1 week ago",
      img: "https://cdn.shopify.com/s/files/1/0724/1387/2423/files/BlueOceanConsulting-322164-two-spark-plugs-blogbanner1.jpg?v=1725638432",
    },
  ];

  const riskBadge = (level?: string) => {
    if (!level) return null;
    const base = "px-3 py-1 rounded-full";
    if (level === "LOW") return <Text className={`${base} bg-green-600 text-white font-bold`}>{t("risk.low")}</Text>;
    if (level === "MEDIUM") return <Text className={`${base} bg-yellow-500 text-black font-bold`}>{t("risk.medium")}</Text>;
    if (level === "HIGH") return <Text className={`${base} bg-red-600 text-white font-bold`}>{t("risk.high")}</Text>;
    return <Text className={`${base} bg-gray-500 text-white font-bold`}>{t("risk.unsure")}</Text>;
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* Top bar */}
      <View className="bg-gray-800 pt-12 px-6 shadow-lg">
        <View className="px-3 pt-4 pb-4 flex-row items-center justify-between">
          <Text className="text-white text-3xl font-extrabold">PartPal</Text>
          <Pressable onPress={logout} className="flex-row items-center">
              <ArrowRightOnRectangleIcon size={22} color="#9CA3AF" />
              <Text className="text-gray-300 ml-2">{t("common.logout")}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Preview card */}
        <View className="mx-6 mt-6 bg-gray-800 rounded-3xl p-6">
          {!photo ? (
            <View className="h-60 rounded-2xl border border-gray-700 border-dashed items-center justify-center">
              <PhotoIcon size={56} color="#9CA3AF" />
              <Text className="text-gray-400 mt-3">{t("search.preview_placeholder")}</Text>
            </View>
          ) : (
            <Image source={{ uri: photo }} className="h-60 rounded-2xl" resizeMode="cover" />
          )}

          {/* Uploading indicator */}
          {isUploading && (
            <View className="items-center mt-3">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-gray-400 mt-2">{t("search.detecting_part")}</Text>
            </View>
          )}

          {/* YOLO Prediction result */}
          {prediction && !isUploading && (
            <View className="items-center mt-4">
              <Text className="text-white text-lg font-extrabold">{prediction}</Text>
              <Text className="text-gray-400 mt-1">
                {t("search.confidence")}: {confidence ?? "-"}
              </Text>

              {/* Verification status from CMS */}
              {!!verificationStatus && (
                <View className="mt-2 px-3 py-1 rounded-full bg-white/10">
                  <Text className="text-gray-200">
                    {t("search.status")}:{" "}
                    {verificationStatus === "verified" ? t("status.verified") : t("status.pending")}
                    {authenticity ? ` • ${authenticity}` : ""}
                  </Text>
                </View>
              )}

              {/* Verify button */}
              <TouchableOpacity
                onPress={verifyRisk}
                disabled={isVerifying}
                className="mt-4 w-full bg-indigo-600 py-4 rounded-2xl items-center"
              >
                <View className="flex-row items-center">
                  <ShieldCheckIcon size={22} color="#fff" />
                  <Text className="text-white font-semibold text-base ml-2">
                    {isVerifying ? t("search.verifying") : t("search.verify_risk")}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Find Sellers button */}
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(tabs)/parts", params: { part: prediction! } })}
                className="mt-3 w-full bg-yellow-500 py-4 rounded-2xl items-center"
              >
                <View className="flex-row items-center">
                  <TruckIcon size={22} color="#111827" />
                  <Text className="text-gray-900 font-extrabold text-base ml-2">
                    {t("search.find_sellers")}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Verify indicator */}
              {isVerifying && (
                <View className="items-center mt-3">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-gray-400 mt-2">{t("search.running_verification")}</Text>
                </View>
              )}

              {/* Verify result card */}
              {verifyData?.success && (
                <View className="mt-4 w-full bg-gray-900 border border-gray-700 rounded-2xl p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-extrabold text-base">{t("search.risk_result")}</Text>
                    {riskBadge((verifyData as any)?.scan?.risk?.level || verifyData.risk?.level)}
                  </View>

                  <View className="mt-3">
                    <Text className="text-gray-300">
                      <Text className="font-bold text-white">{t("search.efficientnet")}:</Text>{" "}
                      {((verifyData as any)?.scan?.effnet?.label || verifyData.effnet?.label)}{" "}
                      ({t("search.conf_short")}: {((verifyData as any)?.scan?.effnet?.confidence || verifyData.effnet?.confidence)})
                    </Text>

                    <Text className="text-gray-300 mt-2">
                      <Text className="font-bold text-white">{t("search.reason")}:</Text>{" "}
                      {((verifyData as any)?.scan?.risk?.reason || verifyData.risk?.reason)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Verify failed */}
              {verifyData && !verifyData.success && (
                <View className="mt-4 w-full bg-gray-900 border border-gray-700 rounded-2xl p-4">
                  <Text className="text-red-400 font-bold">{t("search.verification_failed")}</Text>
                  <Text className="text-gray-300 mt-2">
                    {verifyData.message || t("search.try_clearer")}
                  </Text>
                </View>
              )}
              {verifyData && (
  <View className="mt-4 w-full bg-gray-900 border border-gray-700 rounded-2xl p-4">
    <Text className="text-white font-extrabold text-base">Similarity Match</Text>

    {verifyData.match?.found ? (
      <View className="mt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-200">✅ Similar scan found</Text>
          <View className="px-3 py-1 rounded-full bg-white/10">
            <Text className="text-gray-200">dist: {verifyData.match.distance ?? "-"}</Text>
          </View>
        </View>

        <View className="mt-3 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
          <Text className="text-gray-300">
            <Text className="text-white font-bold">Status:</Text>{" "}
            {verifyData.match.verified_status ? (
              <Text className="text-white font-extrabold">{verifyData.match.verified_status}</Text>
            ) : (
              <Text className="text-yellow-300 font-bold">NOT VERIFIED</Text>
            )}
          </Text>

          {!!verifyData.match.verified_by && (
            <Text className="text-gray-400 mt-1">
              Verified by: {verifyData.match.verified_by}
            </Text>
          )}

          {!!verifyData.match.verified_at && (
            <Text className="text-gray-400 mt-1">
              Verified at: {verifyData.match.verified_at}
            </Text>
          )}

          {!!verifyData.match.verified_note && (
            <Text className="text-gray-300 mt-2">
              Note: {verifyData.match.verified_note}
            </Text>
          )}
        </View>
      </View>
    ) : (
      <View className="mt-3">
        <Text className="text-gray-300">
          No similar scan found yet. This scan will be available for admin review.
        </Text>
      </View>
    )}
  </View>
)}
            </View>
          )}
        </View>

        {/* Buttons */}
        <View className="flex-row justify-between mx-6 mt-6">
          <TouchableOpacity onPress={openCamera} className="flex-1 bg-blue-600 py-4 rounded-2xl mr-3 items-center">
            <View className="flex-row items-center">
              <CameraIcon size={22} color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">{t("search.camera")}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            className="flex-1 bg-gray-800 py-4 rounded-2xl ml-3 items-center border border-gray-700"
          >
            <View className="flex-row items-center">
              <ArrowUpTrayIcon size={22} color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">{t("search.upload")}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View className="mx-6 mt-8">
          <Text className="text-white text-xl font-bold mb-4">{t("search.history_title")}</Text>

          {history.map((h) => (
            <View key={h.id} className="bg-gray-800 rounded-2xl p-4 mb-4 flex-row items-center">
              <Image source={{ uri: h.img }} className="w-16 h-16 rounded-xl bg-gray-700" />
              <View className="ml-4 flex-1">
                <Text className="text-white text-base font-semibold">{h.title}</Text>
                <Text className="text-gray-400 mt-1">{h.when}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}