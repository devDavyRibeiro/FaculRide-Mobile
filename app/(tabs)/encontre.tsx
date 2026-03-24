import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Usuario = {
  id?: number;
  idUsuario?: number;
  nome?: string;
  email?: string;
  telefone?: string;
  genero?: boolean | null;
  foto?: string | null;
  fotoUrl?: string | null;
  tipoUsuario?: string;
  tipo_usuario?: string;
};

type Viagem = {
  idViagem?: number;
  id?: number;
  idUsuario?: number;
  partida?: string;
  destino?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  ajudaDeCusto?: string | number;
  datasRota?: string[];
  datasAgendadas?: string[];
  diasAgendados?: string[];
  usuario?: Usuario;
  tipoUsuario?: string;
};

const baseURL =
  typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "https://projeto-faculride.onrender.com/api";

export default function CaronasScreen() {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [resViagens, resUsuarios] = await Promise.all([
        fetch(`${baseURL}/viagem`, { headers }),
        fetch(`${baseURL}/usuario`, { headers }),
      ]);

      if (!resViagens.ok) {
        throw new Error("Erro ao carregar viagens");
      }

      if (!resUsuarios.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const viagensJson = await resViagens.json();
      const usuariosJson = await resUsuarios.json();

      setViagens(Array.isArray(viagensJson) ? viagensJson : []);
      setUsuarios(Array.isArray(usuariosJson) ? usuariosJson : []);
    } catch (error) {
      console.error("Erro ao carregar caronas:", error);
      Alert.alert("Erro", "Não foi possível carregar as caronas disponíveis.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarDados();
  }, [carregarDados]);

  const tipoNormalizado = useCallback(
    (v: Viagem): "motorista" | "passageiro" => {
      const fromViagem = (v?.usuario?.tipoUsuario ?? v?.tipoUsuario ?? "")
        .toString()
        .trim()
        .toLowerCase();

      if (fromViagem === "motorista" || fromViagem === "passageiro") {
        return fromViagem;
      }

      const uid = Number(v?.idUsuario);
      const u = usuarios.find(
        (x) => Number(x?.idUsuario ?? x?.id) === uid
      );

      const fromUsuario = (u?.tipoUsuario ?? u?.tipo_usuario ?? "")
        .toString()
        .trim()
        .toLowerCase();

      return fromUsuario === "motorista" ? "motorista" : "passageiro";
    },
    [usuarios]
  );

  const pegarNomeUsuario = useCallback(
    (viagem: Viagem) => {
      if (viagem?.usuario?.nome) return viagem.usuario.nome;

      const uid = Number(viagem?.idUsuario);
      const usuario = usuarios.find(
        (u) => Number(u?.idUsuario ?? u?.id) === uid
      );

      return usuario?.nome || "Usuário";
    },
    [usuarios]
  );

  const pegarTelefoneUsuario = useCallback(
    (viagem: Viagem) => {
      if (viagem?.usuario?.telefone) return viagem.usuario.telefone;

      const uid = Number(viagem?.idUsuario);
      const usuario = usuarios.find(
        (u) => Number(u?.idUsuario ?? u?.id) === uid
      );

      return usuario?.telefone || "";
    },
    [usuarios]
  );

  const formatarDatas = useCallback((viagem: Viagem) => {
    const datas =
      viagem?.diasAgendados ||
      viagem?.datasAgendadas ||
      viagem?.datasRota ||
      [];

    if (!Array.isArray(datas) || datas.length === 0) return "";

    return datas
      .map((d) => {
        if (typeof d !== "string" || d.length < 10) return d;
        const [ano, mes, dia] = d.slice(0, 10).split("-");
        return `${dia}/${mes}`;
      })
      .join(", ");
  }, []);

  const abrirWhatsapp = useCallback((viagem: Viagem) => {
    const telefone = pegarTelefoneUsuario(viagem);

    if (!telefone) {
      Alert.alert("Aviso", "Número de WhatsApp não disponível.");
      return;
    }

    const nome = pegarNomeUsuario(viagem);
    const numeroLimpo = telefone.replace(/\D/g, "");
    const mensagem = encodeURIComponent(
      `Olá, ${nome}! Vi sua carona no FaculRide.`
    );

    const url = `https://wa.me/${numeroLimpo}?text=${mensagem}`;

    import("react-native").then(({ Linking }) => {
      Linking.openURL(url).catch(() => {
        Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
      });
    });
  }, [pegarNomeUsuario, pegarTelefoneUsuario]);

  const caronasDisponiveis = useMemo(() => {
    return viagens.filter((v) => !!v.partida && !!v.destino);
  }, [viagens]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B1B35" />
        <Text style={styles.loadingText}>Carregando caronas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caronas Disponíveis</Text>
      <Text style={styles.subtitle}>
        Encontre motoristas e passageiros cadastrados na plataforma.
      </Text>

      <FlatList
        data={caronasDisponiveis}
        keyExtractor={(item, index) =>
          String(item.idViagem ?? item.id ?? index)
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Nenhuma carona disponível no momento.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const nome = pegarNomeUsuario(item);
          const tipo = tipoNormalizado(item);
          const datas = formatarDatas(item);

          return (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {nome.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.name}>{nome}</Text>
                <Text style={styles.role}>
                  {tipo === "motorista" ? "Motorista" : "Passageiro"}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Partida:</Text> {item.partida}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Destino:</Text> {item.destino}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Entrada:</Text>{" "}
                  {item.horarioEntrada || "-"}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Saída:</Text>{" "}
                  {item.horarioSaida || "-"}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Ajuda mensal:</Text> R${" "}
                  {item.ajudaDeCusto ?? "0"}
                </Text>

                {!!datas && (
                  <Text style={styles.info}>
                    <Text style={styles.label}>Dias:</Text> {datas}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => abrirWhatsapp(item)}
                >
                  <Text style={styles.buttonText}>Entrar em contato</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
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
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0B1B35",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1B35",
  },
  role: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  label: {
    fontWeight: "700",
    color: "#111827",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#0B1B35",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 15,
  },
  center: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#0B1B35",
    fontSize: 14,
  },
});