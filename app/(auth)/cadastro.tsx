import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TipoUsuario = 'passageiro' | 'motorista';

type ErrosType = {
  [key: string]: string;
};

type TouchedType = {
  [key: string]: boolean;
};

const API_BASE_URL = 'https://projeto-faculride.onrender.com';

export default function CadastroScreen() {
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('passageiro');

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [fatec, setFatec] = useState('');
  const [ra, setRa] = useState('');
  const [genero, setGenero] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [senha, setSenha] = useState('');
  const [repetirSenha, setRepetirSenha] = useState('');

  const [cnh, setCnh] = useState('');
  const [modeloCarro, setModeloCarro] = useState('');
  const [anoCarro, setAnoCarro] = useState('');
  const [corCarro, setCorCarro] = useState('');
  const [placa, setPlaca] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarRepetirSenha, setMostrarRepetirSenha] = useState(false);

  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<ErrosType>({});
  const [touched, setTouched] = useState<TouchedType>({});
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date(2000, 0, 1));

  const anosCarro = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => String(anoAtual - i));
  }, []);

  const fatecOptions = [
    'FATEC Votorantim',
  ];

  const generoOptions = ['Masculino', 'Feminino'];

  function limparNumero(valor: string) {
    return valor.replace(/\D/g, '');
  }

  function formatarCPF(valor: string) {
    const v = limparNumero(valor).slice(0, 11);
    return v
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  function formatarTelefone(valor: string) {
    const v = limparNumero(valor).slice(0, 11);

    if (v.length <= 10) {
      return v
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return v
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function formatarCEP(valor: string) {
    const v = limparNumero(valor).slice(0, 8);
    return v.replace(/^(\d{5})(\d)/, '$1-$2');
  }

  function formatarCNH(valor: string) {
    return limparNumero(valor).slice(0, 11);
  }

  function formatarPlaca(valor: string) {
    return valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  }
  
  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  function validarSenha(valor: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(valor);
  }

  function validarData(valor: string) {
    return /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(valor);
  }

  function converterTextoParaData(valor: string) {
    if (!validarData(valor)) return null;

    const [dia, mes, ano] = valor.split('/').map(Number);
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

  function dataEhFutura(data: Date) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataComparar = new Date(data);
    dataComparar.setHours(0, 0, 0, 0);

    return dataComparar > hoje;
  }

  function formatarDataDate(date: Date) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  function converterDataParaBackend(valor: string) {
    const data = converterTextoParaData(valor);
    if (!data) return '';

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  function converterGeneroParaBackend(valor: string) {
    return valor === 'Masculino';
  }

  function marcarComoTocado(campo: string) {
    setTouched((prev) => ({ ...prev, [campo]: true }));
  }

  function setErroCampo(campo: string, mensagem?: string) {
    setErros((prev) => {
      const novos = { ...prev };

      if (mensagem) {
        novos[campo] = mensagem;
      } else {
        delete novos[campo];
      }

      return novos;
    });
  }

  function getErroCampo(campo: string, valor?: string) {
    switch (campo) {
      case 'nome':
        if (!valor?.trim()) return 'Digite seu nome completo.';
        return '';

      case 'cpf':
        if (limparNumero(valor || '').length !== 11) return 'Digite um CPF válido.';
        return '';

      case 'email':
        if (!valor?.trim()) return 'Digite seu e-mail.';
        if (!validarEmail(valor)) return 'Digite um e-mail válido.';
        return '';

      case 'telefone':
        if (limparNumero(valor || '').length < 10) return 'Digite um telefone válido.';
        return '';

      case 'cep':
        if (limparNumero(valor || '').length !== 8) return 'Digite um CEP válido.';
        return '';

      case 'endereco':
        if (!valor?.trim()) return 'Digite o endereço.';
        return '';

      case 'numero':
        if (!valor?.trim()) return 'Digite o número.';
        return '';

      case 'cidade':
        if (!valor?.trim()) return 'Digite a cidade.';
        return '';

      case 'estado':
        if (!valor?.trim()) return 'Digite o estado.';
        if (valor.trim().length !== 2) return 'Digite a UF com 2 letras.';
        return '';

      case 'fatec':
        if (!valor?.trim()) return 'Selecione sua FATEC.';
        return '';

      case 'ra':
        if (!valor?.trim()) return 'Digite seu RA.';
        return '';

      case 'genero':
        if (!valor?.trim()) return 'Selecione o gênero.';
        return '';

      case 'dataNascimento': {
        if (!valor?.trim()) return 'Digite a data de nascimento.';
        if (!validarData(valor)) return 'Use o formato dd/mm/aaaa.';

        const data = converterTextoParaData(valor);
        if (!data) return 'Digite uma data válida.';
        if (dataEhFutura(data)) return 'A data de nascimento não pode ser futura.';
        return '';
      }

      case 'senha':
        if (!valor?.trim()) return 'Digite uma senha.';
        if (!validarSenha(valor)) {
          return 'A senha deve ter ao menos 6 caracteres, 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.';
        }
        return '';

      case 'repetirSenha':
        if (!valor?.trim()) return 'Confirme sua senha.';
        if (valor !== senha) return 'As senhas não coincidem.';
        return '';

      case 'cnh':
        if (tipoUsuario === 'motorista' && limparNumero(valor || '').length < 9) {
          return 'Digite uma CNH válida.';
        }
        return '';

      case 'modeloCarro':
        if (tipoUsuario === 'motorista' && !valor?.trim()) return 'Digite o modelo do carro.';
        return '';

      case 'anoCarro':
        if (tipoUsuario === 'motorista' && !valor?.trim()) return 'Digite o ano do carro.';
        if (
          tipoUsuario === 'motorista' &&
          valor &&
          (valor.length !== 4 || Number(valor) < 1990 || Number(valor) > new Date().getFullYear() + 1)
        ) {
          return 'Digite um ano válido.';
        }
        return '';

      case 'corCarro':
        if (tipoUsuario === 'motorista' && !valor?.trim()) return 'Digite a cor do carro.';
        return '';

      case 'placa':
        if (tipoUsuario === 'motorista' && (valor?.trim().length || 0) < 7) {
          return 'Digite uma placa válida.';
        }
        return '';

      default:
        return '';
    }
  }

  function validarCampoTempoReal(campo: string, valor: string) {
    const mensagem = getErroCampo(campo, valor);
    setErroCampo(campo, mensagem || undefined);
  }

  function marcarTodosComoTocados() {
    setTouched({
      nome: true,
      cpf: true,
      email: true,
      telefone: true,
      cep: true,
      endereco: true,
      numero: true,
      cidade: true,
      estado: true,
      fatec: true,
      ra: true,
      genero: true,
      dataNascimento: true,
      senha: true,
      repetirSenha: true,
      cnh: true,
      modeloCarro: true,
      anoCarro: true,
      corCarro: true,
      placa: true,
    });
  }

  async function buscarCep(valorCep: string) {
    const cepLimpo = limparNumero(valorCep);

    if (cepLimpo.length !== 8) return;

    try {
      setBuscandoCep(true);

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        setEndereco('');
        setCidade('');
        setEstado('');
        setErroCampo('cep', 'CEP inválido.');
        Alert.alert('CEP inválido', 'Não foi possível localizar esse CEP.');
        return;
      }

      setEndereco(data.logradouro || '');
      setCidade(data.localidade || '');
      setEstado(data.uf || '');

      if (touched.endereco) validarCampoTempoReal('endereco', data.logradouro || '');
      if (touched.cidade) validarCampoTempoReal('cidade', data.localidade || '');
      if (touched.estado) validarCampoTempoReal('estado', data.uf || '');
      if (touched.cep) validarCampoTempoReal('cep', valorCep);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar o CEP no momento.');
    } finally {
      setBuscandoCep(false);
    }
  }

  async function escolherFoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para selecionar uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setFotoUri(asset.uri);
    setFotoBase64(asset.base64 ?? null);
  }

  function validarFormulario() {
    const novosErros: ErrosType = {};

    const camposBase = {
      nome,
      cpf,
      email,
      telefone,
      cep,
      endereco,
      numero,
      cidade,
      estado,
      fatec,
      ra,
      genero,
      dataNascimento,
      senha,
      repetirSenha,
    };

    Object.entries(camposBase).forEach(([campo, valor]) => {
      const erro = getErroCampo(campo, valor);
      if (erro) novosErros[campo] = erro;
    });

    if (tipoUsuario === 'motorista') {
      const camposMotorista = {
        cnh,
        modeloCarro,
        anoCarro,
        corCarro,
        placa,
      };

      Object.entries(camposMotorista).forEach(([campo, valor]) => {
        const erro = getErroCampo(campo, valor);
        if (erro) novosErros[campo] = erro;
      });
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function uploadFoto(token: string) {
    if (!fotoBase64) return;

    try {
      await fetch(`${API_BASE_URL}/api/usuario/foto/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagemBase64: fotoBase64,
        }),
      });
    } catch {
      // não bloqueia o cadastro caso a foto falhe
    }
  }

  async function fazerLoginAutomatico() {
    const response = await fetch(`${API_BASE_URL}/api/usuario/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        senha,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || 'Não foi possível fazer login automaticamente.');
    }

    const token = data?.token ?? data?.accessToken ?? '';
    const usuario = data?.usuario ?? data?.user ?? data;

    if (token) {
      await AsyncStorage.setItem('token', token);
    }

    await AsyncStorage.setItem('usuario', JSON.stringify(usuario));

    return { token, usuario };
  }

  async function cadastrar() {
    marcarTodosComoTocados();

    if (!validarFormulario()) {
      Alert.alert('Formulário inválido', 'Revise os campos destacados.');
      return;
    }

    try {
      setCarregando(true);

      const payload: Record<string, any> = {
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
        senha,
      };

      if (tipoUsuario === 'motorista') {
        payload.cnh = limparNumero(cnh);
        payload.veiculo = {
          Modelo: modeloCarro.trim(),
          Ano: Number(anoCarro),
          Cor: corCarro.trim(),
          Placa_veiculo: placa.trim().toUpperCase(),
        };
      }

      console.log('PAYLOAD CADASTRO ENVIADO:', payload);

      const response = await fetch(`${API_BASE_URL}/api/usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('STATUS CADASTRO:', response.status);
      console.log('BODY CADASTRO RAW:', responseText);

      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { raw: responseText };
      }

      console.log('BODY CADASTRO JSON:', data);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.erro ||
            data?.error ||
            data?.raw ||
            `Erro HTTP ${response.status}`
        );
      }

      Alert.alert('Cadastro realizado', 'Sua conta foi criada com sucesso.', [
        {
          text: 'OK',
          onPress: () =>
            router.replace({
              pathname: '/(auth)/login',
              params: { email: email.trim().toLowerCase() },
            }),
        },
      ]);

    } catch (error: any) {
      console.log('ERRO COMPLETO CADASTRO:', error);
      Alert.alert('Erro no cadastro', error?.message || 'Ocorreu um erro ao cadastrar.');
    } finally {
      setCarregando(false);
    }
  }

  function renderErro(campo: string) {
    if (!erros[campo]) return null;
    return <Text style={styles.errorText}>{erros[campo]}</Text>;
  }

  function onChangeDate(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setMostrarDatePicker(false);
    }

    if (!selectedDate) return;

    if (dataEhFutura(selectedDate)) {
      marcarComoTocado('dataNascimento');
      setErroCampo('dataNascimento', 'A data de nascimento não pode ser futura.');
      return;
    }

    setDataSelecionada(selectedDate);
    const dataFormatada = formatarDataDate(selectedDate);
    setDataNascimento(dataFormatada);
    marcarComoTocado('dataNascimento');
    validarCampoTempoReal('dataNascimento', dataFormatada);
  }

  function aoTrocarTipoUsuario(novoTipo: TipoUsuario) {
    setTipoUsuario(novoTipo);

    if (novoTipo === 'passageiro') {
      setErros((prev) => {
        const novos = { ...prev };
        delete novos.cnh;
        delete novos.modeloCarro;
        delete novos.anoCarro;
        delete novos.corCarro;
        delete novos.placa;
        return novos;
      });
    } else {
      if (touched.cnh) validarCampoTempoReal('cnh', cnh);
      if (touched.modeloCarro) validarCampoTempoReal('modeloCarro', modeloCarro);
      if (touched.anoCarro) validarCampoTempoReal('anoCarro', anoCarro);
      if (touched.corCarro) validarCampoTempoReal('corCarro', corCarro);
      if (touched.placa) validarCampoTempoReal('placa', placa);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']} >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/images/logo-faculride-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>
          Preencha os dados abaixo para entrar no FaculRide.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Tipo de usuário</Text>

          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                tipoUsuario === 'passageiro' && styles.segmentButtonActive,
              ]}
              onPress={() => aoTrocarTipoUsuario('passageiro')}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  tipoUsuario === 'passageiro' && styles.segmentButtonTextActive,
                ]}
              >
                Passageiro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                tipoUsuario === 'motorista' && styles.segmentButtonActive,
              ]}
              onPress={() => aoTrocarTipoUsuario('motorista')}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  tipoUsuario === 'motorista' && styles.segmentButtonTextActive,
                ]}
              >
                Motorista
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Foto de perfil (opcional)</Text>
          <TouchableOpacity style={styles.photoButton} onPress={escolherFoto}>
            <Text style={styles.photoButtonText}>
              {fotoUri ? 'Trocar foto' : 'Selecionar foto'}
            </Text>
          </TouchableOpacity>

          {fotoUri ? <Image source={{ uri: fotoUri }} style={styles.photoPreview} /> : null}

          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={[styles.input, erros.nome && styles.inputError]}
            value={nome}
            onChangeText={(text) => {
              setNome(text);
              marcarComoTocado('nome');
              validarCampoTempoReal('nome', text);
            }}
            placeholder="Digite seu nome completo"
            placeholderTextColor="#94A3B8"
          />
          {renderErro('nome')}

          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={[styles.input, erros.cpf && styles.inputError]}
            value={cpf}
            onChangeText={(text) => {
              const valorFormatado = formatarCPF(text);
              setCpf(valorFormatado);
              marcarComoTocado('cpf');
              validarCampoTempoReal('cpf', valorFormatado);
            }}
            placeholder="000.000.000-00"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />
          {renderErro('cpf')}

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={[styles.input, erros.email && styles.inputError]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              marcarComoTocado('email');
              validarCampoTempoReal('email', text);
            }}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {renderErro('email')}

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={[styles.input, erros.telefone && styles.inputError]}
            value={telefone}
            onChangeText={(text) => {
              const valorFormatado = formatarTelefone(text);
              setTelefone(valorFormatado);
              marcarComoTocado('telefone');
              validarCampoTempoReal('telefone', valorFormatado);
            }}
            placeholder="(15) 99999-9999"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />
          {renderErro('telefone')}

          <Text style={styles.label}>CEP</Text>
          <TextInput
            style={[styles.input, erros.cep && styles.inputError]}
            value={cep}
            onChangeText={(text) => {
              const valorFormatado = formatarCEP(text);
              setCep(valorFormatado);
              marcarComoTocado('cep');
              validarCampoTempoReal('cep', valorFormatado);

              const cepLimpo = limparNumero(valorFormatado);
              if (cepLimpo.length === 8) {
                buscarCep(cepLimpo);
              }
            }}
            placeholder="00000-000"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />
          {buscandoCep ? <ActivityIndicator size="small" style={styles.cepLoader} /> : null}
          {renderErro('cep')}

          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={[styles.input, erros.endereco && styles.inputError]}
            value={endereco}
            onChangeText={(text) => {
              setEndereco(text);
              marcarComoTocado('endereco');
              validarCampoTempoReal('endereco', text);
            }}
            placeholder="Rua, avenida..."
            placeholderTextColor="#94A3B8"
          />
          {renderErro('endereco')}

          <Text style={styles.label}>Número</Text>
          <TextInput
            style={[styles.input, erros.numero && styles.inputError]}
            value={numero}
            onChangeText={(text) => {
              setNumero(text);
              marcarComoTocado('numero');
              validarCampoTempoReal('numero', text);
            }}
            placeholder="Número"
            placeholderTextColor="#94A3B8"
            keyboardType="default"
          />
          {renderErro('numero')}

          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={[styles.input, erros.cidade && styles.inputError]}
            value={cidade}
            onChangeText={(text) => {
              setCidade(text);
              marcarComoTocado('cidade');
              validarCampoTempoReal('cidade', text);
            }}
            placeholder="Cidade"
            placeholderTextColor="#94A3B8"
          />
          {renderErro('cidade')}

          <Text style={styles.label}>Estado</Text>
          <TextInput
            style={[styles.input, erros.estado && styles.inputError]}
            value={estado}
            onChangeText={(text) => {
              const valor = text.toUpperCase().slice(0, 2);
              setEstado(valor);
              marcarComoTocado('estado');
              validarCampoTempoReal('estado', valor);
            }}
            placeholder="UF"
            placeholderTextColor="#94A3B8"
            maxLength={2}
            autoCapitalize="characters"
          />
          {renderErro('estado')}

          <Text style={styles.label}>Sua Fatec</Text>
          <View style={[styles.selectWrapper, erros.fatec && styles.inputError]}>
            <Picker
              selectedValue={fatec}
              onValueChange={(itemValue) => {
                setFatec(itemValue);
                marcarComoTocado('fatec');
                validarCampoTempoReal('fatec', itemValue);
              }}
              style={styles.picker}
              dropdownIconColor="#0F172A"
            >
              <Picker.Item label="Selecione" value="" color="#64748B" />
              {fatecOptions.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
          {renderErro('fatec')}

          <Text style={styles.label}>RA</Text>
          <TextInput
            style={[styles.input, erros.ra && styles.inputError]}
            value={ra}
            onChangeText={(text) => {
              setRa(text);
              marcarComoTocado('ra');
              validarCampoTempoReal('ra', text);
            }}
            placeholder="Digite seu RA"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />
          {renderErro('ra')}

          <Text style={styles.label}>Gênero</Text>
          <View style={[styles.selectWrapper, erros.genero && styles.inputError]}>
            <Picker
              selectedValue={genero}
              onValueChange={(itemValue) => {
                setGenero(itemValue);
                marcarComoTocado('genero');
                validarCampoTempoReal('genero', itemValue);
              }}
              style={styles.picker}
              dropdownIconColor="#0F172A"
            >
              <Picker.Item label="Selecione" value="" color="#64748B" />
              {generoOptions.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
          {renderErro('genero')}

          <Text style={styles.label}>Data de nascimento</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.dateInputButton, erros.dataNascimento && styles.inputError]}
            onPress={() => setMostrarDatePicker(true)}
          >
            <Text style={dataNascimento ? styles.dateInputText : styles.datePlaceholderText}>
              {dataNascimento || 'dd/mm/aaaa'}
            </Text>
            <Text style={styles.dateIcon}>🗓️</Text>
          </TouchableOpacity>
          {renderErro('dataNascimento')}

          {mostrarDatePicker && (
            <DateTimePicker
              value={dataSelecionada}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={onChangeDate}
            />
          )}

          {tipoUsuario === 'motorista' && (
            <>
              <Text style={styles.sectionTitle}>Dados do veículo</Text>

              <Text style={styles.label}>CNH</Text>
              <TextInput
                style={[styles.input, erros.cnh && styles.inputError]}
                value={cnh}
                onChangeText={(text) => {
                  const valorFormatado = formatarCNH(text);
                  setCnh(valorFormatado);
                  marcarComoTocado('cnh');
                  validarCampoTempoReal('cnh', valorFormatado);
                }}
                placeholder="Digite sua CNH"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />
              {renderErro('cnh')}

              <Text style={styles.label}>Modelo do carro</Text>
              <TextInput
                style={[styles.input, erros.modeloCarro && styles.inputError]}
                value={modeloCarro}
                onChangeText={(text) => {
                  setModeloCarro(text);
                  marcarComoTocado('modeloCarro');
                  validarCampoTempoReal('modeloCarro', text);
                }}
                placeholder="Ex: HB20"
                placeholderTextColor="#94A3B8"
              />
              {renderErro('modeloCarro')}

              <Text style={styles.label}>Ano do carro</Text>
              <TextInput
                style={[styles.input, erros.anoCarro && styles.inputError]}
                value={anoCarro}
                onChangeText={(text) => {
                  const apenasNumero = limparNumero(text).slice(0, 4);
                  setAnoCarro(apenasNumero);
                  marcarComoTocado('anoCarro');
                  validarCampoTempoReal('anoCarro', apenasNumero);
                }}
                placeholder={anosCarro[0]}
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
              />
              {renderErro('anoCarro')}

              <Text style={styles.label}>Cor do carro</Text>
              <TextInput
                style={[styles.input, erros.corCarro && styles.inputError]}
                value={corCarro}
                onChangeText={(text) => {
                  setCorCarro(text);
                  marcarComoTocado('corCarro');
                  validarCampoTempoReal('corCarro', text);
                }}
                placeholder="Ex: Preto"
                placeholderTextColor="#94A3B8"
              />
              {renderErro('corCarro')}

              <Text style={styles.label}>Placa</Text>
              <TextInput
                style={[styles.input, erros.placa && styles.inputError]}
                value={placa}
                onChangeText={(text) => {
                  const valorFormatado = formatarPlaca(text);
                  setPlaca(valorFormatado);
                  marcarComoTocado('placa');
                  validarCampoTempoReal('placa', valorFormatado);
                }}
                placeholder="ABC1234"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                maxLength={7}
              />
              {renderErro('placa')}
            </>
          )}

          <Text style={styles.sectionTitle}>Senha de acesso</Text>

          <Text style={styles.label}>Senha</Text>
          <View style={[styles.passwordContainer, erros.senha && styles.inputError]}>
            <TextInput
              value={senha}
              onChangeText={(text) => {
                setSenha(text);
                marcarComoTocado('senha');
                validarCampoTempoReal('senha', text);

                if (touched.repetirSenha || repetirSenha) {
                  validarCampoTempoReal('repetirSenha', repetirSenha);
                }
              }}
              placeholder="Digite sua senha"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!mostrarSenha}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Text style={styles.showPasswordText}>
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>
          {renderErro('senha')}

          <Text style={styles.passwordHint}>
            A senha deve ter no mínimo 6 caracteres, 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.
          </Text>

          <Text style={styles.label}>Repetir senha</Text>
          <View style={[styles.passwordContainer, erros.repetirSenha && styles.inputError]}>
            <TextInput
              value={repetirSenha}
              onChangeText={(text) => {
                setRepetirSenha(text);
                marcarComoTocado('repetirSenha');
                validarCampoTempoReal('repetirSenha', text);
              }}
              placeholder="Repita sua senha"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!mostrarRepetirSenha}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setMostrarRepetirSenha(!mostrarRepetirSenha)}>
              <Text style={styles.showPasswordText}>
                {mostrarRepetirSenha ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>
          {renderErro('repetirSenha')}

          <TouchableOpacity
            style={[styles.primaryButton, carregando && styles.buttonDisabled]}
            onPress={cadastrar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 18,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 76,
    height: 76,
    tintColor: '#0B1B35',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
    marginTop: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#0B1B35',
  },
  segmentButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: '#0F172A',
  },
  selectWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    overflow: 'hidden',
  },
  picker: {
    color: '#0F172A',
  },
  dateInputButton: {
    minHeight: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    fontSize: 16,
    color: '#0F172A',
  },
  datePlaceholderText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  dateIcon: {
    fontSize: 16,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 6,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#0F172A',
  },
  showPasswordText: {
    color: '#0B1B35',
    fontSize: 13,
    fontWeight: '600',
  },
  passwordHint: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  photoButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  photoButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  photoPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  cepLoader: {
    marginTop: 10,
  },
  primaryButton: {
    marginTop: 22,
    backgroundColor: '#0B1B35',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});