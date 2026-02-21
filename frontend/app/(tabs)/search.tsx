import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { API_URL } from "@/config/env";
import {
  CameraIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from "react-native-heroicons/outline";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { TruckIcon } from "react-native-heroicons/outline";

const router = useRouter();

type VerifyResponse = {
  success: boolean;
  yolo?: { label: string; confidence: number; bbox?: number[] };
  effnet?: { label: string; confidence: number; top5?: { label: string; confidence: number }[] };
  risk?: { level: "LOW" | "MEDIUM" | "HIGH" | "UNSURE"; score: number; reason: string };
  message?: string;
};

export default function Search() {
  const params = useLocalSearchParams();
  const initialPhoto = Array.isArray(params.photo) ? params.photo[0] : params.photo;
  const initialPrediction = Array.isArray(params.prediction) ? params.prediction[0] : params.prediction;
  const initialConfidence = Array.isArray(params.confidence) ? params.confidence[0] : params.confidence;

  const [photo, setPhoto] = useState<string | null>(initialPhoto ?? null);
  const [prediction, setPrediction] = useState<string | null>(initialPrediction || null);
  const [confidence, setConfidence] = useState<string | null>(initialConfidence || null);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ Verify state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null);

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      alert("Camera permission is required.");
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
      alert("Gallery permission is required.");
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

      // reset verify state on new scan/upload
      setVerifyData(null);
      setIsVerifying(false);

      const form = buildFormData(uri);

      const r = await axios.post(`${API_URL}/predict`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      if (r.data?.success) {
        setPrediction(r.data.part);
        setConfidence(String(r.data.confidence));
      } else {
        alert(r.data?.message || "No part detected.");
      }
    } catch (e: any) {
      console.log("Upload error:", e?.response?.data || e?.message || e);
      alert("Prediction failed. Check API_URL/back-end.");
    } finally {
      setIsUploading(false);
    }
  };

  const verifyRisk = async () => {
    if (!photo) return;
    try {
      setIsVerifying(true);
      setVerifyData(null);

      const form = buildFormData(photo);

      const r = await axios.post(`${API_URL}/verify`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      const data = r.data as VerifyResponse;

      if (data?.success) {
        setVerifyData(data);
      } else {
        alert(data?.message || "Verification failed.");
        setVerifyData(data);
      }
    } catch (e: any) {
      console.log("Verify error:", e?.response?.data || e?.message || e);
      alert("Risk Check failed. Check API_URL/back-end.");
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

    // Tailwind classes via NativeWind
    const base = "px-3 py-1 rounded-full";
    if (level === "LOW") return <Text className={`${base} bg-green-600 text-white font-bold`}>LOW RISK</Text>;
    if (level === "MEDIUM") return <Text className={`${base} bg-yellow-500 text-black font-bold`}>MEDIUM</Text>;
    if (level === "HIGH") return <Text className={`${base} bg-red-600 text-white font-bold`}>HIGH RISK</Text>;
    return <Text className={`${base} bg-gray-500 text-white font-bold`}>UNSURE</Text>;
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* Top bar */}
      <View className="bg-gray-800 pt-12 px-6 shadow-lg">
        <View className="px-3 pt-4 pb-4 flex-row items-center justify-between">
          <Text className="text-white text-3xl font-extrabold">PartPal</Text>
          <View className="flex-row items-center">
            <ArrowRightOnRectangleIcon size={22} color="#9CA3AF" />
            <Text className="text-gray-300 ml-2">Logout</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Preview card */}
        <View className="mx-6 mt-6 bg-gray-800 rounded-3xl p-6">
          {!photo ? (
            <View className="h-60 rounded-2xl border border-gray-700 border-dashed items-center justify-center">
              <PhotoIcon size={56} color="#9CA3AF" />
              <Text className="text-gray-400 mt-3">Scanned image will appear here</Text>
            </View>
          ) : (
            <Image source={{ uri: photo }} className="h-60 rounded-2xl" resizeMode="cover" />
          )}

          {/* Uploading indicator */}
          {isUploading && (
            <View className="items-center mt-3">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-gray-400 mt-2">Detecting part...</Text>
            </View>
          )}

          {/* YOLO Prediction result */}
          {prediction && !isUploading && (
            <View className="items-center mt-4">
              <Text className="text-white text-lg font-extrabold">{prediction}</Text>
              <Text className="text-gray-400 mt-1">Confidence: {confidence ?? "-"}</Text>

              {/* Verify button */}
              <TouchableOpacity
                onPress={verifyRisk}
                disabled={isVerifying}
                className="mt-4 w-full bg-indigo-600 py-4 rounded-2xl items-center"
              >
                <View className="flex-row items-center">
                  <ShieldCheckIcon size={22} color="#fff" />
                  <Text className="text-white font-semibold text-base ml-2">
                    {isVerifying ? "Verifying..." : "Verify / Risk Check"}
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
                    Find Sellers
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Verify indicator */}
              {isVerifying && (
                <View className="items-center mt-3">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-gray-400 mt-2">Running verification model...</Text>
                </View>
              )}

              {/* Verify result card */}
              {verifyData?.success && (
                <View className="mt-4 w-full bg-gray-900 border border-gray-700 rounded-2xl p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-extrabold text-base">Risk Result</Text>
                    {riskBadge(verifyData.risk?.level)}
                  </View>

                  <View className="mt-3">
                    <Text className="text-gray-300">
                      <Text className="font-bold text-white">EfficientNet:</Text>{" "}
                      {verifyData.effnet?.label} (conf: {verifyData.effnet?.confidence})
                    </Text>

                    <Text className="text-gray-300 mt-2">
                      <Text className="font-bold text-white">Reason:</Text> {verifyData.risk?.reason}
                    </Text>
                  </View>
                </View>
              )}

              {/* Verify failed */}
              {verifyData && !verifyData.success && (
                <View className="mt-4 w-full bg-gray-900 border border-gray-700 rounded-2xl p-4">
                  <Text className="text-red-400 font-bold">Verification failed</Text>
                  <Text className="text-gray-300 mt-2">{verifyData.message || "Try again with a clearer image."}</Text>
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
              <Text className="text-white font-semibold text-base ml-2">Camera</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            className="flex-1 bg-gray-800 py-4 rounded-2xl ml-3 items-center border border-gray-700"
          >
            <View className="flex-row items-center">
              <ArrowUpTrayIcon size={22} color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">Upload</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View className="mx-6 mt-8">
          <Text className="text-white text-xl font-bold mb-4">History of Searches</Text>

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