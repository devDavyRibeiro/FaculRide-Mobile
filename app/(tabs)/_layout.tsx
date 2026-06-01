import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { API_URL } from "../../src/constants/api";

export default function TabsLayout() {
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  async function carregarNotificacoes() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setNotificacoesNaoLidas(0);
        return;
      }

      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();

      const naoLidas = Array.isArray(data)
        ? data.filter((n) => !n.isRead).length
        : 0;

      setNotificacoesNaoLidas(naoLidas);
    } catch {
      setNotificacoesNaoLidas(0);
    }
  }

  useEffect(() => {
    carregarNotificacoes();

    const interval = setInterval(() => {
      carregarNotificacoes();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0B1B35",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sua-carona"
        options={{
          title: "Sua Carona",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="encontre"
        options={{
          title: "Encontre",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="contato"
        options={{
          title: "Contato",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={size}
                color={color}
              />

              {notificacoesNaoLidas > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -10,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: "#DC2626",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="atividades"
        options={{
          title: "Atividades",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="conta"
        options={{
          title: "Conta",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}