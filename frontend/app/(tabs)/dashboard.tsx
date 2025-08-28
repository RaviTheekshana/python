import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_URL } from '@/config/env';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user info from backend on mount
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to your Dashboard 🎉</Text>
      {user ? (
        <>
          <Text style={styles.userText}>Name: {user.name}</Text>
          <Text style={styles.userText}>Email: {user.email}</Text>
        </>
      ) : (
        <Text>No user data available</Text>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  userText: { fontSize: 16, color: "#333", marginBottom: 4 },
  logoutButton: { backgroundColor: "#ff6b6b", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, marginTop: 30 },
  logoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
  },
});
