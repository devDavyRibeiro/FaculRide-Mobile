import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../src/constants/api";

type TipoUsuario = "passageiro" | "motorista";

type ErrosSenhaType = {
  senhaAtual?: string;
  novaSenha?: string;
  confirmarSenha?: string;
};

type TouchedSenhaType = {
  senhaAtual?: boolean;
  novaSenha?: boolean;
  confirmarSenha?: boolean;
};

export default function GerenciarContaScreen() {
  const [usuario, setUsuario] = useState<any>(null);

  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>("passageiro");

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [fatec, setFatec] = useState("");
  const [ra, setRa] = useState("");
  const [genero, setGenero] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const [cnh, setCnh] = useState("");
  const [modeloCarro, setModeloCarro] = useState("");
  const [anoCarro, setAnoCarro] = useState("");
  const [corCarro, setCorCarro] = useState("");
  const [placa, setPlaca] = useState("");

  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [errosSenha, setErrosSenha] = useState<ErrosSenhaType>({});
  const [touchedSenha, setTouchedSenha] = useState<TouchedSenhaType>({});

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(
    new Date(2000, 0, 1)
  );

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const fatecOptions = ["FATEC Votorantim"];
  const generoOptions = ["Masculino", "Feminino"];

  const anosCarro = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => String(anoAtual - i));
  }, []);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
  try {
    const token = await AsyncStorage.getItem("token");
    const usuarioSalvo1 = await AsyncStorage.getItem("usuarioLogado");
    const usuarioSalvo2 = await AsyncStorage.getItem("usuario");
    const usuarioString = usuarioSalvo1 || usuarioSalvo2;

    if (!usuarioString) return;

    const usuarioLocal = JSON.parse(usuarioString);
    const idUsuario =
      usuarioLocal?.idUsuario ??
      usuarioLocal?.id ??
      usuarioLocal?.id_usuario;

    let u = usuarioLocal;

    // Busca dados atualizados do backend
    if (token && idUsuario) {
      try {
        const response = await fetch(`${API_URL}/usuario/${idUsuario}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const usuarioBackend = await response.json();

          // mantém a estrutura local com veiculo e demais campos atualizados
          u = {
            ...usuarioLocal,
            ...usuarioBackend,
            id: usuarioBackend?.id ?? usuarioLocal?.id ?? idUsuario,
            idUsuario:
              usuarioBackend?.idUsuario ??
              usuarioBackend?.id ??
              usuarioLocal?.idUsuario ??
              usuarioLocal?.id ??
              idUsuario,
          };

          setUsuario(u);
          await AsyncStorage.setItem("usuario", JSON.stringify(u));
          await AsyncStorage.setItem("usuarioLogado", JSON.stringify(u));
        } else {
          setUsuario(u);
        }
      } catch (err) {
        console.error("Erro ao buscar usuário atualizado no backend:", err);
        setUsuario(u);
      }
    } else {
      setUsuario(u);
    }

    const veiculo = u?.veiculo || u?.Veiculo || {};

    setNome(u?.nome || "");
    setCpf(formatarCPF(u?.cpf || ""));
    setEmail(u?.email || "");
    setTelefone(formatarTelefone(u?.telefone || ""));
    setCep(formatarCEP(u?.cep || ""));
    setEndereco(u?.endereco || "");
    setNumero(String(u?.numero || ""));
    setCidade(u?.cidade || "");
    setEstado((u?.estado || "").toUpperCase());
    setFatec(u?.fatec || "");
    setRa(String(u?.ra || ""));
    setGenero(
      u?.genero === true
        ? "Masculino"
        : u?.genero === false
        ? "Feminino"
        : ""
    );

    if (u?.dataNascimento) {
      if (String(u.dataNascimento).includes("-")) {
        setDataNascimento(formatarDataApiParaTela(u.dataNascimento));
      } else {
        setDataNascimento(u.dataNascimento);
      }
    }

    setCnh(formatarCNH(u?.cnh || ""));
    setModeloCarro(veiculo?.Modelo || veiculo?.modelo || "");
    setAnoCarro(
      veiculo?.Ano
        ? String(veiculo.Ano)
        : veiculo?.ano
        ? String(veiculo.ano)
        : ""
    );
    setCorCarro(veiculo?.Cor || veiculo?.cor || "");
    setPlaca(formatarPlaca(veiculo?.Placa_veiculo || veiculo?.placa || ""));

    const ehMotorista =
      u?.tipoUsuario === "motorista" ||
      !!u?.cnh ||
      !!veiculo?.Modelo ||
      !!veiculo?.modelo;

    setTipoUsuario(ehMotorista ? "motorista" : "passageiro");

    if (u?.foto || u?.fotoUrl) {
      setFotoUri(u.foto || u.fotoUrl);
    }
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
  }
}

  function limparNumero(valor: string) {
    return String(valor || "").replace(/\D/g, "");
  }

  function formatarCPF(valor: string) {
    const v = limparNumero(valor).slice(0, 11);
    return v
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  function formatarTelefone(valor: string) {
    const v = limparNumero(valor).slice(0, 11);

    if (v.length <= 10) {
      return v
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return v
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function formatarCEP(valor: string) {
    const v = limparNumero(valor).slice(0, 8);
    return v.replace(/^(\d{5})(\d)/, "$1-$2");
  }

  function formatarCNH(valor: string) {
    return limparNumero(valor).slice(0, 11);
  }

  function formatarPlaca(valor: string) {
    return String(valor || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 7);
  }

  function formatarDataDate(date: Date) {
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  function formatarDataApiParaTela(valor: string) {
    const [ano, mes, dia] = String(valor).split("T")[0].split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function converterTextoParaData(valor: string) {
    const partes = valor.split("/");
    if (partes.length !== 3) return null;

    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const ano = Number(partes[2]);

    if (!dia || !mes || !ano) return null;

    const data = new Date(ano, mes - 1, dia);

    if (
      data.getFullYear() !== ano ||
      data.getMonth() !== mes - 1 ||
      data.getDate() !== dia
    ) {
      return null;
    }

    return data;
  }

  function converterDataParaBackend(valor: string) {
    const data = converterTextoParaData(valor);
    if (!data) return "";
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function converterGeneroParaBackend(valor: string) {
    if (valor === "Masculino") return true;
    if (valor === "Feminino") return false;
    return null;
  }

  function validarSenhaForte(valor: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(
      valor
    );
  }

  function getErroSenhaCampo(
    campo: "senhaAtual" | "novaSenha" | "confirmarSenha",
    valor: string
  ) {
    switch (campo) {
      case "senhaAtual":
        if (!valor?.trim()) return "Digite sua senha atual.";
        return "";

      case "novaSenha":
        if (!valor?.trim()) return "Digite a nova senha.";
        if (!validarSenhaForte(valor)) {
          return "A nova senha deve ter no mínimo 6 caracteres, 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.";
        }
        return "";

      case "confirmarSenha":
        if (!valor?.trim()) return "Confirme a nova senha.";
        if (valor !== novaSenha) return "As senhas não coincidem.";
        return "";

      default:
        return "";
    }
  }

  function marcarSenhaComoTocada(
    campo: "senhaAtual" | "novaSenha" | "confirmarSenha"
  ) {
    setTouchedSenha((prev) => ({ ...prev, [campo]: true }));
  }

  function validarCampoSenhaTempoReal(
    campo: "senhaAtual" | "novaSenha" | "confirmarSenha",
    valor: string
  ) {
    const mensagem = getErroSenhaCampo(campo, valor);
    setErrosSenha((prev) => ({
      ...prev,
      [campo]: mensagem || undefined,
    }));
  }

  function renderErroSenha(
    campo: "senhaAtual" | "novaSenha" | "confirmarSenha"
  ) {
    if (!errosSenha[campo]) return null;
    return <Text style={styles.errorText}>{errosSenha[campo]}</Text>;
  }

  function getVeiculoId(veiculo: any) {
    return (
      veiculo?.ID_veiculo ??
      veiculo?.idVeiculo ??
      veiculo?.id_veiculo ??
      veiculo?.id ??
      null
    );
  }

  function normalizarVeiculoLocal(
    veiculo: any,
    fallbackIdUsuario?: number | string
  ) {
    if (!veiculo) return null;

    return {
      ...(veiculo || {}),
      ID_veiculo:
        veiculo?.ID_veiculo ??
        veiculo?.idVeiculo ??
        veiculo?.id_veiculo ??
        veiculo?.id ??
        null,
      idUsuario:
        veiculo?.idUsuario ??
        veiculo?.IdUsuario ??
        fallbackIdUsuario ??
        null,
      Modelo: veiculo?.Modelo ?? veiculo?.modelo ?? "",
      Ano:
        veiculo?.Ano !== undefined && veiculo?.Ano !== null
          ? veiculo.Ano
          : veiculo?.ano !== undefined && veiculo?.ano !== null
          ? veiculo.ano
          : null,
      Cor: veiculo?.Cor ?? veiculo?.cor ?? "",
      Placa_veiculo: veiculo?.Placa_veiculo ?? veiculo?.placa ?? "",
    };
  }

  async function buscarCep(valorCep: string) {
    const cepLimpo = limparNumero(valorCep);
    if (cepLimpo.length !== 8) return;

    try {
      setBuscandoCep(true);

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        Alert.alert("CEP inválido", "Não foi possível localizar esse CEP.");
        return;
      }

      setEndereco(data.logradouro || "");
      setCidade(data.localidade || "");
      setEstado(data.uf || "");
    } catch {
      Alert.alert("Erro", "Não foi possível buscar o CEP no momento.");
    } finally {
      setBuscandoCep(false);
    }
  }

  async function escolherFoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso à galeria para selecionar uma foto."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setFotoUri(asset.uri);
    setFotoBase64(asset.base64 ?? null);
  }

  async function uploadFoto(token: string) {
    if (!fotoBase64) return;

    await fetch(`${API_URL}/usuario/foto/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imagemBase64: fotoBase64,
      }),
    });
  }

  async function removerVeiculo() {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Erro", "Token não encontrado.");
        return;
      }

      const idVeiculo =
        usuario?.veiculo?.ID_veiculo ??
        usuario?.veiculo?.idVeiculo ??
        usuario?.veiculo?.id_veiculo ??
        usuario?.veiculo?.id;

      if (!idVeiculo) {
        Alert.alert("Aviso", "Nenhum veículo encontrado.");
        return;
      }

      Alert.alert(
        "Remover veículo",
        "Tem certeza que deseja remover seu veículo?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            style: "destructive",
            onPress: async () => {
              const response = await fetch(
                `${API_URL}/veiculo/${idVeiculo}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!response.ok) {
                throw new Error("Erro ao remover veículo");
              }

              setModeloCarro("");
              setAnoCarro("");
              setCorCarro("");
              setPlaca("");

              const usuarioAtualizado = {
                ...usuario,
                veiculo: null,
              };

              setUsuario(usuarioAtualizado);
              await AsyncStorage.setItem(
                "usuario",
                JSON.stringify(usuarioAtualizado)
              );
              await AsyncStorage.setItem(
                "usuarioLogado",
                JSON.stringify(usuarioAtualizado)
              );

              Alert.alert("Sucesso", "Veículo removido com sucesso.");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", error.message || "Erro ao remover veículo");
    }
  }

  async function salvarDados() {
    if (!nome.trim() || !email.trim()) {
      Alert.alert("Aviso", "Preencha ao menos nome e e-mail.");
      return;
    }

    try {
      setSalvandoDados(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Erro", "Token não encontrado.");
        return;
      }

      const id = usuario?.idUsuario ?? usuario?.id ?? usuario?.id_usuario;

      if (!id) {
        Alert.alert("Erro", "ID do usuário não encontrado.");
        return;
      }

      const payloadUsuario: Record<string, any> = {
        tipoUsuario,
        nome: nome.trim(),
        cpf: limparNumero(cpf),
        email: email.trim().toLowerCase(),
        telefone: limparNumero(telefone),
        cep: limparNumero(cep),
        endereco: endereco.trim(),
        numero: numero.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        fatec: fatec.trim(),
        ra: limparNumero(ra),
        genero: converterGeneroParaBackend(genero),
        dataNascimento: converterDataParaBackend(dataNascimento),
        cnh: tipoUsuario === "motorista" ? limparNumero(cnh) : null,
      };

      const responseUsuario = await fetch(`${API_URL}/usuario/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadUsuario),
      });

      const responseUsuarioText = await responseUsuario.text();

      let dataUsuario: any = {};
      try {
        dataUsuario = responseUsuarioText ? JSON.parse(responseUsuarioText) : {};
      } catch {
        dataUsuario = { raw: responseUsuarioText };
      }

      if (!responseUsuario.ok) {
        throw new Error(
          dataUsuario?.message ||
            dataUsuario?.erro ||
            dataUsuario?.error ||
            dataUsuario?.raw ||
            "Não foi possível atualizar os dados."
        );
      }

      let veiculoAtualizado = normalizarVeiculoLocal(usuario?.veiculo, id);

      if (tipoUsuario === "motorista") {
        const payloadVeiculo = {
          Modelo: modeloCarro.trim(),
          Ano: anoCarro ? Number(anoCarro) : null,
          Cor: corCarro.trim(),
          Placa_veiculo: placa.trim().toUpperCase(),
          idUsuario: id,
        };

        const idVeiculo = getVeiculoId(usuario?.veiculo);

        if (idVeiculo) {
          const responseVeiculo = await fetch(
            `${API_URL}/veiculo/${idVeiculo}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payloadVeiculo),
            }
          );

          const responseVeiculoText = await responseVeiculo.text();

          let dataVeiculo: any = {};
          try {
            dataVeiculo = responseVeiculoText
              ? JSON.parse(responseVeiculoText)
              : {};
          } catch {
            dataVeiculo = { raw: responseVeiculoText };
          }

          if (!responseVeiculo.ok) {
            throw new Error(
              dataVeiculo?.message ||
                dataVeiculo?.erro ||
                dataVeiculo?.error ||
                dataVeiculo?.raw ||
                "Não foi possível atualizar o veículo."
            );
          }

          veiculoAtualizado = normalizarVeiculoLocal(
            {
              ...(usuario?.veiculo || {}),
              ...payloadVeiculo,
              ...(typeof dataVeiculo === "object" ? dataVeiculo : {}),
              ID_veiculo: idVeiculo,
            },
            id
          );
        } else if (
          payloadVeiculo.Modelo ||
          payloadVeiculo.Ano ||
          payloadVeiculo.Cor ||
          payloadVeiculo.Placa_veiculo
        ) {
          const responseVeiculo = await fetch(`${API_URL}/veiculo`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payloadVeiculo),
          });

          const responseVeiculoText = await responseVeiculo.text();

          let dataVeiculo: any = {};
          try {
            dataVeiculo = responseVeiculoText
              ? JSON.parse(responseVeiculoText)
              : {};
          } catch {
            dataVeiculo = { raw: responseVeiculoText };
          }

          if (!responseVeiculo.ok) {
            throw new Error(
              dataVeiculo?.message ||
                dataVeiculo?.erro ||
                dataVeiculo?.error ||
                dataVeiculo?.raw ||
                "Não foi possível cadastrar o veículo."
            );
          }

          veiculoAtualizado = normalizarVeiculoLocal(dataVeiculo, id);
        }
      } else {
        veiculoAtualizado = null;
      }

      try {
        await uploadFoto(token);
      } catch {
        // não bloqueia atualização se a foto falhar
      }

      const usuarioAtualizado = {
        ...usuario,
        ...payloadUsuario,
        idUsuario: usuario?.idUsuario ?? usuario?.id ?? id,
        veiculo: veiculoAtualizado,
        foto: fotoUri || usuario?.foto || null,
        fotoUrl: fotoUri || usuario?.fotoUrl || null,
      };

      setUsuario(usuarioAtualizado);
      await AsyncStorage.setItem("usuario", JSON.stringify(usuarioAtualizado));
      await AsyncStorage.setItem(
        "usuarioLogado",
        JSON.stringify(usuarioAtualizado)
      );

      setCnh(payloadUsuario.cnh ? formatarCNH(payloadUsuario.cnh) : "");
      setModeloCarro(veiculoAtualizado?.Modelo || "");
      setAnoCarro(
        veiculoAtualizado?.Ano !== undefined && veiculoAtualizado?.Ano !== null
          ? String(veiculoAtualizado.Ano)
          : ""
      );
      setCorCarro(veiculoAtualizado?.Cor || "");
      setPlaca(formatarPlaca(veiculoAtualizado?.Placa_veiculo || ""));

      Alert.alert("Sucesso", "Dados atualizados com sucesso.");
    } catch (error: any) {
      console.error("Erro ao atualizar dados:", error);
      Alert.alert("Erro", error?.message || "Não foi possível atualizar os dados.");
    } finally {
      setSalvandoDados(false);
    }
  }

  async function alterarSenha() {
    const erroSenhaAtual = getErroSenhaCampo("senhaAtual", senhaAtual);
    const erroNovaSenha = getErroSenhaCampo("novaSenha", novaSenha);
    const erroConfirmarSenha = getErroSenhaCampo(
      "confirmarSenha",
      confirmarSenha
    );

    setTouchedSenha({
      senhaAtual: true,
      novaSenha: true,
      confirmarSenha: true,
    });

    setErrosSenha({
      senhaAtual: erroSenhaAtual || undefined,
      novaSenha: erroNovaSenha || undefined,
      confirmarSenha: erroConfirmarSenha || undefined,
    });

    if (erroSenhaAtual || erroNovaSenha || erroConfirmarSenha) {
      Alert.alert("Aviso", "Corrija os campos de senha antes de continuar.");
      return;
    }

    try {
      setSalvandoSenha(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Erro", "Token não encontrado.");
        return;
      }

      const response = await fetch(`${API_URL}/usuario/alterar-senha`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
          confirmarSenha,
        }),
      });

      const responseText = await response.text();

      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { raw: responseText };
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.erro ||
            data?.error ||
            data?.raw ||
            "Não foi possível alterar a senha."
        );
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setErrosSenha({});
      setTouchedSenha({});
      setMostrarSenhaAtual(false);
      setMostrarNovaSenha(false);
      setMostrarConfirmarSenha(false);

      Alert.alert("Sucesso", "Senha alterada com sucesso.");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      Alert.alert("Erro", error?.message || "Não foi possível alterar a senha.");
    } finally {
      setSalvandoSenha(false);
    }
  }

  function onChangeDate(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setMostrarDatePicker(false);
    }

    if (!selectedDate) return;

    setDataSelecionada(selectedDate);
    setDataNascimento(formatarDataDate(selectedDate));
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Gerenciar Conta</Text>
        <Text style={styles.subtitle}>
          Atualize suas informações pessoais, veículo e segurança.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Foto de perfil</Text>

          <TouchableOpacity style={styles.photoButton} onPress={escolherFoto}>
            <Text style={styles.photoButtonText}>
              {fotoUri ? "Trocar foto" : "Selecionar foto"}
            </Text>
          </TouchableOpacity>

          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.photoPreview} />
          ) : (
            <Image
              source={require("../assets/images/usuario.png")}
              style={styles.photoPreview}
            />
          )}

          <Text style={styles.sectionTitle}>Tipo de usuário</Text>

          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                tipoUsuario === "passageiro" && styles.segmentButtonActive,
              ]}
              onPress={() => setTipoUsuario("passageiro")}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  tipoUsuario === "passageiro" && styles.segmentButtonTextActive,
                ]}
              >
                Passageiro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                tipoUsuario === "motorista" && styles.segmentButtonActive,
              ]}
              onPress={() => setTipoUsuario("motorista")}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  tipoUsuario === "motorista" && styles.segmentButtonTextActive,
                ]}
              >
                Motorista
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Dados pessoais</Text>

          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite seu nome completo"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            value={cpf}
            onChangeText={(text) => setCpf(formatarCPF(text))}
            placeholder="000.000.000-00"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={telefone}
            onChangeText={(text) => setTelefone(formatarTelefone(text))}
            placeholder="(15) 99999-9999"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>CEP</Text>
          <TextInput
            style={styles.input}
            value={cep}
            onChangeText={(text) => {
              const valor = formatarCEP(text);
              setCep(valor);
              if (limparNumero(valor).length === 8) {
                buscarCep(valor);
              }
            }}
            placeholder="00000-000"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />
          {buscandoCep ? (
            <ActivityIndicator size="small" style={styles.cepLoader} />
          ) : null}

          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={styles.input}
            value={endereco}
            onChangeText={setEndereco}
            placeholder="Rua, avenida..."
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Número</Text>
          <TextInput
            style={styles.input}
            value={numero}
            onChangeText={setNumero}
            placeholder="Número"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            value={cidade}
            onChangeText={setCidade}
            placeholder="Cidade"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Estado</Text>
          <TextInput
            style={styles.input}
            value={estado}
            onChangeText={(text) => setEstado(text.toUpperCase().slice(0, 2))}
            placeholder="UF"
            placeholderTextColor="#94A3B8"
            maxLength={2}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Sua Fatec</Text>
          <View style={styles.selectWrapper}>
            <Picker
              selectedValue={fatec}
              onValueChange={(value) => setFatec(value)}
              style={styles.picker}
              dropdownIconColor="#0F172A"
            >
              <Picker.Item label="Selecione" value="" color="#64748B" />
              {fatecOptions.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>RA</Text>
          <TextInput
            style={styles.input}
            value={ra}
            onChangeText={setRa}
            placeholder="Digite seu RA"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Gênero</Text>
          <View style={styles.selectWrapper}>
            <Picker
              selectedValue={genero}
              onValueChange={(value) => setGenero(value)}
              style={styles.picker}
              dropdownIconColor="#0F172A"
            >
              <Picker.Item label="Selecione" value="" color="#64748B" />
              {generoOptions.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Data de nascimento</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.dateInputButton}
            onPress={() => setMostrarDatePicker(true)}
          >
            <Text
              style={
                dataNascimento ? styles.dateInputText : styles.datePlaceholderText
              }
            >
              {dataNascimento || "dd/mm/aaaa"}
            </Text>
            <Text style={styles.dateIcon}>🗓️</Text>
          </TouchableOpacity>

          {mostrarDatePicker && (
            <DateTimePicker
              value={dataSelecionada}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={onChangeDate}
            />
          )}

          {tipoUsuario === "motorista" && (
            <>
              <Text style={styles.sectionTitle}>Dados do veículo</Text>

              <Text style={styles.label}>CNH</Text>
              <TextInput
                style={styles.input}
                value={cnh}
                onChangeText={(text) => setCnh(formatarCNH(text))}
                placeholder="Digite sua CNH"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Modelo do carro</Text>
              <TextInput
                style={styles.input}
                value={modeloCarro}
                onChangeText={setModeloCarro}
                placeholder="Ex: HB20"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Ano do carro</Text>
              <TextInput
                style={styles.input}
                value={anoCarro}
                onChangeText={(text) =>
                  setAnoCarro(limparNumero(text).slice(0, 4))
                }
                placeholder={anosCarro[0]}
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
              />

              <Text style={styles.label}>Cor do carro</Text>
              <TextInput
                style={styles.input}
                value={corCarro}
                onChangeText={setCorCarro}
                placeholder="Ex: Preto"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Placa</Text>
              <TextInput
                style={styles.input}
                value={placa}
                onChangeText={(text) => setPlaca(formatarPlaca(text))}
                placeholder="ABC1234"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                maxLength={7}
              />

              <TouchableOpacity
                style={styles.removeButton}
                onPress={removerVeiculo}
              >
                <Text style={styles.removeButtonText}>
                  Não tenho mais veículo (Remover Veículo)
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, salvandoDados && styles.buttonDisabled]}
            onPress={salvarDados}
            disabled={salvandoDados}
          >
            {salvandoDados ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Alterar senha</Text>

          <Text style={styles.label}>Senha atual</Text>
          <View
            style={[
              styles.passwordContainer,
              errosSenha.senhaAtual ? styles.inputError : undefined,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              value={senhaAtual}
              onChangeText={(text) => {
                setSenhaAtual(text);
                marcarSenhaComoTocada("senhaAtual");
                validarCampoSenhaTempoReal("senhaAtual", text);
              }}
              placeholder="Digite sua senha atual"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!mostrarSenhaAtual}
            />
            <TouchableOpacity
              onPress={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
            >
              <Text style={styles.showPasswordText}>
                {mostrarSenhaAtual ? "Ocultar" : "Mostrar"}
              </Text>
            </TouchableOpacity>
          </View>
          {renderErroSenha("senhaAtual")}

          <Text style={styles.label}>Nova senha</Text>
          <View
            style={[
              styles.passwordContainer,
              errosSenha.novaSenha ? styles.inputError : undefined,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              value={novaSenha}
              onChangeText={(text) => {
                setNovaSenha(text);
                marcarSenhaComoTocada("novaSenha");
                validarCampoSenhaTempoReal("novaSenha", text);

                if (touchedSenha.confirmarSenha || confirmarSenha) {
                  validarCampoSenhaTempoReal("confirmarSenha", confirmarSenha);
                }
              }}
              placeholder="Digite a nova senha"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!mostrarNovaSenha}
            />
            <TouchableOpacity
              onPress={() => setMostrarNovaSenha(!mostrarNovaSenha)}
            >
              <Text style={styles.showPasswordText}>
                {mostrarNovaSenha ? "Ocultar" : "Mostrar"}
              </Text>
            </TouchableOpacity>
          </View>
          {renderErroSenha("novaSenha")}

          <Text style={styles.passwordHint}>
            A senha deve ter no mínimo 6 caracteres, 1 letra minúscula, 1
            maiúscula, 1 número e 1 caractere especial.
          </Text>

          <Text style={styles.label}>Confirmar nova senha</Text>
          <View
            style={[
              styles.passwordContainer,
              errosSenha.confirmarSenha ? styles.inputError : undefined,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              value={confirmarSenha}
              onChangeText={(text) => {
                setConfirmarSenha(text);
                marcarSenhaComoTocada("confirmarSenha");
                validarCampoSenhaTempoReal("confirmarSenha", text);
              }}
              placeholder="Repita a nova senha"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!mostrarConfirmarSenha}
            />
            <TouchableOpacity
              onPress={() =>
                setMostrarConfirmarSenha(!mostrarConfirmarSenha)
              }
            >
              <Text style={styles.showPasswordText}>
                {mostrarConfirmarSenha ? "Ocultar" : "Mostrar"}
              </Text>
            </TouchableOpacity>
          </View>
          {renderErroSenha("confirmarSenha")}

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              salvandoSenha && styles.buttonDisabled,
            ]}
            onPress={alterarSenha}
            disabled={salvandoSenha}
          >
            {salvandoSenha ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.secondaryButtonText}>Alterar Senha</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
    marginTop: 10,
  },
  segmentedRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#0B1B35",
  },
  segmentButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  segmentButtonTextActive: {
    color: "#FFFFFF",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#0F172A",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 6,
  },
  passwordHint: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
  selectWrapper: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    overflow: "hidden",
  },
  picker: {
    color: "#0F172A",
  },
  dateInputButton: {
    minHeight: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInputText: {
    fontSize: 16,
    color: "#0F172A",
  },
  datePlaceholderText: {
    fontSize: 16,
    color: "#94A3B8",
  },
  dateIcon: {
    fontSize: 16,
  },
  photoButton: {
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  photoButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  photoPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignSelf: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  cepLoader: {
    marginTop: 10,
  },
  primaryButton: {
    marginTop: 22,
    backgroundColor: "#0B1B35",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 16,
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#0F172A",
  },
  showPasswordText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0B1B35",
  },
  removeButton: {
    marginTop: 16,
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});