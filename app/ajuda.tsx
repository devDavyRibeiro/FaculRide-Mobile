import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AjudaScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');

  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);
  const [erroFormulario, setErroFormulario] = useState(false);

  const emailValido = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const nomeValido = nome.trim().length > 0;
  const mensagemValida = mensagem.trim().length > 0;

  const formularioValido = nomeValido && emailValido && mensagemValida;

  function enviarFormulario() {
    setTentouEnviar(true);

    if (formularioValido) {
      setMensagemSucesso(true);
      setErroFormulario(false);

      setNome('');
      setEmail('');
      setMensagem('');
      setTentouEnviar(false);

      setTimeout(() => {
        setMensagemSucesso(false);
      }, 5000);
    } else {
      setErroFormulario(true);

      setTimeout(() => {
        setErroFormulario(false);
      }, 5000);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.container}>
          <View style={styles.topo}>
            <Text style={styles.title}>FaculRide te ajuda!</Text>
            <Text style={styles.subtitle}>
              Precisa de suporte? Veja abaixo as principais informações e tire
              suas dúvidas rapidamente. Se ainda precisar, mande sua mensagem
              para nós!
            </Text>
          </View>

          <View style={styles.cardsContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Como Funciona o FaculRide?</Text>
              <Text style={styles.cardText}>
                O FaculRide conecta estudantes que precisam de carona com colegas
                que oferecem vagas no carro, promovendo mobilidade sustentável e segura.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cadastro e Login</Text>
              <Text style={styles.cardText}>
                Você pode criar uma conta gratuitamente usando seu e-mail acadêmico.
                Depois, basta fazer login para começar a usar.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Segurança nas Caronas</Text>
              <Text style={styles.cardText}>
                Todos os usuários passam por uma verificação de cadastro para
                garantir a confiança nas caronas.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Problemas com uma Carona</Text>
              <Text style={styles.cardText}>
                Entre em contato diretamente com o suporte para reportar
                qualquer incidente.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contato com o Suporte</Text>
              <Text style={styles.cardText}>
                Envie uma mensagem usando o formulário abaixo para atendimento rápido.
              </Text>
            </View>
          </View>

          <View style={styles.faleConosco}>
            <Text style={styles.faleConoscoTitle}>Fale Conosco</Text>

            {mensagemSucesso && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  ✅ Sua mensagem foi enviada com sucesso! ✅
                </Text>
              </View>
            )}

            {erroFormulario && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  ⚠️ Verifique os campos obrigatórios antes de enviar.
                </Text>
              </View>
            )}

            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                tentouEnviar && !nomeValido ? styles.inputErro : null,
              ]}
            />
            {tentouEnviar && !nomeValido && (
              <Text style={styles.validationText}>⚠️ Nome é obrigatório.</Text>
            )}

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Seu e-mail"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.input,
                tentouEnviar && !emailValido ? styles.inputErro : null,
              ]}
            />
            {tentouEnviar && !emailValido && (
              <Text style={styles.validationText}>
                ⚠️ Informe um e-mail válido.
              </Text>
            )}

            <TextInput
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Sua dúvida ou reclamação"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={[
                styles.textarea,
                tentouEnviar && !mensagemValida ? styles.inputErro : null,
              ]}
            />
            {tentouEnviar && !mensagemValida && (
              <Text style={styles.validationText}>
                ⚠️ A mensagem é obrigatória.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                !formularioValido ? styles.submitButtonDisabled : null,
              ]}
              onPress={enviarFormulario}
            >
              <Text style={styles.submitButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
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

  backButton: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 12,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
  },

  backText: {
    color: '#0B1B35',
    fontSize: 15,
    fontWeight: '600',
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  topo: {
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 28,
    color: '#475569',
    textAlign: 'center',
  },

  cardsContainer: {
    gap: 16,
    marginBottom: 38,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 18,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,
    lineHeight: 25,
    color: '#64748B',
  },

  faleConosco: {
    marginTop: 6,
  },

  faleConoscoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 18,
  },

  successBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  successText: {
    color: '#065F46',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },

  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  errorText: {
    color: '#B91C1C',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },

  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 10,
  },

  textarea: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 15,
    fontSize: 16,
    color: '#0F172A',
    minHeight: 140,
    marginBottom: 10,
  },

  inputErro: {
    borderColor: '#DC2626',
  },

  validationText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: -2,
  },

  submitButton: {
    marginTop: 4,
    backgroundColor: '#0B1B35',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.9,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});