import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { API_URL } from "@/config/env";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { PhoneIcon, MapPinIcon, TruckIcon } from "react-native-heroicons/outline";

type VendorRow = {
  vendor_id: number;
  vendor: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  price_lkr: number;
  stock_qty: number;
  distance_km?: number;
};

export default function VendorsPage() {
  const params = useLocalSearchParams<{ part?: string }>();
  const initialPart = (params.part || "").toString().trim();

  const [partsList, setPartsList] = useState<string[]>([]);
  const [part, setPart] = useState<string>(initialPart || "");
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(false);

  // GPS
  const [useGps, setUseGps] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [inStockOnly, setInStockOnly] = useState(false);

  const fetchGps = async () => {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCoords(null);
        setUseGps(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setCoords(null);
      setUseGps(false);
    } finally {
      setGpsLoading(false);
    }
  };

  const fetchPartsDropdown = async () => {
    try {
      // load ALL parts for dropdown
      const res = await axios.get(`${API_URL}/parts/search`, { params: { q: "", limit: 200 }, timeout: 25000 });
      if (!res.data?.success) return;

      const names = (res.data.results || []).map((x: any) => x.part_name).filter(Boolean);
      setPartsList(names);

      // If we opened without a part param, default to first
      if (!part && names.length) setPart(names[0]);
    } catch {
      // ignore
    }
  };

  const fetchVendors = async () => {
    if (!part) {
      Alert.alert("Select a part", "Choose a part from dropdown first.");
      return;
    }
    try {
      setLoading(true);
      const query: any = {
        part,
        limit: 15,
        in_stock_only: inStockOnly ? "true" : "false",
      };
      if (useGps && coords) {
        query.lat = coords.lat;
        query.lng = coords.lng;
      }

      const res = await axios.get(`${API_URL}/vendors/recommendations`, { params: query, timeout: 25000 });
      if (!res.data?.success) {
        setVendors([]);
        Alert.alert("No sellers", res.data?.message || "No sellers found.");
        return;
      }
      setVendors(res.data.results || []);
    } catch (e: any) {
      Alert.alert("API Error", e?.message || "Failed to load sellers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartsDropdown();
    fetchGps();
  }, []);

  // Auto-load vendors if opened from scan
  useEffect(() => {
    if (initialPart) {
      setPart(initialPart);
      setTimeout(fetchVendors, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPart]);

  const header = useMemo(() => {
    return (
      <View className="px-6 pt-12 pb-4 bg-gray-800">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-3xl font-extrabold">Vendors</Text>
          <View className="flex-row items-center">
            <TruckIcon size={22} color="#9CA3AF" />
            <Text className="text-gray-300 ml-2">Western Province</Text>
          </View>
        </View>

        <View className="mt-5 bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
          <Picker
            selectedValue={part}
            onValueChange={(v) => setPart(String(v))}
            dropdownIconColor="#9CA3AF"
            style={{ color: "white" }}
          >
            {partsList.map((p) => (
              <Picker.Item key={p} label={p} value={p} />
            ))}
          </Picker>
        </View>

        <View className="flex-row mt-3 gap-3">
          <Pressable
            onPress={() => setInStockOnly((x) => !x)}
            className={`px-4 py-3 rounded-2xl ${inStockOnly ? "bg-white" : "bg-gray-900 border border-gray-700"}`}
          >
            <Text className={`${inStockOnly ? "text-gray-900" : "text-gray-200"} font-bold`}>
              In-stock: {inStockOnly ? "ON" : "OFF"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              const next = !useGps;
              setUseGps(next);
              if (next && !coords) fetchGps();
            }}
            className={`px-4 py-3 rounded-2xl ${useGps ? "bg-white" : "bg-gray-900 border border-gray-700"}`}
          >
            <Text className={`${useGps ? "text-gray-900" : "text-gray-200"} font-bold`}>
              GPS: {useGps ? "ON" : "OFF"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={fetchVendors}
          className="mt-4 bg-yellow-500 py-4 rounded-2xl items-center"
        >
          <Text className="text-gray-900 font-extrabold">{loading ? "Loading..." : "Find Sellers"}</Text>
        </Pressable>

        {gpsLoading ? <Text className="text-gray-400 mt-2">Getting your location…</Text> : null}
      </View>
    );
  }, [part, partsList, inStockOnly, useGps, loading, gpsLoading]);

  const renderItem = ({ item }: { item: VendorRow }) => (
    <View className="mx-6 mt-4 bg-gray-800 rounded-3xl p-5 border border-gray-700">
      <Text className="text-white font-extrabold text-lg">{item.vendor}</Text>

      <View className="mt-2">
        <View className="flex-row items-center">
          <MapPinIcon size={18} color="#9CA3AF" />
          <Text className="text-gray-300 ml-2">
            {item.city}, {item.district}
            {typeof item.distance_km === "number" ? ` • ${item.distance_km} km` : ""}
          </Text>
        </View>

        <Text className="text-yellow-400 font-extrabold mt-3 text-base">
          LKR {item.price_lkr.toLocaleString()}
        </Text>
        <Text className="text-gray-300 mt-1">Stock: {item.stock_qty}</Text>
      </View>

      {!!item.phone && (
        <Pressable
          onPress={() => Linking.openURL(`tel:${item.phone}`)}
          className="mt-4 bg-gray-900 border border-gray-700 py-3 rounded-2xl flex-row items-center justify-center"
        >
          <PhoneIcon size={18} color="#fff" />
          <Text className="text-white font-bold ml-2">Call Vendor</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-900">
      <FlatList
        data={vendors}
        keyExtractor={(x) => String(x.vendor_id)}
        ListHeaderComponent={header}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <View className="p-6">
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View className="p-6">
              <Text className="text-gray-400">No sellers yet. Select a part and tap “Find Sellers”.</Text>
            </View>
          )
        }
      />
    </View>
  );
}