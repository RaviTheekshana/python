import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

const bottomTabs = [
  { name: "Dashboard", icon: "🏠" },
  { name: "Search", icon: "🔍" },
  { name: "Parts", icon: "🔧" },
  { name: "Cart", icon: "🛒" },
  { name: "Account", icon: "👤" },
];


export default function BottomTabs({ selectedTab, setSelectedTab }: { 
  selectedTab: string; 
  setSelectedTab: (tab: string) => void; 
}) {
  return (
    <View className="bg-gray-800 px-6 py-3 shadow-2xl">
      <View className="flex-row justify-between items-center">
        {bottomTabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            onPress={() => setSelectedTab(tab.name)}
            className={`flex-1 items-center py-2 ${
              selectedTab === tab.name ? "opacity-100" : "opacity-50"
            }`}
          >
            <Text className="text-2xl mb-1">{tab.icon}</Text>
            <Text
              className={`text-xs ${
                selectedTab === tab.name ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
