import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UsuarioLogado = {
  id?: number;
  idUsuario?: number;
  nome?: string;
  email?: string;
  genero?: boolean | null;
  foto?: string | null;
  fotoUrl?: string | null;
};

export default function ContaScreen() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

  const carregarUsuario = useCallback(async () => {
    try {
      const usuarioSalvo1 = await AsyncStorage.getItem("usuarioLogado");
      const usuarioSalvo2 = await AsyncStorage.getItem("usuario");
      const usuarioString = usuarioSalvo1 || usuarioSalvo2;

      if (usuarioString) {
        setUsuario(JSON.parse(usuarioString));
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarUsuario();
    }, [carregarUsuario])
  );

  const obterFotoUsuario = () => {
    if (usuario?.foto || usuario?.fotoUrl) {
      return { uri: usuario.foto || usuario.fotoUrl || "" };
    }

    if (usuario?.genero === true) {
      return require("../../assets/images/profile_man.jpeg");
    }

    if (usuario?.genero === false) {
      return require("../../assets/images/profile_woman.jpeg");
    }

    return require("../../assets/images/usuario.png");
  };

  const sair = async () => {
    Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("usuario");
          await AsyncStorage.removeItem("usuarioLogado");
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={obterFotoUsuario()} style={styles.avatar} />
            <View style={styles.userTextBox}>
              <Text style={styles.nome}>{usuario?.nome || "Usuário"}</Text>
              <Text style={styles.email}>{usuario?.email || "Sem e-mail"}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>Conta</Text>
        <Text style={styles.subtitle}>
          Gerencie seus dados e atalhos da sua conta.
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/ajuda")}
        >
          <Text style={styles.cardTitle}>Ajuda</Text>
          <Text style={styles.cardDescription}>
            Acesse a central de ajuda do aplicativo.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/gerenciar-conta")}
        >
          <Text style={styles.cardTitle}>Gerenciar Conta</Text>
          <Text style={styles.cardDescription}>
            Atualize seus dados pessoais, foto e veículo.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={sair}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userTextBox: {
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  nome: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: "#6B7280",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#5B6470",
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: "#0B1B35",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});