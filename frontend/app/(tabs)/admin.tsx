import React, { useEffect, useMemo, useState } from "react";
import { Alert, ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "@/config/env";
import { Image } from "expo-image";

type ScanItem = {
  id: number;
  image_url: string;
  yolo_label: string;
  yolo_conf: number;
  risk_level?: string | null;
  verification_status: "pending" | "verified";
  authenticity?: string | null;
  corrected_label?: string | null;
};

export default function AdminScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [status, setStatus] = useState<"pending" | "verified" | "all">("pending");

  const [selected, setSelected] = useState<ScanItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [isLabelCorrect, setIsLabelCorrect] = useState(true);
  const [correctedLabel, setCorrectedLabel] = useState("");
  const [authenticity, setAuthenticity] = useState<"genuine" | "fake" | "low_fake" | "unknown">("unknown");
  const [saving, setSaving] = useState(false);

  const api = useMemo(() => {
    return axios.create({ baseURL: API_URL, timeout: 25000 });
  }, []);

  const authHeaders = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Login required");
    return { Authorization: `Bearer ${token}` };
  };

  const load = async () => {
    try {
      setLoading(true);
      const headers = await authHeaders();
      const res = await api.get(`/admin/scans?status=${status}`, { headers });
      setItems(res.data?.items || []);
    } catch (e: any) {
      Alert.alert("Admin", e?.response?.data?.detail || e?.message || "Failed to load scans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const openItem = async (it: ScanItem) => {
    setSelected(it);
    setIsLabelCorrect(true);
    setCorrectedLabel("");
    setAuthenticity((it.authenticity as any) || "unknown");
    setModalVisible(true);
  };

  const saveVerification = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const headers = await authHeaders();
      await api.post(
        `/admin/scans/${selected.id}/verify`,
        {
          is_label_correct: isLabelCorrect,
          corrected_label: correctedLabel || null,
          authenticity,
        },
        { headers }
      );
      Alert.alert("Saved", "Verification saved.");
      setModalVisible(false);
      setSelected(null);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || e?.message || "Failed to save verification");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator />
        <Text className="text-gray-300 mt-3">Loading scans…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <View className="bg-gray-800 pt-12 px-6 shadow-lg">
        <Text className="text-white text-2xl font-extrabold">Admin Review</Text>
        <Text className="text-gray-300 mt-1">Verify scans: label + authenticity</Text>

        <View className="flex-row mt-4 mb-3">
          {(["pending", "verified", "all"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              className={`px-4 py-2 rounded-full mr-2 ${status === s ? "bg-blue-600" : "bg-white/10"}`}
            >
              <Text className="text-white capitalize">{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Text className="text-gray-400">No scans to review.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openItem(item)}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3"
          >
            <View className="flex-row justify-between">
              <View>
                <Text className="text-white text-lg font-bold">{item.yolo_label}</Text>
                <Text className="text-gray-300">Conf: {item.yolo_conf?.toFixed?.(2) ?? item.yolo_conf}</Text>
                {!!item.risk_level && <Text className="text-gray-400">Risk: {item.risk_level}</Text>}
              </View>
              <View className="items-end">
                <Text className={`text-sm font-semibold ${item.verification_status === "verified" ? "text-green-400" : "text-yellow-400"}`}>
                  {item.verification_status === "verified" ? "Verified" : "Pending"}
                </Text>
                {item.authenticity ? (
                  <Text className="text-gray-300 mt-1">{item.authenticity}</Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-gray-900 rounded-t-3xl p-5 border-t border-white/10">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-xl font-extrabold">Verify Scan</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text className="text-gray-300">Close</Text>
              </Pressable>
            </View>

            {selected ? (
              <>
                <View className="rounded-2xl overflow-hidden border border-white/10 mb-4">
                  <Image
                    source={{ uri: `${API_URL}${selected.image_url}` }}
                    style={{ width: "100%", height: 220 }}
                    contentFit="cover"
                  />
                </View>

                <Text className="text-gray-200">YOLO: {selected.yolo_label} ({selected.yolo_conf?.toFixed?.(2) ?? selected.yolo_conf})</Text>

                <View className="flex-row mt-3">
                  <Pressable
                    onPress={() => setIsLabelCorrect(true)}
                    className={`px-4 py-2 rounded-full mr-2 ${isLabelCorrect ? "bg-green-600" : "bg-white/10"}`}
                  >
                    <Text className="text-white">Label Correct</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setIsLabelCorrect(false)}
                    className={`px-4 py-2 rounded-full ${!isLabelCorrect ? "bg-red-600" : "bg-white/10"}`}
                  >
                    <Text className="text-white">Wrong Label</Text>
                  </Pressable>
                </View>

                {!isLabelCorrect ? (
                  <View className="mt-3">
                    <Text className="text-gray-300 mb-2">Correct label (type)</Text>
                    <TextInput
                      value={correctedLabel}
                      onChangeText={setCorrectedLabel}
                      placeholder="e.g., spark_plug"
                      placeholderTextColor="#6B7280"
                      className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white"
                    />
                  </View>
                ) : null}

                <Text className="text-gray-300 mt-4 mb-2">Authenticity</Text>
                <View className="flex-row flex-wrap">
                  {(["genuine", "fake", "low_fake", "unknown"] as const).map((a) => (
                    <Pressable
                      key={a}
                      onPress={() => setAuthenticity(a)}
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${authenticity === a ? "bg-blue-600" : "bg-white/10"}`}
                    >
                      <Text className="text-white">{a}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  disabled={saving}
                  onPress={saveVerification}
                  className={`mt-4 rounded-2xl py-4 items-center ${saving ? "bg-white/10" : "bg-blue-600"}`}
                >
                  <Text className="text-white font-bold">{saving ? "Saving…" : "Save Verification"}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
