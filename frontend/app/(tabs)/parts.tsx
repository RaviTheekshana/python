import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import axios from "axios";
import { API_URL } from "@/config/env";
import { MagnifyingGlassIcon, MapPinIcon } from "react-native-heroicons/outline";
import { useLocalSearchParams } from "expo-router";

type PartRow = {
  part_name: string;
  best_price_lkr: number | null;
  vendor_count: number;
};

type VendorRow = {
  vendor_id: number;
  vendor: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  price_lkr: number;
  stock_qty: number;
};

const DISTRICTS = ["ALL", "Colombo", "Gampaha", "Kalutara"] as const;

export default function PartsPage() {
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<(typeof DISTRICTS)[number]>("ALL");

  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<PartRow[]>([]);

  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const params = useLocalSearchParams<{ part?: string }>();
  const scannedPart = (params.part || "").toString().trim();
  const listRef = useRef<FlatList<PartRow>>(null);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/parts/search`, { params: { q, limit: 200 }, timeout: 25000 });
      if (!res.data?.success) {
        setParts([]);
        return;
      }
      setParts(res.data.results || []);
    } catch {
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch parts for a specific query (used when a scanned part is provided)
  const fetchPartsWithQuery = async (query: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/parts/search`, { params: { q: query, limit: 200 }, timeout: 25000 });
      if (!res.data?.success) {
        setParts([]);
        return;
      }
      setParts(res.data.results || []);
    } catch {
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorsForPart = async (partName: string) => {
  // ✅ scroll to header so user sees the expanded vendor panel
  listRef.current?.scrollToOffset({ offset: 0, animated: true });

  try {
    setVendorsLoading(true);
    setSelectedPart(partName);

    const res = await axios.get(`${API_URL}/parts/${encodeURIComponent(partName)}/vendors`, {
      params: { limit: 15, in_stock_only: "false" },
      timeout: 25000,
    });

    setVendors(res.data?.success ? res.data.results || [] : []);
  } catch {
    setVendors([]);
  } finally {
    setVendorsLoading(false);
  }
};
  useEffect(() => {
  if (!scannedPart) return;

  setQ(scannedPart);
  // Fetch list filtered by scanned part
  (async () => {
    await fetchPartsWithQuery(scannedPart);   // small change: accept q as arg
    await fetchVendorsForPart(scannedPart);   // auto open vendor list for that part
  })();
}, [scannedPart]);

  useEffect(() => {
    fetchParts();
  }, []);

  // District filter (client-side, based on vendor modal list)
  const visibleParts = useMemo(() => parts, [parts, district]);

  const header = (
    <View className="bg-gray-800 pt-12 px-6 pb-5">
      <Text className="text-white text-3xl font-extrabold">Parts</Text>
      <Text className="text-gray-300 mt-1">Search parts and view vendors (Western Province)</Text>

      <View className="mt-4 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 flex-row items-center">
        <MagnifyingGlassIcon size={18} color="#9CA3AF" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search e.g. BRAKE, ALTERNATOR"
          placeholderTextColor="#6B7280"
          autoCapitalize="characters"
          className="ml-3 flex-1 text-white"
        />
      </View>

      <View className="flex-row flex-wrap mt-3 gap-2">
        {DISTRICTS.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDistrict(d)}
            className={`px-4 py-2 rounded-full ${
              district === d ? "bg-white" : "bg-gray-900 border border-gray-700"
            }`}
          >
            <Text className={`${district === d ? "text-gray-900" : "text-gray-200"} font-bold`}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={fetchParts} className="mt-4 bg-yellow-500 py-4 rounded-2xl items-center">
        <Text className="text-gray-900 font-extrabold">{loading ? "Searching..." : "Search"}</Text>
      </Pressable>

      {selectedPart && (
        <View className="mt-5 bg-gray-900 border border-gray-700 rounded-2xl p-4">
          <Text className="text-white font-extrabold">Vendors for: {selectedPart}</Text>

          {vendorsLoading ? (
            <View className="py-4">
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View className="mt-3 gap-3">
              {vendors.slice(0, 6).map((v) => (
                <View key={v.vendor_id} className="bg-gray-800 border border-gray-700 rounded-2xl p-3">
                  <Text className="text-white font-bold">{v.vendor}</Text>
                  <View className="flex-row items-center mt-1">
                    <MapPinIcon size={16} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-2">
                      {v.city}, {v.district}
                    </Text>
                  </View>
                  <Text className="text-yellow-400 font-extrabold mt-2">
                    LKR {v.price_lkr.toLocaleString()}
                  </Text>
                  <Text className="text-gray-300">Stock: {v.stock_qty}</Text>
                </View>
              ))}
              {vendors.length === 0 ? <Text className="text-gray-400">No vendors found.</Text> : null}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderItem = ({ item }: { item: PartRow }) => (
    <Pressable
      onPress={() => fetchVendorsForPart(item.part_name)}
      className="mx-6 mt-4 bg-gray-800 border border-gray-700 rounded-3xl p-5"
    >
      <Text className="text-white font-extrabold text-lg">{item.part_name}</Text>
      <Text className="text-gray-300 mt-2">
        Best price: {item.best_price_lkr ? `LKR ${item.best_price_lkr.toLocaleString()}` : "N/A"}
      </Text>
      <Text className="text-gray-400 mt-1">Vendors: {item.vendor_count}</Text>
      <Text className="text-white font-bold mt-3">Tap to view sellers</Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-900">
      <FlatList
        ref={listRef}
        data={visibleParts}
        keyExtractor={(x) => x.part_name}
        ListHeaderComponent={header}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <View className="p-6">
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View className="p-6">
              <Text className="text-gray-400">No parts found.</Text>
            </View>
          )
        }
      />
    </View>
  );
}