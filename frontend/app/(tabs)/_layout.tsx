import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View } from "react-native";
import BottomTabs from "@/components/BottomTabs";


export default function TabsLayout() {
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const router = useRouter();

const handleTabChange = (tab: string) => {
  setSelectedTab(tab);

  // map tab name to correct route
  const routeMap: Record<string, "/dashboard" | "/search" | "/parts" | "/cart" | "/account"> = {
    Dashboard: "/dashboard",
    Search: "/search",
    Parts: "/parts",
    Cart: "/cart",
    Account: "/account",
  };

  router.push(routeMap[tab]);
};

  // redirect default → Dashboard
  useEffect(() => {
    router.replace("/(tabs)/dashboard");
  }, []);

  return (
    <View className="flex-1">
      {/* Current tab screen */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* Bottom Navigation */}
      <BottomTabs selectedTab={selectedTab} setSelectedTab={handleTabChange} />
    </View>
  );
}
