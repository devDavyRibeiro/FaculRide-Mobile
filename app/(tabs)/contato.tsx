import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type LocalUser = {
  id?: number;
  idUsuario?: number;
  nome?: string;
};

type ConversaUsuario = {
  nome?: string;
  fotoUrl?: string;
  foto?: string;
  avatarUrl?: string;
  imagem?: string;
  fotoPath?: string;
};

type ConversaViagem = {
  idViagem?: number;
  partida?: string;
  destino?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  ajudaDeCusto?: string | number;

  statusViagem?: "pendente" | "aceita" | "recusada" | "concluida" | "cancelada";
  cancelada?: boolean;
};

type Conversa = {
  idConversa: number;
  idViagem: number;
  idMotorista: number;
  idPassageiro: number;
  status: "pendente" | "aguardando_confirmacao" | "aceita" | "recusada" | string;
  aceiteMotorista: boolean;
  aceitePassageiro: boolean;
  createdAt?: string;
  updatedAt?: string;
  viagem?: ConversaViagem;
  motorista?: ConversaUsuario;
  passageiro?: ConversaUsuario;
};

type Mensagem = {
  idMensagem: number;
  idConversa: number;
  idRemetente: number;
  mensagem: string;
  lida?: boolean;
  createdAt?: string;
  updatedAt?: string;
  remetente?: {
    nome?: string;
    fotoUrl?: string;
    foto?: string;
    avatarUrl?: string;
    imagem?: string;
    fotoPath?: string;
  };
};

const baseURL =
  typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "https://projeto-faculride.onrender.com/api";

function normalizarParamString(valor: unknown): string {
  if (Array.isArray(valor)) return valor[0] || "";
  return typeof valor === "string" ? valor : "";
}

function formatarHoraCurta(dataIso?: string) {
  if (!dataIso) return "";
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return "";
  const hh = String(data.getHours()).padStart(2, "0");
  const mm = String(data.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getInitials(nome?: string) {
  const texto = (nome || "").trim();
  if (!texto) return "?";

  const partes = texto.split(" ").filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();

  return `${partes[0][0] || ""}${partes[1][0] || ""}`.toUpperCase();
}

function getFotoUsuario(usuario?: ConversaUsuario | null) {
  if (!usuario) return "";
  return (
    usuario.fotoUrl ||
    usuario.foto ||
    usuario.avatarUrl ||
    usuario.imagem ||
    usuario.fotoPath ||
    ""
  );
}

function getStatusViagemConversa(viagem?: ConversaViagem | null) {
  return String(viagem?.statusViagem || "").trim().toLowerCase();
}

function deduplicarConversas(lista: Conversa[]) {
  const mapa = new Map<number, Conversa>();

  for (const conversa of lista) {
    const id = Number(conversa.idConversa);
    if (!mapa.has(id)) {
      mapa.set(id, conversa);
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const dataA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dataB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dataB - dataA;
  });
}

function deduplicarMensagens(lista: Mensagem[]) {
  const mapa = new Map<number, Mensagem>();

  for (const mensagem of lista) {
    const id = Number(mensagem.idMensagem);
    if (!mapa.has(id)) {
      mapa.set(id, mensagem);
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const dataA = new Date(a.createdAt || 0).getTime();
    const dataB = new Date(b.createdAt || 0).getTime();
    return dataA - dataB;
  });
}

export default function ContatoScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const idViagemParam = useMemo(
    () => normalizarParamString(params?.idViagem),
    [params?.idViagem]
  );
  const nomeParam = useMemo(
    () => normalizarParamString(params?.nome),
    [params?.nome]
  );
  const partidaParam = useMemo(
    () => normalizarParamString(params?.partida),
    [params?.partida]
  );
  const destinoParam = useMemo(
    () => normalizarParamString(params?.destino),
    [params?.destino]
  );
  const entradaParam = useMemo(
    () => normalizarParamString(params?.entrada),
    [params?.entrada]
  );
  const saidaParam = useMemo(
    () => normalizarParamString(params?.saida),
    [params?.saida]
  );
  const ajudaParam = useMemo(
    () => normalizarParamString(params?.ajuda),
    [params?.ajuda]
  );
  const tipoParam = useMemo(
    () => normalizarParamString(params?.tipo),
    [params?.tipo]
  );

  const scrollRef = useRef<ScrollView>(null);
  const ultimaViagemInicializadaRef = useRef<string>("");
  const iniciandoConversaRef = useRef<string | null>(null);

  const [meuUsuario, setMeuUsuario] = useState<LocalUser | null>(null);
  const [meuId, setMeuId] = useState<number | null>(null);

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(
    null
  );
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  const [input, setInput] = useState("");
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [salvandoAcao, setSalvandoAcao] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const obterToken = useCallback(async () => {
    return (await AsyncStorage.getItem("token")) || "";
  }, []);

  const obterHeaders = useCallback(async () => {
    const token = await obterToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, [obterToken]);

  const carregarUsuarioLocal = useCallback(async () => {
    try {
      const usuarioLogadoStr =
        (await AsyncStorage.getItem("usuarioLogado")) ||
        (await AsyncStorage.getItem("usuario"));

      if (!usuarioLogadoStr) {
        setMeuUsuario(null);
        setMeuId(null);
        return null;
      }

      const usuario = JSON.parse(usuarioLogadoStr) as LocalUser;
      const id = Number(usuario?.idUsuario ?? usuario?.id ?? 0);

      setMeuUsuario(usuario);
      setMeuId(id || null);

      return {
        ...usuario,
        idUsuario: id || usuario?.idUsuario,
      };
    } catch (error) {
      console.error("Erro ao carregar usuário local:", error);
      setMeuUsuario(null);
      setMeuId(null);
      return null;
    }
  }, []);

  const listarConversas = useCallback(async () => {
    const headers = await obterHeaders();
    const response = await fetch(`${baseURL}/conversas`, { headers });

    if (!response.ok) {
      throw new Error("Não foi possível carregar as conversas.");
    }

    const data = await response.json();
    const lista = Array.isArray(data) ? (data as Conversa[]) : [];
    const listaLimpa = deduplicarConversas(lista);
    setConversas(listaLimpa);
    return listaLimpa;
  }, [obterHeaders]);

  const listarMensagens = useCallback(
    async (idConversa: number, silencioso = false) => {
      try {
        if (!silencioso) setLoadingMensagens(true);

        const headers = await obterHeaders();
        const response = await fetch(
          `${baseURL}/conversas/${idConversa}/mensagens`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Não foi possível carregar as mensagens.");
        }

        const data = await response.json();
        const lista = Array.isArray(data) ? (data as Mensagem[]) : [];
        setMensagens(deduplicarMensagens(lista));
      } catch (error) {
        console.error("Erro ao listar mensagens:", error);
        if (!silencioso) {
          Alert.alert("Erro", "Não foi possível carregar as mensagens.");
        }
      } finally {
        if (!silencioso) setLoadingMensagens(false);
      }
    },
    [obterHeaders]
  );

  const iniciarConversaSeNecessario = useCallback(async () => {
    if (!idViagemParam) return null;

    if (ultimaViagemInicializadaRef.current === idViagemParam) {
      return null;
    }

    if (iniciandoConversaRef.current === idViagemParam) {
      return null;
    }

    iniciandoConversaRef.current = idViagemParam;

    try {
      const headers = await obterHeaders();

      const response = await fetch(`${baseURL}/conversas/iniciar`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          idViagem: Number(idViagemParam),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Não foi possível iniciar a conversa.");
      }

      const conversa = (await response.json()) as Conversa;
      ultimaViagemInicializadaRef.current = idViagemParam;
      return conversa;
    } finally {
      iniciandoConversaRef.current = null;
    }
  }, [idViagemParam, obterHeaders]);

  const sincronizarTela = useCallback(async () => {
    try {
      const usuario = await carregarUsuarioLocal();
      if (!usuario) {
        setLoadingInicial(false);
        return;
      }

      let conversaCriadaOuExistente: Conversa | null = null;

      try {
        if (idViagemParam) {
          conversaCriadaOuExistente = await iniciarConversaSeNecessario();
        }
      } catch (error) {
        console.error("Erro ao iniciar conversa:", error);
      }

      const lista = await listarConversas();

      let alvo: Conversa | null = null;

      if (conversaCriadaOuExistente?.idConversa) {
        const conversaDaLista =
          lista.find(
            (c) =>
              Number(c.idConversa) ===
              Number(conversaCriadaOuExistente.idConversa)
          ) || null;

        alvo = conversaDaLista || conversaCriadaOuExistente;

        if (
          !conversaDaLista &&
          !lista.some(
            (c) =>
              Number(c.idConversa) ===
              Number(conversaCriadaOuExistente.idConversa)
          )
        ) {
          setConversas((prev) =>
            deduplicarConversas([conversaCriadaOuExistente as Conversa, ...prev])
          );
        }
      }

      if (!alvo && conversaSelecionada?.idConversa) {
        alvo =
          lista.find(
            (c) => Number(c.idConversa) === Number(conversaSelecionada.idConversa)
          ) || null;
      }

      if (!alvo && idViagemParam) {
        const candidatosDaViagem = lista.filter(
          (c) => Number(c.idViagem) === Number(idViagemParam)
        );

        if (candidatosDaViagem.length > 0) {
          alvo =
            candidatosDaViagem.find(
              (c) =>
                Number(c.idMotorista) === Number(meuId) ||
                Number(c.idPassageiro) === Number(meuId)
            ) || candidatosDaViagem[0];
        }
      }

      setConversaSelecionada(alvo);

      if (alvo?.idConversa) {
        await listarMensagens(alvo.idConversa, true);
      } else {
        setMensagens([]);
      }
    } catch (error) {
      console.error("Erro ao sincronizar tela de contato:", error);
      Alert.alert("Erro", "Não foi possível carregar a tela de contato.");
    } finally {
      setLoadingInicial(false);
    }
  }, [
    carregarUsuarioLocal,
    idViagemParam,
    iniciarConversaSeNecessario,
    listarConversas,
    listarMensagens,
    conversaSelecionada?.idConversa,
    meuId,
  ]);

  useFocusEffect(
    useCallback(() => {
      let interval: ReturnType<typeof setInterval> | null = null;

      sincronizarTela();

      interval = setInterval(() => {
        sincronizarTela();
      }, 3000);

      return () => {
        if (interval) clearInterval(interval);
      };
    }, [sincronizarTela])
  );

  useEffect(() => {
    if (!scrollRef.current) return;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);

    return () => clearTimeout(timer);
  }, [mensagens]);

  const outroUsuario = useMemo(() => {
    if (!conversaSelecionada || !meuId) return null;

    const euSouMotorista =
      Number(conversaSelecionada.idMotorista) === Number(meuId);

    return euSouMotorista
      ? conversaSelecionada.passageiro || null
      : conversaSelecionada.motorista || null;
  }, [conversaSelecionada, meuId]);

  const fotoOutroUsuario = useMemo(() => {
    return getFotoUsuario(outroUsuario);
  }, [outroUsuario]);

  const outroNome = useMemo(() => {
    if (conversaSelecionada && meuId) {
      const euSouMotorista =
        Number(conversaSelecionada.idMotorista) === Number(meuId);

      if (euSouMotorista) {
        return conversaSelecionada.passageiro?.nome || nomeParam || "Contato";
      }

      return conversaSelecionada.motorista?.nome || nomeParam || "Contato";
    }

    return nomeParam || "Contato";
  }, [conversaSelecionada, meuId, nomeParam]);

  const detalhesViagemSelecionada = useMemo(() => {
    if (conversaSelecionada?.viagem) {
      return {
        origem: conversaSelecionada.viagem.partida || partidaParam || "-",
        destino: conversaSelecionada.viagem.destino || destinoParam || "-",
        entrada: conversaSelecionada.viagem.horarioEntrada || entradaParam || "-",
        saida: conversaSelecionada.viagem.horarioSaida || saidaParam || "-",
        ajuda: String(
          conversaSelecionada.viagem.ajudaDeCusto ?? ajudaParam ?? "0"
        ),
        statusViagem: getStatusViagemConversa(conversaSelecionada.viagem),
      };
    }

    return {
      origem: partidaParam || "-",
      destino: destinoParam || "-",
      entrada: entradaParam || "-",
      saida: saidaParam || "-",
      ajuda: ajudaParam || "0",
      statusViagem: "",
    };
  }, [
    conversaSelecionada,
    partidaParam,
    destinoParam,
    entradaParam,
    saidaParam,
    ajudaParam,
  ]);

  const subtituloContato = useMemo(() => {
    if (!conversaSelecionada || !meuId) {
      if (tipoParam === "motorista") return "Motorista";
      if (tipoParam === "passageiro") return "Passageiro";
      return "Conversa";
    }

    if (Number(conversaSelecionada.idMotorista) === Number(meuId)) {
      return "Passageiro";
    }

    return "Motorista";
  }, [conversaSelecionada, meuId, tipoParam]);

  const statusLabel = useMemo(() => {
    const statusViagem = detalhesViagemSelecionada.statusViagem;

    if (statusViagem === "cancelada") return "Carona cancelada";
    if (statusViagem === "concluida") return "Carona concluída";

    if (!conversaSelecionada) return "Sem conversa";

    const status = conversaSelecionada.status || "pendente";

    if (status === "aceita") return "Carona aceita";
    if (status === "recusada") return "Conversa encerrada";
    if (status === "aguardando_confirmacao") return "Aguardando confirmação";
    return "Aguardando decisão";
  }, [conversaSelecionada, detalhesViagemSelecionada.statusViagem]);

  const statusColor = useMemo(() => {
    const statusViagem = detalhesViagemSelecionada.statusViagem;

    if (statusViagem === "cancelada") return "#6B7280";
    if (statusViagem === "concluida") return "#2563EB";

    if (!conversaSelecionada) return "#64748B";

    const status = conversaSelecionada.status || "pendente";

    if (status === "aceita") return "#16A34A";
    if (status === "recusada") return "#DC2626";
    if (status === "aguardando_confirmacao") return "#F59E0B";
    return "#2563EB";
  }, [conversaSelecionada, detalhesViagemSelecionada.statusViagem]);

  const euJaAceitei = useMemo(() => {
    if (!conversaSelecionada || !meuId) return false;

    if (Number(conversaSelecionada.idMotorista) === Number(meuId)) {
      return !!conversaSelecionada.aceiteMotorista;
    }

    return !!conversaSelecionada.aceitePassageiro;
  }, [conversaSelecionada, meuId]);

  const outroJaAceitou = useMemo(() => {
    if (!conversaSelecionada || !meuId) return false;

    if (Number(conversaSelecionada.idMotorista) === Number(meuId)) {
      return !!conversaSelecionada.aceitePassageiro;
    }

    return !!conversaSelecionada.aceiteMotorista;
  }, [conversaSelecionada, meuId]);

  const podeEnviarMensagem = useMemo(() => {
    if (!conversaSelecionada?.idConversa) return false;

    const statusViagem = detalhesViagemSelecionada.statusViagem;
    if (statusViagem === "cancelada" || statusViagem === "concluida") {
      return false;
    }

    return conversaSelecionada.status !== "recusada";
  }, [conversaSelecionada, detalhesViagemSelecionada.statusViagem]);

  const observacaoStatus = useMemo(() => {
    const statusViagem = detalhesViagemSelecionada.statusViagem;

    if (statusViagem === "cancelada") {
      return "Essa carona foi cancelada. O chat permanece apenas para histórico.";
    }

    if (statusViagem === "concluida") {
      return "Essa carona já foi concluída. Você pode revisar o histórico da conversa.";
    }

    if (!conversaSelecionada) {
      return "Abra ou selecione uma conversa para negociar a carona.";
    }

    if (conversaSelecionada.status === "aceita") {
      return "Os dois lados já aceitaram. Essa carona foi combinada com sucesso.";
    }

    if (conversaSelecionada.status === "recusada") {
      return "Essa conversa foi encerrada por recusa da carona.";
    }

    if (conversaSelecionada.status === "aguardando_confirmacao") {
      if (euJaAceitei && !outroJaAceitou) {
        return "Você já aceitou. Agora falta o outro participante confirmar.";
      }

      if (!euJaAceitei && outroJaAceitou) {
        return "O outro participante já aceitou. Falta sua confirmação.";
      }

      return "Converse e alinhe os detalhes antes de aceitar ou recusar.";
    }

    return "Converse e alinhe os detalhes antes de aceitar ou recusar.";
  }, [conversaSelecionada, euJaAceitei, outroJaAceitou, detalhesViagemSelecionada.statusViagem]);

  const handleSelecionarConversa = useCallback(
    async (conversa: Conversa) => {
      setConversaSelecionada(conversa);
      await listarMensagens(conversa.idConversa);
    },
    [listarMensagens]
  );

  const handleSendMessage = useCallback(async () => {
    const texto = input.trim();

    if (!texto) return;

    if (!conversaSelecionada?.idConversa) {
      Alert.alert("Aviso", "Selecione uma conversa antes de enviar mensagem.");
      return;
    }

    if (!podeEnviarMensagem) {
      Alert.alert("Aviso", "Essa conversa não aceita novas mensagens.");
      return;
    }

    try {
      setEnviandoMensagem(true);

      const headers = await obterHeaders();

      const response = await fetch(`${baseURL}/conversas/mensagem`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          idConversa: conversaSelecionada.idConversa,
          mensagem: texto,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Não foi possível enviar a mensagem.");
      }

      setInput("");
      await listarMensagens(conversaSelecionada.idConversa, true);
      await listarConversas();

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      Alert.alert("Erro", "Não foi possível enviar sua mensagem.");
    } finally {
      setEnviandoMensagem(false);
    }
  }, [input, conversaSelecionada, obterHeaders, listarMensagens, listarConversas, podeEnviarMensagem]);

  const handleAcceptRide = useCallback(async () => {
    if (!conversaSelecionada?.idConversa) return;

    const statusViagem = detalhesViagemSelecionada.statusViagem;
    if (statusViagem === "cancelada" || statusViagem === "concluida") {
      Alert.alert("Aviso", "Essa carona não pode mais ser confirmada.");
      return;
    }

    try {
      setSalvandoAcao(true);

      const headers = await obterHeaders();

      const response = await fetch(
        `${baseURL}/conversas/${conversaSelecionada.idConversa}/aceitar`,
        {
          method: "PATCH",
          headers,
        }
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Não foi possível aceitar a carona.");
      }

      const conversaAtualizada = (await response.json()) as Conversa;
      setConversaSelecionada((prev) =>
        prev ? { ...prev, ...conversaAtualizada } : conversaAtualizada
      );

      const lista = await listarConversas();
      const alvo =
        lista.find(
          (c) => Number(c.idConversa) === Number(conversaSelecionada.idConversa)
        ) || null;

      if (alvo) {
        setConversaSelecionada(alvo);
      }

      Alert.alert("Tudo certo", "Sua confirmação foi registrada.");
    } catch (error) {
      console.error("Erro ao aceitar carona:", error);
      Alert.alert("Erro", "Não foi possível aceitar a carona.");
    } finally {
      setSalvandoAcao(false);
    }
  }, [conversaSelecionada, obterHeaders, listarConversas, detalhesViagemSelecionada.statusViagem]);

  const handleRejectRide = useCallback(async () => {
    if (!conversaSelecionada?.idConversa) return;

    const statusViagem = detalhesViagemSelecionada.statusViagem;
    if (statusViagem === "cancelada" || statusViagem === "concluida") {
      Alert.alert("Aviso", "Essa carona não pode mais ser recusada.");
      return;
    }

    Alert.alert(
      "Recusar carona",
      "Tem certeza que deseja recusar esta carona? A conversa ficará encerrada.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Recusar",
          style: "destructive",
          onPress: async () => {
            try {
              setSalvandoAcao(true);

              const headers = await obterHeaders();

              const response = await fetch(
                `${baseURL}/conversas/${conversaSelecionada.idConversa}/recusar`,
                {
                  method: "PATCH",
                  headers,
                }
              );

              if (!response.ok) {
                const body = await response.text();
                throw new Error(body || "Não foi possível recusar a carona.");
              }

              const conversaAtualizada = (await response.json()) as Conversa;
              setConversaSelecionada((prev) =>
                prev ? { ...prev, ...conversaAtualizada } : conversaAtualizada
              );

              const lista = await listarConversas();
              const alvo =
                lista.find(
                  (c) =>
                    Number(c.idConversa) === Number(conversaSelecionada.idConversa)
                ) || null;

              if (alvo) {
                setConversaSelecionada(alvo);
              }

              Alert.alert(
                "Conversa encerrada",
                "A carona foi recusada e o outro participante verá esse status."
              );
            } catch (error) {
              console.error("Erro ao recusar carona:", error);
              Alert.alert("Erro", "Não foi possível recusar a carona.");
            } finally {
              setSalvandoAcao(false);
            }
          },
        },
      ]
    );
  }, [conversaSelecionada, obterHeaders, listarConversas, detalhesViagemSelecionada.statusViagem]);

  function renderStars() {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= selectedStars;
          return (
            <Pressable
              key={star}
              onPress={() => setSelectedStars(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={filled ? "star" : "star-outline"}
                size={34}
                color={filled ? "#FACC15" : "#94A3B8"}
              />
            </Pressable>
          );
        })}
      </View>
    );
  }

  function handleSubmitRating() {
    if (selectedStars === 0) {
      Alert.alert("Avaliação incompleta", "Selecione pelo menos 1 estrela.");
      return;
    }

    console.log("Avaliação preparada:", {
      estrelas: selectedStars,
      comentario: ratingComment,
      conversa: conversaSelecionada?.idConversa,
      usuario: meuUsuario?.nome,
    });

    Alert.alert(
      "Avaliação preparada",
      "A parte visual ficou pronta. Depois ligamos isso na rota de avaliação."
    );

    setShowRatingModal(false);
    setSelectedStars(0);
    setRatingComment("");
  }

  if (loadingInicial) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.loadingWrap}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={34}
            color="#2563EB"
          />
          <Text style={styles.loadingText}>Carregando conversas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 92 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {fotoOutroUsuario ? (
              <Image source={{ uri: fotoOutroUsuario }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(outroNome)}</Text>
              </View>
            )}

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>{outroNome}</Text>
              <Text style={styles.headerSubtitle}>{subtituloContato}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}18` },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.rideCard}>
          <View style={styles.rideCardTop}>
            <Text style={styles.rideCardTitle}>Detalhes da carona</Text>
            <Ionicons name="car-sport-outline" size={20} color="#2563EB" />
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>
              {detalhesViagemSelecionada.origem} →{" "}
              {detalhesViagemSelecionada.destino}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>
              Entrada {detalhesViagemSelecionada.entrada} • Saída{" "}
              {detalhesViagemSelecionada.saida}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>
              Ajuda de custo: R$ {detalhesViagemSelecionada.ajuda}
            </Text>
          </View>
        </View>

        <View style={styles.bodyRow}>
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>Conversas</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sidebarList}
            >
              {conversas.length === 0 ? (
                <View style={styles.emptySidebar}>
                  <Text style={styles.emptySidebarText}>Sem chats</Text>
                </View>
              ) : (
                conversas.map((conversa) => {
                  const nome =
                    Number(conversa.idMotorista) === Number(meuId)
                      ? conversa.passageiro?.nome || "Contato"
                      : conversa.motorista?.nome || "Contato";

                  const foto =
                    Number(conversa.idMotorista) === Number(meuId)
                      ? getFotoUsuario(conversa.passageiro)
                      : getFotoUsuario(conversa.motorista);

                  const selecionada =
                    Number(conversaSelecionada?.idConversa) ===
                    Number(conversa.idConversa);

                  const statusViagemChat = getStatusViagemConversa(conversa.viagem);

                  const corStatus =
                    statusViagemChat === "cancelada"
                      ? "#6B7280"
                      : statusViagemChat === "concluida"
                      ? "#2563EB"
                      : conversa.status === "aceita"
                      ? "#16A34A"
                      : conversa.status === "recusada"
                      ? "#DC2626"
                      : conversa.status === "aguardando_confirmacao"
                      ? "#F59E0B"
                      : "#2563EB";

                  return (
                    <Pressable
                      key={conversa.idConversa}
                      style={[
                        styles.sidebarAvatarButton,
                        selecionada && styles.sidebarAvatarButtonActive,
                      ]}
                      onPress={() => handleSelecionarConversa(conversa)}
                    >
                      {foto ? (
                        <Image
                          source={{ uri: foto }}
                          style={[
                            styles.sidebarAvatarImage,
                            selecionada && styles.sidebarAvatarImageActive,
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.sidebarAvatar,
                            selecionada && styles.sidebarAvatarActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sidebarAvatarText,
                              selecionada && styles.sidebarAvatarTextActive,
                            ]}
                          >
                            {getInitials(nome)}
                          </Text>
                        </View>
                      )}

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.sidebarAvatarLabel,
                          selecionada && styles.sidebarAvatarLabelActive,
                        ]}
                      >
                        {nome}
                      </Text>

                      <View
                        style={[styles.statusDot, { backgroundColor: corStatus }]}
                      />
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>

          <View style={styles.chatArea}>
            <View style={styles.noticeCard}>
              <Ionicons
                name={
                  !conversaSelecionada
                    ? "chatbubble-ellipses-outline"
                    : detalhesViagemSelecionada.statusViagem === "cancelada"
                    ? "remove-circle"
                    : detalhesViagemSelecionada.statusViagem === "concluida"
                    ? "checkmark-done-circle"
                    : conversaSelecionada.status === "aceita"
                    ? "checkmark-circle"
                    : conversaSelecionada.status === "recusada"
                    ? "close-circle"
                    : "information-circle"
                }
                size={18}
                color={statusColor}
              />
              <Text style={styles.noticeText}>{observacaoStatus}</Text>
            </View>

            <View style={styles.messagesPanel}>
              {loadingMensagens ? (
                <View style={styles.messagesLoading}>
                  <Text style={styles.messagesLoadingText}>
                    Carregando mensagens...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  ref={scrollRef}
                  style={styles.messagesContainer}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {mensagens.length === 0 ? (
                    <View style={styles.emptyMessagesBox}>
                      <Text style={styles.emptyMessagesText}>
                        Nenhuma mensagem ainda. Comece a conversa abaixo.
                      </Text>
                    </View>
                  ) : (
                    mensagens.map((msg) => {
                      const isMe = Number(msg.idRemetente) === Number(meuId);

                      return (
                        <View
                          key={msg.idMensagem}
                          style={[
                            styles.messageRow,
                            isMe ? styles.messageRowMe : styles.messageRowOther,
                          ]}
                        >
                          <View
                            style={[
                              styles.messageBubble,
                              isMe
                                ? styles.messageBubbleMe
                                : styles.messageBubbleOther,
                            ]}
                          >
                            <Text
                              style={[
                                styles.messageText,
                                isMe
                                  ? styles.messageTextMe
                                  : styles.messageTextOther,
                              ]}
                            >
                              {msg.mensagem}
                            </Text>

                            <Text
                              style={[
                                styles.messageTime,
                                isMe
                                  ? styles.messageTimeMe
                                  : styles.messageTimeOther,
                              ]}
                            >
                              {formatarHoraCurta(msg.createdAt)}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              )}
            </View>

            <View
              style={[
                styles.chatBottomArea,
                {
                  paddingBottom:
                    Platform.OS === "ios"
                      ? Math.max(insets.bottom, 8)
                      : 6,
                },
              ]}
            >
              <View style={styles.actionsContainer}>
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.acceptButton,
                    (salvandoAcao ||
                      !conversaSelecionada ||
                      euJaAceitei ||
                      conversaSelecionada?.status === "recusada" ||
                      conversaSelecionada?.status === "aceita" ||
                      detalhesViagemSelecionada.statusViagem === "cancelada" ||
                      detalhesViagemSelecionada.statusViagem === "concluida") &&
                      styles.disabledButton,
                  ]}
                  onPress={handleAcceptRide}
                  disabled={
                    salvandoAcao ||
                    !conversaSelecionada ||
                    euJaAceitei ||
                    conversaSelecionada?.status === "recusada" ||
                    conversaSelecionada?.status === "aceita" ||
                    detalhesViagemSelecionada.statusViagem === "cancelada" ||
                    detalhesViagemSelecionada.statusViagem === "concluida"
                  }
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>
                    {!conversaSelecionada
                      ? "Sem conversa"
                      : detalhesViagemSelecionada.statusViagem === "cancelada"
                      ? "Carona cancelada"
                      : detalhesViagemSelecionada.statusViagem === "concluida"
                      ? "Carona concluída"
                      : conversaSelecionada?.status === "aceita"
                      ? "Carona fechada"
                      : euJaAceitei
                      ? "Você já aceitou"
                      : "Aceitar carona"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionButton,
                    styles.rejectButton,
                    (salvandoAcao ||
                      !conversaSelecionada ||
                      conversaSelecionada?.status === "recusada" ||
                      detalhesViagemSelecionada.statusViagem === "cancelada" ||
                      detalhesViagemSelecionada.statusViagem === "concluida") &&
                      styles.disabledButton,
                  ]}
                  onPress={handleRejectRide}
                  disabled={
                    salvandoAcao ||
                    !conversaSelecionada ||
                    conversaSelecionada?.status === "recusada" ||
                    detalhesViagemSelecionada.statusViagem === "cancelada" ||
                    detalhesViagemSelecionada.statusViagem === "concluida"
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>
                    {!conversaSelecionada
                      ? "Sem conversa"
                      : detalhesViagemSelecionada.statusViagem === "cancelada"
                      ? "Carona cancelada"
                      : detalhesViagemSelecionada.statusViagem === "concluida"
                      ? "Carona concluída"
                      : conversaSelecionada?.status === "recusada"
                      ? "Conversa encerrada"
                      : "Recusar carona"}
                  </Text>
                </Pressable>
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
              >
                <View
                  style={[
                    styles.inputWrapper,
                    !podeEnviarMensagem && styles.inputWrapperDisabled,
                  ]}
                >
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder={
                      !conversaSelecionada
                        ? "Selecione ou inicie uma conversa..."
                        : detalhesViagemSelecionada.statusViagem === "cancelada"
                        ? "Essa carona foi cancelada."
                        : detalhesViagemSelecionada.statusViagem === "concluida"
                        ? "Essa carona já foi concluída."
                        : podeEnviarMensagem
                        ? "Digite sua mensagem..."
                        : "Essa conversa está encerrada."
                    }
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    multiline
                    editable={podeEnviarMensagem && !enviandoMensagem}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollRef.current?.scrollToEnd({ animated: true });
                      }, 180);
                    }}
                  />

                  <Pressable
                    style={[
                      styles.sendButton,
                      (!podeEnviarMensagem || enviandoMensagem) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleSendMessage}
                    disabled={!podeEnviarMensagem || enviandoMensagem}
                  >
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </View>
          </View>
        </View>

        <Modal
          visible={showRatingModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowRatingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIcon}>
                <Ionicons name="star-outline" size={26} color="#2563EB" />
              </View>

              <Text style={styles.modalTitle}>Avaliar carona</Text>
              <Text style={styles.modalSubtitle}>
                Sua carona com <Text style={styles.bold}>{outroNome}</Text> foi
                realizada? Conte como foi a experiência.
              </Text>

              {renderStars()}

              <TextInput
                value={ratingComment}
                onChangeText={setRatingComment}
                placeholder="Deixe um comentário (opcional)"
                placeholderTextColor="#94A3B8"
                multiline
                style={styles.commentInput}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                  onPress={() => setShowRatingModal(false)}
                >
                  <Text style={styles.modalBtnSecondaryText}>Agora não</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalBtn, styles.modalBtnPrimary]}
                  onPress={handleSubmitRating}
                >
                  <Text style={styles.modalBtnPrimaryText}>
                    Enviar avaliação
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboard: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  loadingWrap: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },

  headerTextWrap: {
    flex: 1,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2563EB",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  rideCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  rideCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  rideCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },

  infoText: {
    fontSize: 14,
    color: "#475569",
    flex: 1,
  },

  bodyRow: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 12,
  },

  sidebar: {
    width: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  sidebarTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
    marginBottom: 10,
  },

  sidebarList: {
    gap: 10,
    paddingBottom: 8,
  },

  emptySidebar: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },

  emptySidebarText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },

  sidebarAvatarButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
    borderRadius: 16,
  },

  sidebarAvatarButtonActive: {
    backgroundColor: "#EFF6FF",
  },

  sidebarAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  sidebarAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2E8F0",
    borderWidth: 2,
    borderColor: "transparent",
  },

  sidebarAvatarImageActive: {
    borderColor: "#2563EB",
  },

  sidebarAvatarActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },

  sidebarAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#475569",
  },

  sidebarAvatarTextActive: {
    color: "#2563EB",
  },

  sidebarAvatarLabel: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    width: "100%",
  },

  sidebarAvatarLabelActive: {
    color: "#0F172A",
    fontWeight: "700",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  chatArea: {
    flex: 1,
    minWidth: 0,
  },

  noticeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },

  noticeText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 19,
  },

  messagesPanel: {
    flex: 1,
    minHeight: 220,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 10,
  },

  messagesLoading: {
    flex: 1,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  messagesLoadingText: {
    color: "#64748B",
    fontSize: 14,
  },

  messagesContainer: {
    flex: 1,
  },

  messagesContent: {
    padding: 12,
    gap: 10,
  },

  emptyMessagesBox: {
    paddingVertical: 30,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyMessagesText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  messageRow: {
    width: "100%",
    flexDirection: "row",
  },

  messageRowMe: {
    justifyContent: "flex-end",
  },

  messageRowOther: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  messageBubbleMe: {
    backgroundColor: "#2563EB",
    borderBottomRightRadius: 6,
  },

  messageBubbleOther: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },

  messageTextMe: {
    color: "#FFFFFF",
  },

  messageTextOther: {
    color: "#0F172A",
  },

  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },

  messageTimeMe: {
    color: "rgba(255,255,255,0.75)",
    textAlign: "right",
  },

  messageTimeOther: {
    color: "#94A3B8",
    textAlign: "right",
  },

  chatBottomArea: {
    paddingTop: 6,
    flexShrink: 0,
  },

  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  acceptButton: {
    backgroundColor: "#16A34A",
  },

  rejectButton: {
    backgroundColor: "#DC2626",
  },

  disabledButton: {
    opacity: 0.65,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 6,
  },

  inputWrapperDisabled: {
    backgroundColor: "#F8FAFC",
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: "#0F172A",
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },

  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    textAlign: "center",
    marginBottom: 16,
  },

  bold: {
    fontWeight: "700",
    color: "#0F172A",
  },

  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },

  starButton: {
    paddingHorizontal: 4,
  },

  commentInput: {
    minHeight: 92,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: "#0F172A",
    textAlignVertical: "top",
    backgroundColor: "#F8FAFC",
    marginBottom: 16,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },

  modalBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBtnSecondary: {
    backgroundColor: "#E2E8F0",
  },

  modalBtnPrimary: {
    backgroundColor: "#2563EB",
  },

  modalBtnSecondaryText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },

  modalBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});