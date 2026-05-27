import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../src/constants/api";

type DiaCalendario = {
  dia: number;
  dateStr: string | null;
  desabilitado: boolean;
};

type CalendarioMes = {
  key: string;
  label: string;
  dias: DiaCalendario[];
};

type ModoVigencia = "mensal" | "semestre";

function formatarHora(date: Date) {
  const horas = String(date.getHours()).padStart(2, "0");
  const minutos = String(date.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

function criarDataComHora(valor?: string) {
  const agora = new Date();

  if (!valor || !valor.includes(":")) {
    return agora;
  }

  const [h, m] = valor.split(":").map(Number);
  const data = new Date();
  data.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return data;
}

function parseDatasRotaParam(valor: unknown): string[] {
  if (!valor) return [];

  if (Array.isArray(valor)) {
    const primeira = valor[0];
    if (!primeira) return [];
    try {
      const parsed = JSON.parse(primeira);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function extrairOrigemECidade(partidaCompleta?: string) {
  const texto = (partidaCompleta || "").trim();

  if (!texto) {
    return {
      origem: "",
      cidade: "",
    };
  }

  const partes = texto.split(",").map((p) => p.trim()).filter(Boolean);

  if (partes.length >= 2) {
    return {
      origem: partes.slice(0, partes.length - 1).join(", "),
      cidade: partes[partes.length - 1],
    };
  }

  return {
    origem: texto,
    cidade: "",
  };
}

export default function MapaScreen() {
  const params = useLocalSearchParams();

  const [meuId, setMeuId] = useState<number | null>(null);

  const [tipoCarona, setTipoCarona] = useState<"oferecer" | "procurar">(
    "oferecer"
  );
  const [modoVigencia, setModoVigencia] = useState<ModoVigencia>("mensal");

  const [origem, setOrigem] = useState("");
  const [cidadePartida, setCidadePartida] = useState("");
  const [destino, setDestino] = useState("FATEC Votorantim");
  const [entradaFatec, setEntradaFatec] = useState("");
  const [saidaFatec, setSaidaFatec] = useState("");
  const [ajudaCusto, setAjudaCusto] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [datasRota, setDatasRota] = useState<string[]>([]);
  const [calendariosMensais, setCalendariosMensais] = useState<CalendarioMes[]>([]);

  const [mostrarPickerEntrada, setMostrarPickerEntrada] = useState(false);
  const [mostrarPickerSaida, setMostrarPickerSaida] = useState(false);
  const [horaEntradaTemp, setHoraEntradaTemp] = useState<Date>(new Date());
  const [horaSaidaTemp, setHoraSaidaTemp] = useState<Date>(new Date());

  const [modoEdicaoAtivo, setModoEdicaoAtivo] = useState(false);

  const ultimaSessaoEdicaoAplicadaRef = useRef<string>("");

  const idViagemEdicao = useMemo(() => {
    const valor = params?.idViagem;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.idViagem]);

  const editSession = useMemo(() => {
    const valor = params?.editSession;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.editSession]);

  const possuiParamsDeEdicao = useMemo(() => {
    const valor = params?.modo;
    const modo = Array.isArray(valor) ? valor[0] : valor;
    return modo === "editar" && !!idViagemEdicao && !!editSession;
  }, [params?.modo, idViagemEdicao, editSession]);

  const tipoCaronaParam = useMemo(() => {
    const valor = params?.tipoCarona;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.tipoCarona]);

  const origemParam = useMemo(() => {
    const valor = params?.origem;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.origem]);

  const destinoParam = useMemo(() => {
    const valor = params?.destino;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.destino]);

  const entradaParam = useMemo(() => {
    const valor = params?.entradaFatec;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.entradaFatec]);

  const saidaParam = useMemo(() => {
    const valor = params?.saidaFatec;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.saidaFatec]);

  const ajudaParam = useMemo(() => {
    const valor = params?.ajudaCusto;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.ajudaCusto]);

  const datasParam = useMemo(() => {
    const valor = params?.datasRota;
    if (Array.isArray(valor)) return valor[0] || "";
    return typeof valor === "string" ? valor : "";
  }, [params?.datasRota]);

  const toISODate = (d: Date) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

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

  const gerarCalendarioDeUmMes = useCallback((ano: number, mes: number) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

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

    return calendario;
  }, []);

  const gerarCalendariosMensais = useCallback(() => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const proximoMesDate = new Date(anoAtual, mesAtual + 1, 1);
    const anoProximoMes = proximoMesDate.getFullYear();
    const mesProximo = proximoMesDate.getMonth();

    const mesAtualObj: CalendarioMes = {
      key: `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`,
      label: `${nomesMes[mesAtual]} de ${anoAtual}`,
      dias: gerarCalendarioDeUmMes(anoAtual, mesAtual),
    };

    const proximoMesObj: CalendarioMes = {
      key: `${anoProximoMes}-${String(mesProximo + 1).padStart(2, "0")}`,
      label: `${nomesMes[mesProximo]} de ${anoProximoMes}`,
      dias: gerarCalendarioDeUmMes(anoProximoMes, mesProximo),
    };

    setCalendariosMensais([mesAtualObj, proximoMesObj]);
  }, [gerarCalendarioDeUmMes]);

  const resetarTelaParaCadastro = useCallback(() => {
    setModoEdicaoAtivo(false);
    setTipoCarona("oferecer");
    setModoVigencia("mensal");
    setOrigem("");
    setCidadePartida("");
    setDestino("FATEC Votorantim");
    setEntradaFatec("");
    setSaidaFatec("");
    setAjudaCusto("");
    setDatasRota([]);
    setMostrarCalendario(false);
    setMostrarPickerEntrada(false);
    setMostrarPickerSaida(false);
    setHoraEntradaTemp(new Date());
    setHoraSaidaTemp(new Date());
    gerarCalendariosMensais();
  }, [gerarCalendariosMensais]);

  const cancelarEdicao = useCallback(() => {
    ultimaSessaoEdicaoAplicadaRef.current = "";
    resetarTelaParaCadastro();
    router.replace("/(tabs)/sua-carona");
  }, [resetarTelaParaCadastro]);

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const usuarioLogadoStr = await AsyncStorage.getItem("usuarioLogado");

        if (!usuarioLogadoStr) {
          setMeuId(null);
          return;
        }

        const usuarioLogado = JSON.parse(usuarioLogadoStr);
        const id = usuarioLogado?.idUsuario || usuarioLogado?.id;

        if (!id) {
          setMeuId(null);
          return;
        }

        setMeuId(Number(id));
      } catch (error) {
        console.error("Erro ao carregar usuarioLogado:", error);
        setMeuId(null);
      }
    };

    carregarUsuario();
    gerarCalendariosMensais();
  }, [gerarCalendariosMensais]);

  useFocusEffect(
    useCallback(() => {
      if (
        possuiParamsDeEdicao &&
        editSession &&
        ultimaSessaoEdicaoAplicadaRef.current !== editSession
      ) {
        const { origem: origemExtraida, cidade: cidadeExtraida } =
          extrairOrigemECidade(origemParam);

        setModoEdicaoAtivo(true);

        if (tipoCaronaParam === "oferecer" || tipoCaronaParam === "procurar") {
          setTipoCarona(tipoCaronaParam);
        }

        setOrigem(origemExtraida);
        setCidadePartida(cidadeExtraida);
        setDestino(
          typeof destinoParam === "string" && destinoParam.trim()
            ? destinoParam
            : "FATEC Votorantim"
        );
        setEntradaFatec(typeof entradaParam === "string" ? entradaParam : "");
        setSaidaFatec(typeof saidaParam === "string" ? saidaParam : "");
        setAjudaCusto(typeof ajudaParam === "string" ? ajudaParam : "");

        const datasParseadas = parseDatasRotaParam(datasParam);
        setDatasRota(datasParseadas);
        setModoVigencia(datasParseadas.length >= 20 ? "semestre" : "mensal");

        ultimaSessaoEdicaoAplicadaRef.current = editSession;
      }

      return () => {};
    }, [
      possuiParamsDeEdicao,
      editSession,
      tipoCaronaParam,
      origemParam,
      destinoParam,
      entradaParam,
      saidaParam,
      ajudaParam,
      datasParam,
    ])
  );

  const gerarDatasDoSemestreAtual = useCallback(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const ano = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const primeiroSemestre = mesAtual <= 5;

    const inicioSemestre = primeiroSemestre
      ? new Date(ano, 0, 1)
      : new Date(ano, 6, 1);

    const fimSemestre = primeiroSemestre
      ? new Date(ano, 5, 30)
      : new Date(ano, 11, 31);

    inicioSemestre.setHours(0, 0, 0, 0);
    fimSemestre.setHours(0, 0, 0, 0);

    const datas: string[] = [];
    const dataAtual = new Date(inicioSemestre);

    while (dataAtual <= fimSemestre) {
      const diaSemana = dataAtual.getDay();
      const naoEhDomingo = diaSemana !== 0;
      const naoEhPassado = dataAtual >= hoje;

      if (naoEhDomingo && naoEhPassado) {
        datas.push(toISODate(dataAtual));
      }

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return datas;
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
      setDatasRota((prev) =>
        [...prev, cel.dateStr as string].sort((a, b) => a.localeCompare(b))
      );
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

  const textoDatas = useMemo(() => {
    if (datasRota.length === 0) return "Clique para escolher os dias";
    if (datasRota.length === 1) {
      return `Dia selecionado: ${formatarDataTag(datasRota[0])}`;
    }
    return `${datasRota.length} dias selecionados`;
  }, [datasRota]);

  const resumoSemestre = useMemo(() => {
    const datas = gerarDatasDoSemestreAtual();
    if (!datas.length) return "Nenhuma data futura encontrada para este semestre.";

    const primeira = formatarDataTag(datas[0]);
    const ultima = formatarDataTag(datas[datas.length - 1]);

    return `${datas.length} datas serão geradas automaticamente, de ${primeira} até ${ultima}, considerando segunda a sábado e excluindo domingos.`;
  }, [gerarDatasDoSemestreAtual]);

  const abrirPickerEntrada = () => {
    setHoraEntradaTemp(criarDataComHora(entradaFatec));
    setMostrarPickerEntrada(true);
  };

  const abrirPickerSaida = () => {
    setHoraSaidaTemp(criarDataComHora(saidaFatec));
    setMostrarPickerSaida(true);
  };

  const onChangeHoraEntrada = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setMostrarPickerEntrada(false);
    }

    if (selectedDate) {
      setHoraEntradaTemp(selectedDate);
      if (Platform.OS === "android") {
        setEntradaFatec(formatarHora(selectedDate));
      }
    }
  };

  const onChangeHoraSaida = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setMostrarPickerSaida(false);
    }

    if (selectedDate) {
      setHoraSaidaTemp(selectedDate);
      if (Platform.OS === "android") {
        setSaidaFatec(formatarHora(selectedDate));
      }
    }
  };

  const confirmarHoraEntradaIOS = () => {
    setEntradaFatec(formatarHora(horaEntradaTemp));
    setMostrarPickerEntrada(false);
  };

  const confirmarHoraSaidaIOS = () => {
    setSaidaFatec(formatarHora(horaSaidaTemp));
    setMostrarPickerSaida(false);
  };

  const montarPartidaCompleta = () => {
    const origemLimpa = origem.trim();
    const cidadeLimpa = cidadePartida.trim();

    if (origemLimpa && cidadeLimpa) {
      return `${origemLimpa}, ${cidadeLimpa}`;
    }

    return origemLimpa || cidadeLimpa;
  };

  const salvarOuCadastrarRota = async () => {
    if (
      !origem.trim() ||
      !cidadePartida.trim() ||
      !destino.trim() ||
      !entradaFatec.trim() ||
      !saidaFatec.trim()
    ) {
      Alert.alert("Aviso", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (!meuId) {
      Alert.alert("Erro", "Usuário não encontrado. Faça login novamente.");
      return;
    }

    const datasParaEnviar =
      modoVigencia === "semestre" ? gerarDatasDoSemestreAtual() : datasRota;

    if (!datasParaEnviar.length) {
      Alert.alert(
        "Aviso",
        modoVigencia === "semestre"
          ? "Não foi possível gerar datas para o semestre atual."
          : "Selecione pelo menos um dia para que esta rota seja válida."
      );
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
        partida: montarPartidaCompleta(),
        destino: destino.trim(),
        horarioEntrada: entradaFatec,
        horarioSaida: saidaFatec,
        ajudaDeCusto: ajudaCusto.trim() ? ajudaCusto.trim() : "0",
        idUsuario: meuId,
        datasAgendadas: datasParaEnviar,
      };

      const url =
        modoEdicaoAtivo && idViagemEdicao
          ? `${API_URL}/viagem/${idViagemEdicao}`
          : `${API_URL}/viagem`;

      const method = modoEdicaoAtivo && idViagemEdicao ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(dadosViagem),
      });

      if (!res.ok) {
        throw new Error(
          modoEdicaoAtivo ? "Erro ao atualizar rota" : "Erro ao cadastrar rota"
        );
      }

      Alert.alert(
        "Sucesso",
        modoEdicaoAtivo
          ? "Rota atualizada com sucesso!"
          : "Rota cadastrada com sucesso!"
      );

      resetarTelaParaCadastro();
      router.replace("/(tabs)/sua-carona");
    } catch (error) {
      console.error(
        modoEdicaoAtivo ? "Erro ao atualizar rota:" : "Erro ao cadastrar rota:",
        error
      );
      Alert.alert(
        "Erro",
        modoEdicaoAtivo
          ? "Não foi possível atualizar a rota."
          : "Não foi possível cadastrar a rota."
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
          {modoEdicaoAtivo ? "Editar sua Carona" : "Planeje sua Carona"}
        </Text>
        <Text style={styles.pageSubtitle}>
          {modoEdicaoAtivo
            ? "Atualize os dados da sua rota cadastrada."
            : "Cadastre uma rota para oferecer ou procurar carona."}
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
            placeholder="Digite sua rua, avenida ou bairro"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Cidade da partida</Text>
          <TextInput
            style={styles.input}
            value={cidadePartida}
            onChangeText={setCidadePartida}
            placeholder="Digite sua cidade"
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
          <TouchableOpacity
            style={styles.timeInputButton}
            onPress={abrirPickerEntrada}
            activeOpacity={0.85}
          >
            <Text
              style={
                entradaFatec ? styles.timeInputText : styles.timePlaceholderText
              }
            >
              {entradaFatec || "--:--"}
            </Text>
            <Text style={styles.timeIcon}>◔</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Horário de Saída da Fatec</Text>
          <TouchableOpacity
            style={styles.timeInputButton}
            onPress={abrirPickerSaida}
            activeOpacity={0.85}
          >
            <Text
              style={
                saidaFatec ? styles.timeInputText : styles.timePlaceholderText
              }
            >
              {saidaFatec || "--:--"}
            </Text>
            <Text style={styles.timeIcon}>◔</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Ajuda Mensal</Text>
          <TextInput
            style={styles.input}
            value={ajudaCusto}
            onChangeText={setAjudaCusto}
            placeholder="Ajuda disponível (R$)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Vigência da rota</Text>

          <View style={styles.switchRow}>
            <TouchableOpacity
              style={[
                styles.switchButton,
                modoVigencia === "mensal" && styles.switchButtonActive,
              ]}
              onPress={() => {
                setModoVigencia("mensal");
              }}
            >
              <Text
                style={[
                  styles.switchButtonText,
                  modoVigencia === "mensal" && styles.switchButtonTextActive,
                ]}
              >
                Mensal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switchButton,
                modoVigencia === "semestre" && styles.switchButtonActive,
              ]}
              onPress={() => {
                setModoVigencia("semestre");
                setMostrarCalendario(false);
              }}
            >
              <Text
                style={[
                  styles.switchButtonText,
                  modoVigencia === "semestre" && styles.switchButtonTextActive,
                ]}
              >
                Fechar semestre
              </Text>
            </TouchableOpacity>
          </View>

          {modoVigencia === "mensal" ? (
            <>
              <Text style={styles.label}>
                Selecione os dias em que esta rota será válida
              </Text>

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
                  <View style={styles.calendarioHeader}>
                    <Text style={styles.calendarioMesPrincipal}>
                      Selecione os dias da rota
                    </Text>
                    <Text style={styles.calendarioLegenda}>
                      Domingos e dias passados ficam desativados. Para facilitar
                      o cadastro no fim do mês, o próximo mês também fica
                      disponível.
                    </Text>
                  </View>

                  {calendariosMensais.map((mesObj) => (
                    <View key={mesObj.key} style={styles.mesBloco}>
                      <Text style={styles.calendarioMes}>{mesObj.label}</Text>

                      <View style={styles.weekHeaderRow}>
                        {["D", "S", "T", "Q", "Q", "S", "S"].map(
                          (dia, index) => (
                            <Text
                              key={`${mesObj.key}-${dia}-${index}`}
                              style={styles.weekday}
                            >
                              {dia}
                            </Text>
                          )
                        )}
                      </View>

                      <View style={styles.calendarioGrid}>
                        {mesObj.dias.map((c, index) => (
                          <TouchableOpacity
                            key={`${mesObj.key}-${c.dateStr ?? "vazio"}-${index}`}
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
                                isDiaSelecionado(c) &&
                                  styles.diaTextoSelecionado,
                                c.desabilitado && styles.diaTextoDesabilitado,
                              ]}
                            >
                              {c.dia || ""}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
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
            </>
          ) : (
            <View style={styles.infoSemestreBox}>
              <Text style={styles.infoSemestreTitle}>Fechamento semestral</Text>
              <Text style={styles.infoSemestreText}>{resumoSemestre}</Text>
            </View>
          )}

          {modoEdicaoAtivo && (
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={cancelarEdicao}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelEditButtonText}>Cancelar edição</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, salvando && styles.buttonDisabled]}
            onPress={salvarOuCadastrarRota}
            disabled={salvando}
          >
            <Text style={styles.primaryButtonText}>
              {salvando
                ? modoEdicaoAtivo
                  ? "Salvando..."
                  : "Cadastrando..."
                : modoEdicaoAtivo
                  ? "Salvar Alterações"
                  : "Cadastrar Rota"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {mostrarPickerEntrada && Platform.OS === "android" && (
        <DateTimePicker
          value={horaEntradaTemp}
          mode="time"
          is24Hour
          display="default"
          onChange={onChangeHoraEntrada}
        />
      )}

      {mostrarPickerSaida && Platform.OS === "android" && (
        <DateTimePicker
          value={horaSaidaTemp}
          mode="time"
          is24Hour
          display="default"
          onChange={onChangeHoraSaida}
        />
      )}

      <Modal
        visible={mostrarPickerEntrada && Platform.OS === "ios"}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setMostrarPickerEntrada(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Horário de Entrada</Text>

              <TouchableOpacity onPress={confirmarHoraEntradaIOS}>
                <Text style={styles.modalConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={horaEntradaTemp}
              mode="time"
              is24Hour
              display="spinner"
              onChange={onChangeHoraEntrada}
              style={styles.iosPicker}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={mostrarPickerSaida && Platform.OS === "ios"}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setMostrarPickerSaida(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Horário de Saída</Text>

              <TouchableOpacity onPress={confirmarHoraSaidaIOS}>
                <Text style={styles.modalConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={horaSaidaTemp}
              mode="time"
              is24Hour
              display="spinner"
              onChange={onChangeHoraSaida}
              style={styles.iosPicker}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
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
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 10,
  },
  switchButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  switchButtonActive: {
    backgroundColor: "#06264A",
    borderColor: "#06264A",
  },
  switchButtonText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 15,
  },
  switchButtonTextActive: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },
  timeInputButton: {
    minHeight: 54,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeInputText: {
    fontSize: 15,
    color: "#111827",
  },
  timePlaceholderText: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  timeIcon: {
    fontSize: 14,
    color: "#111827",
  },
  calendarioTrigger: {
    marginTop: 8,
    backgroundColor: "#06264A",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calendarioTriggerText: {
    color: "#E5E7EB",
    fontSize: 14,
    flex: 1,
    paddingRight: 10,
  },
  calendarioSeta: {
    color: "#E5E7EB",
    fontSize: 12,
    marginLeft: 8,
  },
  calendarioPopup: {
    marginTop: 10,
    backgroundColor: "#06264A",
    borderRadius: 16,
    padding: 14,
  },
  calendarioHeader: {
    marginBottom: 8,
  },
  calendarioMesPrincipal: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 16,
  },
  mesBloco: {
    marginTop: 12,
  },
  calendarioMes: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "capitalize",
    fontSize: 15,
  },
  calendarioLegenda: {
    color: "#C7D2E0",
    fontSize: 12,
    lineHeight: 18,
  },
  weekHeaderRow: {
    flexDirection: "row",
  },
  weekday: {
    width: "14.2857%",
    textAlign: "center",
    color: "#C7D2E0",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 6,
  },
  calendarioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  diaButton: {
    width: "14.2857%",
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0C345F",
    marginBottom: 6,
  },
  diaVazio: {
    backgroundColor: "transparent",
  },
  diaSelecionado: {
    backgroundColor: "#2563EB",
  },
  diaDesabilitado: {
    backgroundColor: "#0A2748",
    opacity: 0.45,
  },
  diaTexto: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  diaTextoSelecionado: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  diaTextoDesabilitado: {
    color: "#AAB7C7",
  },
  tagsContainer: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3367E8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  tagRemove: {
    color: "#EAF1FF",
    fontSize: 14,
    fontWeight: "700",
  },
  infoSemestreBox: {
    marginTop: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 14,
  },
  infoSemestreTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 6,
  },
  infoSemestreText: {
    fontSize: 13,
    color: "#1F2937",
    lineHeight: 20,
  },
  cancelEditButton: {
    marginTop: 18,
    marginBottom: -6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DC2626",
  },
  cancelEditButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#3367E8",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 24,
  },
  modalHeader: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCancel: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },
  modalTitle: {
    color: "#0B1B35",
    fontSize: 16,
    fontWeight: "700",
  },
  modalConfirm: {
    color: "#3367E8",
    fontSize: 15,
    fontWeight: "700",
  },
  iosPicker: {
    height: 220,
  },
});