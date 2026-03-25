import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'https://projeto-faculride.onrender.com';

type ErrosType = {
  [key: string]: string;
};

export default function LoginScreen() {
  const params = useLocalSearchParams();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<ErrosType>({});

  useEffect(() => {
    if (typeof params.email === 'string') {
      setEmail(params.email);
    }
  }, [params.email]);

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  function setErroCampo(campo: string, mensagem?: string) {
    setErros((prev) => {
      const novos = { ...prev };
      if (mensagem) novos[campo] = mensagem;
      else delete novos[campo];
      return novos;
    });
  }

  function validarCampoTempoReal(campo: string, valor: string) {
    if (campo === 'email') {
      if (!valor.trim()) setErroCampo('email', 'Digite seu e-mail.');
      else if (!validarEmail(valor)) setErroCampo('email', 'Digite um e-mail válido.');
      else setErroCampo('email');
    }

    if (campo === 'senha') {
      if (!valor.trim()) setErroCampo('senha', 'Digite sua senha.');
      else setErroCampo('senha');
    }
  }

  function validarFormulario() {
    const novosErros: ErrosType = {};

    if (!email.trim()) novosErros.email = 'Digite seu e-mail.';
    else if (!validarEmail(email)) novosErros.email = 'Digite um e-mail válido.';

    if (!senha.trim()) novosErros.senha = 'Digite sua senha.';

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function fazerLogin() {
    if (!validarFormulario()) {
      Alert.alert('Formulário inválido', 'Revise os campos destacados.');
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch(`${API_BASE_URL}/api/usuario/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha,
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
        throw new Error(data?.message || 'E-mail ou senha inválidos.');
      }

      const token = data?.token ?? '';
      const usuario = data?.usuario ?? data;

      if (token) await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('usuario', JSON.stringify(usuario));

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Erro no login', error?.message || 'Erro ao entrar.');
    } finally {
      setCarregando(false);
    }
  }

  function renderErro(campo: string) {
    if (!erros[campo]) return null;
    return <Text style={styles.errorText}>{erros[campo]}</Text>;
  }

  return (
      <LinearGradient
          colors={['#0F172A', '#334F90', '#15203A']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
      >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/images/logo-faculride-white.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Entre no FaculRide</Text>

          <Text style={styles.subtitle}>
            Conecte-se.{"\n"}
            Compartilhe.{"\n"}
            Vá mais longe com o FaculRide.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>E-mail :</Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validarCampoTempoReal('email', text);
              }}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#94A3B8"
              style={[styles.input, erros.email && styles.inputError]}
            />
            {renderErro('email')}

            <Text style={styles.label}>Senha :</Text>

            <View style={[styles.passwordContainer, erros.senha && styles.inputError]}>
              <TextInput
                value={senha}
                onChangeText={(text) => {
                  setSenha(text);
                  validarCampoTempoReal('senha', text);
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

            <TouchableOpacity
              style={[styles.primaryButton, carregando && styles.buttonDisabled]}
              onPress={fazerLogin}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/cadastro')}>
              <Text style={styles.secondaryButton}>Não possui uma conta? Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 84,
    height: 84,
    tintColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom:15
  },
  subtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 28,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#eef0f4',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 15,
    color: '#0F172A',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,

  },
  passwordInput: {
    flex: 1,
    color: '#0F172A',
    paddingVertical: 14,
  },
  showPasswordText: {
    color: '#0B1B35',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#0B1B35',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 70,
    marginRight:70
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: '#DC2626',
  },
  inputError: {
    borderColor: '#DC2626',
  },
   secondaryButton: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 28,
    marginTop: 15
  },
});