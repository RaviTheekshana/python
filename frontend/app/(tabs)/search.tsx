import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { API_URL } from "@/config/env";
import {
  CameraIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon,
} from "react-native-heroicons/outline";
import { useLocalSearchParams } from "expo-router";

export default function Search() {
  const params = useLocalSearchParams();
  const initialPhoto = Array.isArray(params.photo) ? params.photo[0] : params.photo;
  const initialPrediction = Array.isArray(params.prediction) ? params.prediction[0] : params.prediction;
  const initialConfidence = Array.isArray(params.confidence) ? params.confidence[0] : params.confidence;
  const [photo, setPhoto] = useState<string | null>(initialPhoto ?? null);
  const [prediction, setPrediction] = useState<string | null>(initialPrediction || null);
  const [confidence, setConfidence] = useState<string | null>(initialConfidence || null);
  const [isUploading, setIsUploading] = useState(false);

  

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
      uploadImage(uri);
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
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);
      setPrediction(null);
      setConfidence(null);

      const filename = uri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      const form = new FormData();
      form.append("file", { uri, name: filename, type } as any);

      const r = await axios.post(`${API_URL}/predict`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      if (r.data?.success) {
        setPrediction(r.data.part);
        setConfidence(r.data.confidence);
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

  return (
    <View className="flex-1 bg-gray-900">
      {/* Top bar (Hi, Alex + Logout) */}
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
              <Text className="text-gray-400 mt-3">
                Scanned image will appear here
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: photo }}
              className="h-60 rounded-2xl"
              resizeMode="cover"
            />
          )}

          {/* Uploading indicator */}
          {isUploading && (
            <View className="items-center mt-3">
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}

          {/* Prediction result */}
          {prediction && (
            <View className="items-center mt-3">
              <Text className="text-white text-lg font-extrabold">
                {prediction}
              </Text>
              <Text className="text-gray-400 mt-1">
                Confidence: {confidence ?? "-"}
              </Text>
            </View>
          )}
        </View>

        {/* Buttons like in Dashboard */}
        <View className="flex-row justify-between mx-6 mt-6">
          <TouchableOpacity
            onPress={openCamera}
            className="flex-1 bg-blue-600 py-4 rounded-2xl mr-3 items-center"
          >
            <View className="flex-row items-center">
              <CameraIcon size={22} color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">
                Camera
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            className="flex-1 bg-gray-800 py-4 rounded-2xl ml-3 items-center border border-gray-700"
          >
            <View className="flex-row items-center">
              <ArrowUpTrayIcon size={22} color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">
                Upload
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* History of Searches */}
        <View className="mx-6 mt-8">
          <Text className="text-white text-xl font-bold mb-4">
            History of Searches
          </Text>

          {history.map((h) => (
            <View
              key={h.id}
              className="bg-gray-800 rounded-2xl p-4 mb-4 flex-row items-center"
            >
              <Image
                source={{ uri: h.img }}
                className="w-16 h-16 rounded-xl bg-gray-700"
              />
              <View className="ml-4 flex-1">
                <Text className="text-white text-base font-semibold">
                  {h.title}
                </Text>
                <Text className="text-gray-400 mt-1">{h.when}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
