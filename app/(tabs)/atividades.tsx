import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Usuario = {
  id?: number;
  idUsuario?: number;
  nome?: string;
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
  diasAgendados?: string[];
  datasAgendadas?: string[];
  datasRota?: string[];
  tipoUsuario?: string;
  usuario?: Usuario;
};

type Avaliacao = {
  ID_Avaliador?: number;
  ID_Avaliado?: number;
  Comentario?: string;
  Estrelas?: number;
  nomeAvaliador?: string;
  nomeAvaliado?: string;
};

const baseURL =
  typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "https://projeto-faculride.onrender.com/api";

export default function AtividadesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [meuId, setMeuId] = useState<number | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  const carregarDados = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const usuarioLogadoStr = await AsyncStorage.getItem("usuarioLogado");

      let idUsuario: number | null = null;

      if (usuarioLogadoStr) {
        const usuarioLogado = JSON.parse(usuarioLogadoStr);
        idUsuario = Number(usuarioLogado?.idUsuario ?? usuarioLogado?.id);
        setMeuId(idUsuario);
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [resUsuarios, resViagens, resAvaliacoes] = await Promise.all([
        fetch(`${baseURL}/usuario`, { headers }),
        fetch(`${baseURL}/viagem`, { headers }),
        fetch(`${baseURL}/avaliacao`, { headers }),
      ]);

      if (!resUsuarios.ok) throw new Error("Erro ao carregar usuários");
      if (!resViagens.ok) throw new Error("Erro ao carregar viagens");
      if (!resAvaliacoes.ok) throw new Error("Erro ao carregar avaliações");

      const usuariosJson = await resUsuarios.json();
      const viagensJson = await resViagens.json();
      const avaliacoesJson = await resAvaliacoes.json();

      setUsuarios(Array.isArray(usuariosJson) ? usuariosJson : []);
      setViagens(Array.isArray(viagensJson) ? viagensJson : []);
      setAvaliacoes(Array.isArray(avaliacoesJson) ? avaliacoesJson : []);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
      Alert.alert("Erro", "Não foi possível carregar suas atividades.");
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

  const pegarNomeUsuario = useCallback(
    (id: number | undefined) => {
      if (!id) return "Usuário";

      const usuario = usuarios.find(
        (u) => Number(u?.idUsuario ?? u?.id) === Number(id)
      );

      return usuario?.nome || "Usuário";
    },
    [usuarios]
  );

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
      const usuario = usuarios.find(
        (u) => Number(u?.idUsuario ?? u?.id) === uid
      );

      const fromUsuario = (usuario?.tipoUsuario ?? usuario?.tipo_usuario ?? "")
        .toString()
        .trim()
        .toLowerCase();

      return fromUsuario === "motorista" ? "motorista" : "passageiro";
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

  const minhasViagens = useMemo(() => {
    if (!meuId) return [];
    return viagens.filter((v) => Number(v.idUsuario) === Number(meuId));
  }, [viagens, meuId]);

  const caronasOferecidas = useMemo(() => {
    return minhasViagens.filter((v) => tipoNormalizado(v) === "motorista");
  }, [minhasViagens, tipoNormalizado]);

  const caronasProcuradas = useMemo(() => {
    return minhasViagens.filter((v) => tipoNormalizado(v) === "passageiro");
  }, [minhasViagens, tipoNormalizado]);

  const avaliacoesRecebidas = useMemo(() => {
    if (!meuId) return [];

    return avaliacoes
      .filter((a) => Number(a.ID_Avaliado) === Number(meuId))
      .map((a) => ({
        ...a,
        nomeAvaliador: pegarNomeUsuario(a.ID_Avaliador),
      }));
  }, [avaliacoes, meuId, pegarNomeUsuario]);

  const avaliacoesEnviadas = useMemo(() => {
    if (!meuId) return [];

    return avaliacoes
      .filter((a) => Number(a.ID_Avaliador) === Number(meuId))
      .map((a) => ({
        ...a,
        nomeAvaliado: pegarNomeUsuario(a.ID_Avaliado),
      }));
  }, [avaliacoes, meuId, pegarNomeUsuario]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B1B35" />
        <Text style={styles.loadingText}>Carregando atividades...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.pageTitle}>Atividades</Text>
      <Text style={styles.pageSubtitle}>
        Acompanhe seu histórico de caronas e avaliações.
      </Text>

      {/* MINHAS CARONAS */}
      <Text style={styles.sectionTitle}>Minhas Caronas</Text>

      {caronasOferecidas.length === 0 && caronasProcuradas.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Você ainda não possui caronas registradas.
          </Text>
        </View>
      ) : (
        <>
          {caronasOferecidas.map((viagem, index) => {
            const datas = formatarDatas(viagem);

            return (
              <View
                key={`oferecida-${viagem.idViagem ?? viagem.id ?? index}`}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>Carona Oferecida</Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Partida:</Text> {viagem.partida}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Destino:</Text> {viagem.destino}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Entrada:</Text>{" "}
                  {viagem.horarioEntrada || "-"}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Saída:</Text>{" "}
                  {viagem.horarioSaida || "-"}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Ajuda mensal:</Text> R${" "}
                  {viagem.ajudaDeCusto ?? "0"}
                </Text>

                {!!datas && (
                  <Text style={styles.info}>
                    <Text style={styles.label}>Dias:</Text> {datas}
                  </Text>
                )}
              </View>
            );
          })}

          {caronasProcuradas.map((viagem, index) => {
            const datas = formatarDatas(viagem);

            return (
              <View
                key={`procurada-${viagem.idViagem ?? viagem.id ?? index}`}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>Carona Procurada</Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Partida:</Text> {viagem.partida}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Destino:</Text> {viagem.destino}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Entrada:</Text>{" "}
                  {viagem.horarioEntrada || "-"}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Saída:</Text>{" "}
                  {viagem.horarioSaida || "-"}
                </Text>

                <Text style={styles.info}>
                  <Text style={styles.label}>Ajuda mensal:</Text> R${" "}
                  {viagem.ajudaDeCusto ?? "0"}
                </Text>

                {!!datas && (
                  <Text style={styles.info}>
                    <Text style={styles.label}>Dias:</Text> {datas}
                  </Text>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* AVALIAÇÕES RECEBIDAS */}
      <Text style={styles.sectionTitle}>Avaliações Recebidas</Text>

      {avaliacoesRecebidas.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Você ainda não possui avaliações recebidas.
          </Text>
        </View>
      ) : (
        avaliacoesRecebidas.map((avaliacao, index) => (
          <View
            key={`recebida-${avaliacao.ID_Avaliador ?? index}`}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>
              De: {avaliacao.nomeAvaliador || "Usuário"}
            </Text>

            <Text style={styles.info}>
              <Text style={styles.label}>Nota:</Text> ⭐{" "}
              {avaliacao.Estrelas ?? "-"}
            </Text>

            <Text style={styles.info}>
              <Text style={styles.label}>Comentário:</Text>{" "}
              {avaliacao.Comentario || "Sem comentário"}
            </Text>
          </View>
        ))
      )}

      {/* AVALIAÇÕES ENVIADAS */}
      <Text style={styles.sectionTitle}>Avaliações Enviadas</Text>

      {avaliacoesEnviadas.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Você ainda não possui avaliações enviadas.
          </Text>
        </View>
      ) : (
        avaliacoesEnviadas.map((avaliacao, index) => (
          <View
            key={`enviada-${avaliacao.ID_Avaliado ?? index}`}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>
              Para: {avaliacao.nomeAvaliado || "Usuário"}
            </Text>

            <Text style={styles.info}>
              <Text style={styles.label}>Nota:</Text> ⭐{" "}
              {avaliacao.Estrelas ?? "-"}
            </Text>

            <Text style={styles.info}>
              <Text style={styles.label}>Comentário:</Text>{" "}
              {avaliacao.Comentario || "Sem comentário"}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#5B6470",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B1B35",
    marginTop: 10,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
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
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
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