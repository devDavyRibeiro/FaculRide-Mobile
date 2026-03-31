import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  cidade?: string;
  endereco?: string;
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

type FiltroTipo = "todos" | "motorista" | "passageiro";

const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "https://projeto-faculride.onrender.com/api";

export default function EncontreScreen() {
  const flatListRef = useRef<FlatList<Viagem>>(null);

  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [meuId, setMeuId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [somenteProximas, setSomenteProximas] = useState(false);

  const [viagemSelecionada, setViagemSelecionada] = useState<Viagem | null>(
    null
  );

  useEffect(() => {
    const carregarUsuarioLocal = async () => {
      try {
        const usuarioLogadoStr = await AsyncStorage.getItem("usuarioLogado");
        const usuarioSalvo2 = await AsyncStorage.getItem("usuario");
        const usuarioString = usuarioLogadoStr || usuarioSalvo2;

        if (!usuarioString) return;

        const usuario = JSON.parse(usuarioString);
        setUsuarioLogado(usuario);

        const id = usuario?.idUsuario ?? usuario?.id ?? null;
        if (id) {
          setMeuId(Number(id));
        }
      } catch (error) {
        console.error("Erro ao carregar usuário local:", error);
      }
    };

    carregarUsuarioLocal();
  }, []);

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
        fetch(`${API_BASE_URL}/viagem`, { headers }),
        fetch(`${API_BASE_URL}/usuario`, { headers }),
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
      const u = usuarios.find((x) => Number(x?.idUsuario ?? x?.id) === uid);

      const fromUsuario = (u?.tipoUsuario ?? u?.tipo_usuario ?? "")
        .toString()
        .trim()
        .toLowerCase();

      return fromUsuario === "motorista" ? "motorista" : "passageiro";
    },
    [usuarios]
  );

  const obterUsuarioCompletoDaViagem = useCallback(
    (viagem: Viagem): Usuario | null => {
      const usuarioParcial = viagem?.usuario || null;
      const uid = Number(viagem?.idUsuario);

      const encontradoPorId = usuarios.find(
        (u) => Number(u?.idUsuario ?? u?.id) === uid
      );

      const emailParcial = usuarioParcial?.email?.trim().toLowerCase() || "";

      const encontradoPorEmail = emailParcial
        ? usuarios.find(
            (u) => (u?.email || "").trim().toLowerCase() === emailParcial
          )
        : null;

      const usuarioCompleto =
        encontradoPorId || encontradoPorEmail || usuarioParcial;

      return usuarioCompleto
        ? {
            ...usuarioParcial,
            ...usuarioCompleto,
          }
        : null;
    },
    [usuarios]
  );

  const pegarNomeUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = obterUsuarioCompletoDaViagem(viagem);
      return usuario?.nome || "Usuário";
    },
    [obterUsuarioCompletoDaViagem]
  );

  const pegarTelefoneUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = obterUsuarioCompletoDaViagem(viagem);
      return usuario?.telefone || "";
    },
    [obterUsuarioCompletoDaViagem]
  );

  const pegarFotoUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = obterUsuarioCompletoDaViagem(viagem);
      return usuario?.foto || usuario?.fotoUrl || null;
    },
    [obterUsuarioCompletoDaViagem]
  );

  const pegarGeneroUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = obterUsuarioCompletoDaViagem(viagem);
      return usuario?.genero;
    },
    [obterUsuarioCompletoDaViagem]
  );

  const obterDatasViagem = useCallback((viagem: Viagem): string[] => {
    const datas =
      viagem?.diasAgendados ||
      viagem?.datasAgendadas ||
      viagem?.datasRota ||
      [];

    if (!Array.isArray(datas)) return [];

    return datas
      .filter((d): d is string => typeof d === "string" && d.length >= 10)
      .map((d) => d.slice(0, 10))
      .sort((a, b) => a.localeCompare(b));
  }, []);

  const formatarData = useCallback((d: string) => {
    const [, mes, dia] = d.split("-");
    return `${dia}/${mes}`;
  }, []);

  const formatarDatasResumo = useCallback(
    (viagem: Viagem) => {
      const datas = obterDatasViagem(viagem);

      if (!datas.length) return "";

      const mesesUnicos = new Set(
        datas.map((d) => {
          const [ano, mes] = d.split("-");
          return `${ano}-${mes}`;
        })
      );

      if (mesesUnicos.size > 1) {
        return "Todo o semestre";
      }

      return datas.map(formatarData).join(", ");
    },
    [formatarData, obterDatasViagem]
  );

  const minhaCidade = useMemo(() => {
    return usuarioLogado?.cidade?.trim().toLowerCase() || "";
  }, [usuarioLogado]);

  const abrirContato = useCallback(
    (viagem: Viagem) => {
      const nome = pegarNomeUsuario(viagem);
      const telefone = pegarTelefoneUsuario(viagem);

      router.push({
        pathname: "/(tabs)/contato",
        params: {
          idViagem: String(viagem.idViagem ?? viagem.id ?? ""),
          idUsuario: String(viagem.idUsuario ?? ""),
          nome,
          telefone,
          partida: viagem.partida ?? "",
          destino: viagem.destino ?? "",
          entrada: viagem.horarioEntrada ?? "",
          saida: viagem.horarioSaida ?? "",
          ajuda: String(viagem.ajudaDeCusto ?? "0"),
          tipo: tipoNormalizado(viagem),
        },
      });
    },
    [pegarNomeUsuario, pegarTelefoneUsuario, tipoNormalizado]
  );

  const verRotaNoMiniMapa = useCallback((viagem: Viagem) => {
    setViagemSelecionada(viagem);

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }, 50);
  }, []);

  const limparPreviaRota = useCallback(() => {
    setViagemSelecionada(null);
  }, []);

  const caronasDisponiveis = useMemo(() => {
    return viagens.filter((v) => {
      if (!v.partida || !v.destino) return false;

      const tipo = tipoNormalizado(v);

      if (filtroTipo !== "todos" && tipo !== filtroTipo) {
        return false;
      }

      if (somenteProximas && minhaCidade) {
        const partida = (v.partida || "").toLowerCase();
        const destino = (v.destino || "").toLowerCase();

        if (!partida.includes(minhaCidade) && !destino.includes(minhaCidade)) {
          return false;
        }
      }

      return true;
    });
  }, [viagens, filtroTipo, somenteProximas, minhaCidade, tipoNormalizado]);

  const renderAvatar = (viagem: Viagem) => {
    const foto = pegarFotoUsuario(viagem);
    const nome = pegarNomeUsuario(viagem);
    const genero = pegarGeneroUsuario(viagem);

    if (foto) {
      return <Image source={{ uri: foto }} style={styles.avatarImage} />;
    }

    if (genero === true) {
      return (
        <Image
          source={require("../assets/images/profile_man.jpeg")}
          style={styles.avatarImage}
        />
      );
    }

    if (genero === false) {
      return (
        <Image
          source={require("../assets/images/profile_woman.jpeg")}
          style={styles.avatarImage}
        />
      );
    }

    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{nome.charAt(0).toUpperCase()}</Text>
      </View>
    );
  };

  const renderHeader = () => {
    const nomeSelecionado = viagemSelecionada
      ? pegarNomeUsuario(viagemSelecionada)
      : "";

    return (
      <View>
        <Text style={styles.title}>Caronas Disponíveis</Text>
        <Text style={styles.subtitle}>
          Encontre motoristas e passageiros cadastrados na plataforma.
        </Text>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Mini-mapa / Prévia da rota</Text>

          {viagemSelecionada ? (
            <>
              <Text style={styles.previewName}>{nomeSelecionado}</Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Partida:</Text>{" "}
                {viagemSelecionada.partida}
              </Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Destino:</Text>{" "}
                {viagemSelecionada.destino}
              </Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Entrada:</Text>{" "}
                {viagemSelecionada.horarioEntrada || "-"}
              </Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Saída:</Text>{" "}
                {viagemSelecionada.horarioSaida || "-"}
              </Text>

              <View style={styles.miniMapBox}>
                <Text style={styles.miniMapTitle}>Rota selecionada</Text>
                <Text style={styles.miniMapSubtext}>
                  {viagemSelecionada.partida} → {viagemSelecionada.destino}
                </Text>
                <Text style={styles.miniMapHint}>
                  Aqui ficará a visualização rápida da rota selecionada.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.clearPreviewButton}
                onPress={limparPreviaRota}
              >
                <Text style={styles.clearPreviewButtonText}>Limpar prévia</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.miniMapBox}>
              <Text style={styles.miniMapTitle}>Nenhuma rota selecionada</Text>
              <Text style={styles.miniMapHint}>
                Toque em “Ver rota” em um card para visualizar a prévia aqui no
                topo.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filtros</Text>

          <View style={styles.filterChipsRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filtroTipo === "todos" && styles.filterChipActive,
              ]}
              onPress={() => setFiltroTipo("todos")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filtroTipo === "todos" && styles.filterChipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filtroTipo === "motorista" && styles.filterChipActive,
              ]}
              onPress={() => setFiltroTipo("motorista")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filtroTipo === "motorista" && styles.filterChipTextActive,
                ]}
              >
                Motorista
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filtroTipo === "passageiro" && styles.filterChipActive,
              ]}
              onPress={() => setFiltroTipo("passageiro")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filtroTipo === "passageiro" && styles.filterChipTextActive,
                ]}
              >
                Passageiro
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.nearbyButton,
              somenteProximas && styles.nearbyButtonActive,
            ]}
            onPress={() => {
              if (!minhaCidade) {
                Alert.alert(
                  "Aviso",
                  "Seu cadastro ainda não possui cidade definida para aplicar este filtro."
                );
                return;
              }
              setSomenteProximas((prev) => !prev);
            }}
          >
            <Text
              style={[
                styles.nearbyButtonText,
                somenteProximas && styles.nearbyButtonTextActive,
              ]}
            >
              {somenteProximas
                ? `Próximas de mim (${usuarioLogado?.cidade || ""})`
                : "Mostrar caronas próximas de mim"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0B1B35" />
          <Text style={styles.loadingText}>Carregando caronas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={caronasDisponiveis}
          keyExtractor={(item, index) =>
            String(item.idViagem ?? item.id ?? index)
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={renderHeader}
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
            const datasResumo = formatarDatasResumo(item);

            return (
              <View style={styles.card}>
                {renderAvatar(item)}

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

                  {!!datasResumo && (
                    <Text style={styles.info}>
                      <Text style={styles.label}>Dias:</Text> {datasResumo}
                    </Text>
                  )}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => verRotaNoMiniMapa(item)}
                    >
                      <Text style={styles.secondaryButtonText}>Ver rota</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => abrirContato(item)}
                    >
                      <Text style={styles.primaryButtonText}>
                        Entrar em contato
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 18,
    lineHeight: 22,
  },

  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  previewName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 5,
    lineHeight: 20,
  },
  previewLabel: {
    fontWeight: "700",
    color: "#111827",
  },
  miniMapBox: {
    marginTop: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  miniMapTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  miniMapSubtext: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 6,
    lineHeight: 20,
  },
  miniMapHint: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  clearPreviewButton: {
    marginTop: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  clearPreviewButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },

  filtersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  filterChipsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#0B1B35",
  },
  filterChipText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  nearbyButton: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  nearbyButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  nearbyButtonText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  nearbyButtonTextActive: {
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0B1B35",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: 2,
    marginRight: 12,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  role: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 5,
    lineHeight: 20,
  },
  label: {
    fontWeight: "700",
    color: "#111827",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#3367E8",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginLeft: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 6,
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#475569",
  },
});