import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { API_URL } from '@/config/env';
import * as ImagePicker from "expo-image-picker";
import Header from "@/components/HeaderBar";
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {
  MagnifyingGlassIcon,
  QrCodeIcon,
  ClockIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  TruckIcon,
  CurrencyDollarIcon,
  EyeIcon,
  ShoppingCartIcon,
  ChevronRightIcon,
} from "react-native-heroicons/outline";

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          // If no token, redirect to login
          router.replace("/");
          return;
        }

        const response = await axios.get(`${API_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data); // Laravel should return the user object
      } catch (error) {
        if (error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response) {
          // @ts-ignore
          console.log("Fetch user error:", error.response.data);
        } else if (error && typeof error === "object" && "message" in error) {
          // @ts-ignore
          console.log("Fetch user error:", error.message);
        } else {
          console.log("Fetch user error:", error);
        }
        Alert.alert("Error", "Failed to fetch user info. Logging out...");
        // If token invalid, logout
        await AsyncStorage.removeItem("token");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      Alert.alert("Logged Out", "You have been logged out successfully!");
      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Try again.");
    }
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.status !== "granted") {
      Alert.alert("Permission Denied", "You need to allow camera access to use this feature.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      uploadImage(uri);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission Denied", "We need permission to access your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
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

      const formData = new FormData();
      // note key must match backend UploadFile parameter name ("file")
      formData.append("file", {
        uri,
        name: filename,
        type,
      } as any);

      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      if (res.data && res.data.success) {
        setPrediction(res.data.part);
        setConfidence(res.data.confidence);
      } else {
        Alert.alert("No detection", res.data?.message || "No part detected");
      }
    } catch (err: any) {
      console.log("Upload error:", err?.response?.data || err.message || err);
      Alert.alert("Error", "Prediction failed. Check backend logs and that API_URL is correct.");
    } finally {
      setIsUploading(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const dashboardCards = [
    {
      id: 1,
      title: 'Scan Part',
      icon: <QrCodeIcon size={32} color="#F7F4EA" />,
      onPress: openCamera,
    },
    {
      id: 2,
      title: 'Order History',
      icon: <ClockIcon size={32} color="#F75270" />,
      onPress: () => console.log('Order History'),
    },
    {
      id: 3,
      title: 'Browse Catalog',
      icon: <BookOpenIcon size={32} color="green" />,
      onPress: () => console.log('Browse Catalog'),
    },
    {
      id: 4,
      title: 'Messages',
      icon: <ChatBubbleLeftRightIcon size={32} color="orange" />,
      onPress: () => console.log('Messages'),
    },
  ];

  const keyMetrics = [
    {
      id: 1,
      title: 'Pending Orders',
      value: '5',
      icon: <TruckIcon size={24} color="lightblue" />,
    },
    {
      id: 2,
      title: 'Total Spend',
      value: '$1,250',
      icon: <CurrencyDollarIcon size={24} color="green" />,
    },
  ];

  const featuredParts = [
    {
      id: 1,
      title: 'Premium Air Filter',
      price: '$32.99',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    },
    {
      id: 2,
      title: 'Ceramic Brake Pads',
      price: '$89.99',
      image: 'https://www.expresscareautomn.com/images/brake_repair_service2.jpeg',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Searched for \'Oil Filter\'',
      time: 'Today, 10:45 AM',
      icon: <MagnifyingGlassIcon size={20} color="yellow" />,
    },
    {
      id: 2,
      action: 'Ordered 2x Brake Pads',
      time: 'Yesterday, 3:20 PM',
      icon: <ShoppingCartIcon size={20} color="green" />,
    },
    {
      id: 3,
      action: 'Viewed \'Spark Plug Kit\'',
      time: '2 days ago',
      icon: <EyeIcon size={20} color="lightblue" />,
    },
  ];

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      {/* Header */}
      <Header user={user} photo={photo} onLogout={handleLogout} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Dashboard Cards */}
        <View className="px-6 py-6">
          <View className="flex-row flex-wrap justify-between">
            {dashboardCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={card.onPress}
                className="bg-gray-800 rounded-2xl p-6 mb-4 shadow-lg"
                style={{ width: (width - 48 - 12) / 2 }}
              >
                <View className="items-center">
                  <View className="w-16 h-16 bg-gray-700 rounded-2xl items-center justify-center mb-4">
                    {card.icon}
                  </View>
                  <Text className="text-white text-base font-semibold text-center">
                    {card.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
      {/* Buttons */}
      <View className="flex-row justify-center px-6 mb-6">
        <TouchableOpacity onPress={openCamera} className="mr-3 p-4 bg-blue-600 rounded-lg">
          <Text className="text-white text-base font-semibold text-center">Open Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} className="p-4 bg-emerald-500 rounded-lg">
          <Text className="text-white text-base font-semibold text-center">Pick From Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      {photo && (
        <Image
          source={{ uri: photo }}
          resizeMode="cover"
          className="w-[90%] h-56 self-center mt-4 rounded-xl"
        />
      )}
      {/* Uploading */}
      {isUploading && (
        <View className="items-center mt-3">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
      {/* Prediction */}
      {prediction && (
        <View className="p-4 items-center mt-3">
          <Text className="text-white text-lg font-extrabold">{prediction}</Text>
          <Text className="text-gray-400 mt-1">Confidence: {confidence}</Text>
        </View>
      )}

        {/* Key Metrics */}
        <View className="px-6 mb-6">
          <Text className="text-white text-xl font-bold mb-4">Key Metrics</Text>
          <View className="flex-row gap-x-3">
            {keyMetrics.map((metric) => (
              <View
                key={metric.id}
                className="bg-gray-800 rounded-2xl p-6 flex-1"
              >
                <View className="flex-row items-center mb-2">
                  {metric.icon}
                  <Text className="text-gray-300 text-sm ml-2 flex-1">
                    {metric.title}
                  </Text>
                </View>
                <Text className="text-white text-3xl font-bold">
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Featured Parts */}
        <View className="px-6 mb-6">
          <Text className="text-white text-xl font-bold mb-4">Featured Parts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredParts.map((part) => (
              <View key={part.id} className="bg-gray-800 rounded-2xl mr-4 overflow-hidden" style={{ width: 200 }}>
                <Image
                  source={{ uri: part.image }}
                  className="w-full h-32 bg-gray-600"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <Text className="text-white text-base font-semibold mb-2">
                    {part.title}
                  </Text>
                  <Text className="text-blue-400 text-lg font-bold mb-3">
                    {part.price}
                  </Text>
                  <TouchableOpacity className="bg-blue-600 py-2 px-4 rounded-lg">
                    <Text className="text-white text-sm font-semibold text-center">
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-20">
          <Text className="text-white text-xl font-bold mb-4">Recent Activity</Text>
          <View className="bg-gray-800 rounded-2xl overflow-hidden">
            {recentActivity.map((activity, index) => (
              <TouchableOpacity
                key={activity.id}
                className={`flex-row items-center p-4 ${
                  index !== recentActivity.length - 1 ? 'border-b border-gray-700' : ''
                }`}
              >
                <View className="w-10 h-10 bg-gray-700 rounded-full items-center justify-center mr-3">
                  {activity.icon}
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-medium">
                    {activity.action}
                  </Text>
                  <Text className="text-gray-400 text-sm mt-1">
                    {activity.time}
                  </Text>
                </View>
                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});