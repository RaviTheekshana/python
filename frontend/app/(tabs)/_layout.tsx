import { Slot, Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View } from "react-native";
import BottomTabs from "@/components/BottomTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function TabsLayout() {
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

const handleTabChange = (tab: string) => {
  setSelectedTab(tab);

  const routeMap: Record<string, "/dashboard" | "/search" | "/parts" | "/vendor" | "/account" | "/admin"> = {
    Dashboard: "/dashboard",
    Search: "/search",
    Parts: "/parts",
    Vendor: "/vendor",
    Admin: "/admin",
    Account: "/account",
  };

  router.push(routeMap[tab]);
};

  // redirect default → Dashboard
  useEffect(() => {
    router.replace("/(tabs)/dashboard");
  }, []);

  // Determine role (admin gets Admin tab)
  useEffect(() => {
    (async () => {
      const role = await AsyncStorage.getItem("role");
      setIsAdmin(role === "admin" || role === "vendor_admin");
    })();
  }, []);

  return (
    <View className="flex-1">
      {/* Current tab screen */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* Bottom Navigation */}
      <BottomTabs selectedTab={selectedTab} setSelectedTab={handleTabChange} isAdmin={isAdmin} />
    </View>
  );
}
