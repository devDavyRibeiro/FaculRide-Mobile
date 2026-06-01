import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../src/constants/api';

type ErrosType = {
  [key: string]: string;
};

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

export default function LoginScreen() {
  const params = useLocalSearchParams();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<ErrosType>({});

  const [modalSenhaVisible, setModalSenhaVisible] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [errosSenha, setErrosSenha] = useState<ErrosSenhaType>({});
  const [touchedSenha, setTouchedSenha] = useState<TouchedSenhaType>({});

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  useEffect(() => {
    if (typeof params.email === 'string') {
      setEmail(params.email);
    }
  }, [params.email]);

  function validarSenhaForte(valor: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(
      valor
    );
  }

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  function getErroSenhaCampo(
    campo: 'senhaAtual' | 'novaSenha' | 'confirmarSenha',
    valor: string
  ) {
    switch (campo) {
      case 'senhaAtual':
        if (!valor?.trim()) return 'Digite sua senha atual.';
        return '';

      case 'novaSenha':
        if (!valor?.trim()) return 'Digite a nova senha.';
        if (!validarSenhaForte(valor)) {
          return 'A nova senha deve ter no mínimo 6 caracteres, 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.';
        }
        return '';

      case 'confirmarSenha':
        if (!valor?.trim()) return 'Confirme a nova senha.';
        if (valor !== novaSenha) return 'As senhas não coincidem.';
        return '';

      default:
        return '';
    }
  }

  function marcarSenhaComoTocada(
    campo: 'senhaAtual' | 'novaSenha' | 'confirmarSenha'
  ) {
    setTouchedSenha((prev) => ({ ...prev, [campo]: true }));
  }

  function validarCampoSenhaTempoReal(
    campo: 'senhaAtual' | 'novaSenha' | 'confirmarSenha',
    valor: string
  ) {
    const mensagem = getErroSenhaCampo(campo, valor);
    setErrosSenha((prev) => ({
      ...prev,
      [campo]: mensagem || undefined,
    }));
  }

  function renderErroSenha(
    campo: 'senhaAtual' | 'novaSenha' | 'confirmarSenha'
  ) {
    if (!errosSenha[campo]) return null;
    return <Text style={styles.errorText}>{errosSenha[campo]}</Text>;
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

  function validarCampoTempoReal(campo: string, valor: string) {
    switch (campo) {
      case 'email':
        if (!valor.trim()) {
          setErroCampo('email', 'Digite seu e-mail.');
        } else if (!validarEmail(valor)) {
          setErroCampo('email', 'Digite um e-mail válido.');
        } else {
          setErroCampo('email');
        }
        break;

      case 'senha':
        if (!valor.trim()) {
          setErroCampo('senha', 'Digite sua senha.');
        } else {
          setErroCampo('senha');
        }
        break;

      default:
        break;
    }
  }

  function validarFormulario() {
    const novosErros: ErrosType = {};

    if (!email.trim()) {
      novosErros.email = 'Digite seu e-mail.';
    } else if (!validarEmail(email)) {
      novosErros.email = 'Digite um e-mail válido.';
    }

    if (!senha.trim()) {
      novosErros.senha = 'Digite sua senha.';
    }

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

      const payload = {
        email: email.trim().toLowerCase(),
        senha,
      };

      console.log('PAYLOAD LOGIN ENVIADO:', payload);

      const response = await fetch(`${API_URL}/usuario/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('STATUS LOGIN:', response.status);
      console.log('BODY LOGIN RAW:', responseText);

      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { raw: responseText };
      }

      console.log('BODY LOGIN JSON:', data);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.erro ||
            data?.error ||
            data?.raw ||
            'E-mail ou senha inválidos.'
        );
      }

      const token = data?.token ?? data?.accessToken ?? '';
      const usuario = data?.usuario ?? data?.user ?? data;

      if (token) {
        await AsyncStorage.setItem('token', token);
      }

      await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
      await AsyncStorage.setItem('usuarioLogado', JSON.stringify(usuario));

      router.replace('/(tabs)');
    } catch (error: any) {
      console.log('ERRO COMPLETO LOGIN:', error);
      Alert.alert('Erro no login', error?.message || 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  async function alterarSenha() {
    const erroSenhaAtual = getErroSenhaCampo('senhaAtual', senhaAtual);
    const erroNovaSenha = getErroSenhaCampo('novaSenha', novaSenha);
    const erroConfirmarSenha = getErroSenhaCampo(
      'confirmarSenha',
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
      Alert.alert('Aviso', 'Corrija os campos de senha antes de continuar.');
      return;
    }

    try {
      setSalvandoSenha(true);

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Erro', 'Token não encontrado.');
        return;
      }

      const response = await fetch(`${API_URL}/usuario/alterar-senha`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
            'Não foi possível alterar a senha.'
        );
      }

      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setErrosSenha({});
      setTouchedSenha({});
      setMostrarSenhaAtual(false);
      setMostrarNovaSenha(false);
      setMostrarConfirmarSenha(false);
      setModalSenhaVisible(false);

      Alert.alert('Sucesso', 'Senha alterada com sucesso.');
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível alterar a senha.'
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  function renderErro(campo: string) {
    if (!erros[campo]) return null;
    return <Text style={styles.errorText}>{erros[campo]}</Text>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              validarCampoTempoReal('email', text);
            }}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, erros.email && styles.inputError]}
          />
          {renderErro('email')}

          <Text style={styles.label}>Senha</Text>

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

            <TouchableOpacity
              style={styles.showPasswordButton}
              onPress={() => setMostrarSenha(!mostrarSenha)}
            >
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

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setModalSenhaVisible(true)}
          >
            <Text style={styles.linkText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <Text style={styles.registerText}>Ainda não tem cadastro?</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/cadastro')}
          >
            <Text style={styles.secondaryButtonText}>Criar conta</Text>
          </TouchableOpacity>

          <View style={styles.infoLinksBox}>
            <TouchableOpacity onPress={() => router.push('/ajuda')}>
              <Text style={styles.infoLink}>Ajuda</Text>
            </TouchableOpacity>

            <Text style={styles.infoDivider}>•</Text>

            <TouchableOpacity onPress={() => router.push('/devs')}>
              <Text style={styles.infoLink}>Desenvolvedores</Text>
            </TouchableOpacity>

            <Text style={styles.infoDivider}>•</Text>

            <TouchableOpacity onPress={() => router.push('/sobre')}>
              <Text style={styles.infoLink}>Sobre o FaculRide</Text>
            </TouchableOpacity>

            <Text style={styles.infoDivider}>•</Text>

            <TouchableOpacity onPress={() => router.push('/como-funciona')}>
              <Text style={styles.infoLink}>Como Funciona</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalSenhaVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
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
                  marcarSenhaComoTocada('senhaAtual');
                  validarCampoSenhaTempoReal('senhaAtual', text);
                }}
                placeholder="Digite sua senha atual"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!mostrarSenhaAtual}
              />
              <TouchableOpacity
                onPress={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
              >
                <Text style={styles.showPasswordText}>
                  {mostrarSenhaAtual ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            {renderErroSenha('senhaAtual')}

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
                  marcarSenhaComoTocada('novaSenha');
                  validarCampoSenhaTempoReal('novaSenha', text);

                  if (touchedSenha.confirmarSenha || confirmarSenha) {
                    validarCampoSenhaTempoReal('confirmarSenha', confirmarSenha);
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
                  {mostrarNovaSenha ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            {renderErroSenha('novaSenha')}

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
                  marcarSenhaComoTocada('confirmarSenha');
                  validarCampoSenhaTempoReal('confirmarSenha', text);
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
                  {mostrarConfirmarSenha ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            {renderErroSenha('confirmarSenha')}

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

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalSenhaVisible(false)}
              disabled={salvandoSenha}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    tintColor: '#0B1B35',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: -2,
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
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: -4,
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
  showPasswordButton: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
  showPasswordText: {
    color: '#0B1B35',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 8,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: '#0B1B35',
    fontSize: 14,
    fontWeight: '600',
  },
  registerText: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
    color: '#475569',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
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
  passwordHint: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  infoLinksBox: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  infoLink: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoDivider: {
    fontSize: 13,
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
});