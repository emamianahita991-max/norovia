import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4a7c7e",
        tabBarInactiveTintColor: "#aaa",
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "#f8f8f8",
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: "Track",
          tabBarIcon: ({ color }) => (
            <Feather name="edit-3" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: "Sleep",
          tabBarIcon: ({ color }) => (
            <Feather name="moon" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="flare"
        options={{
          title: "Flare Mode",
          tabBarIcon: ({ color }) => (
            <Feather name="activity" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: "Trends",
          tabBarIcon: ({ color }) => (
            <Feather name="trending-up" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
