import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type DiaCalendario = {
  dia: number;
  dateStr: string | null;
  desabilitado: boolean;
};

const baseURL =
  typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "https://projeto-faculride.onrender.com/api";

export default function MapaScreen() {
  const [meuId, setMeuId] = useState<number | null>(null);

  const [tipoCarona, setTipoCarona] = useState<"oferecer" | "procurar">(
    "oferecer"
  );
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("FATEC Votorantim");
  const [entradaFatec, setEntradaFatec] = useState("");
  const [saidaFatec, setSaidaFatec] = useState("");
  const [ajudaCusto, setAjudaCusto] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [datasRota, setDatasRota] = useState<string[]>([]);
  const [diasCalendario, setDiasCalendario] = useState<DiaCalendario[]>([]);
  const [mesAtualLabel, setMesAtualLabel] = useState("");

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuarioLogadoStr = await AsyncStorage.getItem("usuarioLogado");
      if (usuarioLogadoStr) {
        const usuarioLogado = JSON.parse(usuarioLogadoStr);
        setMeuId(Number(usuarioLogado?.idUsuario ?? usuarioLogado?.id));
      }
    };

    carregarUsuario();
    gerarCalendarioMesCorrente();
  }, []);

  const toISODate = (d: Date) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const gerarCalendarioMesCorrente = useCallback(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    const nomesMes = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];

    setMesAtualLabel(`${nomesMes[mes]} de ${ano}`);

    const primeiroDia = new Date(ano, mes, 1);
    const primeiroDiaSemana = primeiroDia.getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    const calendario: DiaCalendario[] = [];

    for (let i = 0; i < primeiroDiaSemana; i++) {
      calendario.push({
        dia: 0,
        dateStr: null,
        desabilitado: true,
      });
    }

    for (let d = 1; d <= diasNoMes; d++) {
      const data = new Date(ano, mes, d);
      data.setHours(0, 0, 0, 0);

      const isPassado = data <= hoje;
      const isDomingo = data.getDay() === 0;

      calendario.push({
        dia: d,
        dateStr: toISODate(data),
        desabilitado: isPassado || isDomingo,
      });
    }

    setDiasCalendario(calendario);
  }, []);

  const isDiaSelecionado = (cel: DiaCalendario) => {
    if (!cel.dateStr) return false;
    return datasRota.includes(cel.dateStr);
  };

  const onClickDia = (cel: DiaCalendario) => {
    if (!cel.dateStr || cel.desabilitado) return;

    const idx = datasRota.indexOf(cel.dateStr);
    if (idx >= 0) {
      setDatasRota((prev) => prev.filter((d) => d !== cel.dateStr));
    } else {
      setDatasRota((prev) => [...prev, cel.dateStr!].sort((a, b) => a.localeCompare(b)));
    }
  };

  const removerDataRota = (data: string) => {
    setDatasRota((prev) => prev.filter((d) => d !== data));
  };

  const formatarDataTag = (d: string) => {
    if (!d || d.length < 10) return d;
    const [, mes, dia] = d.split("-");
    return `${dia}/${mes}`;
  };

  const abrirNoGoogleMaps = async () => {
    if (!origem.trim() || !destino.trim()) {
      Alert.alert("Aviso", "Preencha partida e destino para abrir a rota.");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origem
    )}&destination=${encodeURIComponent(destino)}&travelmode=driving`;

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Erro", "Não foi possível abrir o Google Maps.");
      return;
    }

    Linking.openURL(url);
  };

  const textoDatas = useMemo(() => {
    if (datasRota.length === 0) return "Clique para escolher os dias";
    if (datasRota.length === 1) {
      return `Dia selecionado: ${formatarDataTag(datasRota[0])}`;
    }
    return `${datasRota.length} dias selecionados`;
  }, [datasRota]);

  const cadastrarRota = async () => {
    if (!origem.trim() || !destino.trim() || !entradaFatec.trim() || !saidaFatec.trim()) {
      Alert.alert("Aviso", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (!meuId) {
      Alert.alert("Erro", "Usuário não encontrado. Faça login novamente.");
      return;
    }

    try {
      setSalvando(true);

      const token = await AsyncStorage.getItem("token");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const dadosViagem = {
        tipoUsuario: tipoCarona === "oferecer" ? "motorista" : "passageiro",
        partida: origem,
        destino,
        horarioEntrada: entradaFatec,
        horarioSaida: saidaFatec,
        ajudaDeCusto: ajudaCusto?.trim() ? ajudaCusto : "0",
        idUsuario: meuId,
        datasAgendadas: datasRota,
      };

      const res = await fetch(`${baseURL}/viagem`, {
        method: "POST",
        headers,
        body: JSON.stringify(dadosViagem),
      });

      if (!res.ok) {
        throw new Error("Erro ao cadastrar rota");
      }

      Alert.alert("Sucesso", "Rota cadastrada com sucesso!");

      setOrigem("");
      setDestino("FATEC Votorantim");
      setEntradaFatec("");
      setSaidaFatec("");
      setAjudaCusto("");
      setDatasRota([]);
      setMostrarCalendario(false);
    } catch (error) {
      console.error("Erro ao cadastrar rota:", error);
      Alert.alert("Erro", "Não foi possível cadastrar a rota.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Planeje sua Carona</Text>
      <Text style={styles.pageSubtitle}>
        Cadastre uma rota para oferecer ou procurar carona.
      </Text>

      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            tipoCarona === "oferecer" && styles.switchButtonActive,
          ]}
          onPress={() => setTipoCarona("oferecer")}
        >
          <Text
            style={[
              styles.switchButtonText,
              tipoCarona === "oferecer" && styles.switchButtonTextActive,
            ]}
          >
            Oferecer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchButton,
            tipoCarona === "procurar" && styles.switchButtonActive,
          ]}
          onPress={() => setTipoCarona("procurar")}
        >
          <Text
            style={[
              styles.switchButtonText,
              tipoCarona === "procurar" && styles.switchButtonTextActive,
            ]}
          >
            Procurar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Partida</Text>
        <TextInput
          style={styles.input}
          value={origem}
          onChangeText={setOrigem}
          placeholder="Digite seu ponto de partida"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Destino</Text>
        <TextInput
          style={styles.input}
          value={destino}
          onChangeText={setDestino}
          placeholder="Selecione o destino"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Horário de Entrada na Fatec</Text>
        <TextInput
          style={styles.input}
          value={entradaFatec}
          onChangeText={setEntradaFatec}
          placeholder="Ex: 18:30"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Horário de Saída da Fatec</Text>
        <TextInput
          style={styles.input}
          value={saidaFatec}
          onChangeText={setSaidaFatec}
          placeholder="Ex: 22:40"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Ajuda Mensal</Text>
        <TextInput
          style={styles.input}
          value={ajudaCusto}
          onChangeText={setAjudaCusto}
          placeholder="Ajuda disponível (R$)"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Selecione os dias em que esta rota será válida</Text>

        <TouchableOpacity
          style={styles.calendarioTrigger}
          onPress={() => setMostrarCalendario((prev) => !prev)}
        >
          <Text style={styles.calendarioTriggerText}>{textoDatas}</Text>
          <Text style={styles.calendarioSeta}>
            {mostrarCalendario ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>

        {mostrarCalendario && (
          <View style={styles.calendarioPopup}>
            <Text style={styles.calendarioMes}>{mesAtualLabel}</Text>
            <Text style={styles.calendarioLegenda}>
              Domingos e dias passados ficam desativados.
            </Text>

            <View style={styles.calendarioGrid}>
              {["D", "S", "T", "Q", "Q", "S", "S"].map((dia) => (
                <Text key={dia} style={styles.weekday}>
                  {dia}
                </Text>
              ))}

              {diasCalendario.map((c, index) => (
                <TouchableOpacity
                  key={`${c.dateStr ?? "vazio"}-${index}`}
                  style={[
                    styles.diaButton,
                    !c.dateStr && styles.diaVazio,
                    isDiaSelecionado(c) && styles.diaSelecionado,
                    c.desabilitado && styles.diaDesabilitado,
                  ]}
                  disabled={c.desabilitado || !c.dateStr}
                  onPress={() => onClickDia(c)}
                >
                  <Text
                    style={[
                      styles.diaTexto,
                      isDiaSelecionado(c) && styles.diaTextoSelecionado,
                    ]}
                  >
                    {c.dia || ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {datasRota.length > 0 && (
          <View style={styles.tagsContainer}>
            {datasRota.map((d) => (
              <View key={d} style={styles.tag}>
                <Text style={styles.tagText}>{formatarDataTag(d)}</Text>
                <TouchableOpacity onPress={() => removerDataRota(d)}>
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, salvando && styles.buttonDisabled]}
          onPress={cadastrarRota}
          disabled={salvando}
        >
          <Text style={styles.primaryButtonText}>
            {salvando ? "Cadastrando..." : "Cadastrar Rota"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={abrirNoGoogleMaps}>
          <Text style={styles.secondaryButtonText}>Abrir rota no Google Maps</Text>
        </TouchableOpacity>
      </View>
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
  switchRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 10,
  },
  switchButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  switchButtonActive: {
    backgroundColor: "#0B1B35",
    borderColor: "#0B1B35",
  },
  switchButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  switchButtonTextActive: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  calendarioTrigger: {
    marginTop: 8,
    backgroundColor: "#0B1B35",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calendarioTriggerText: {
    color: "#E5E7EB",
    fontSize: 14,
  },
  calendarioSeta: {
    color: "#E5E7EB",
    fontSize: 12,
    marginLeft: 8,
  },
  calendarioPopup: {
    marginTop: 10,
    backgroundColor: "#0B1B35",
    borderRadius: 16,
    padding: 14,
  },
  calendarioMes: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  calendarioLegenda: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 12,
  },
  calendarioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  weekday: {
    width: "13%",
    textAlign: "center",
    color: "#9CA3AF",
    fontWeight: "700",
    marginBottom: 4,
  },
  diaButton: {
    width: "13%",
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  diaVazio: {
    opacity: 0,
  },
  diaSelecionado: {
    backgroundColor: "#2563EB",
  },
  diaDesabilitado: {
    opacity: 0.25,
  },
  diaTexto: {
    color: "#E5E7EB",
    fontSize: 13,
  },
  diaTextoSelecionado: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginRight: 6,
  },
  tagRemove: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0B1B35",
  },
  secondaryButtonText: {
    color: "#0B1B35",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});