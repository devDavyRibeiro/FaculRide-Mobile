import { router } from 'expo-router';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SobreScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        {/* BLOCO AZUL - QUEM SOMOS */}
        <View style={styles.sectionBlue}>
          <Image
            source={require('../assets/images/logo-faculride-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.titleBlue}>Quem Somos</Text>

          <Text style={styles.textBlue}>
            O <Text style={styles.bold}>FaculRide</Text> é uma plataforma inovadora de
            caronas criada especialmente para a comunidade acadêmica, com o propósito
            de reduzir a emissão de carbono e facilitar o deslocamento diário de
            estudantes, professores e funcionários. Mais do que um site, o FaculRide é
            um projeto sustentável que reforça o compromisso ambiental da instituição.
          </Text>

          <Text style={styles.textBlue}>
            Com um sistema de compartilhamento de viagens, o FaculRide ajuda a diminuir
            o estresse do trânsito, reduzir custos e promover a integração social
            dentro da faculdade. Pensado para a segurança e conveniência dos usuários,
            oferece funcionalidades como cadastro verificado e agendamento flexível de
            caronas, proporcionando uma experiência prática e confiável.
          </Text>

          <Text style={styles.textBlue}>
            O <Text style={styles.bold}>FaculRide</Text> é mais do que uma solução de
            transporte: é uma iniciativa que conecta pessoas, promove a
            sustentabilidade e transforma o dia a dia acadêmico.
          </Text>
        </View>

        {/* BLOCO BRANCO - SUSTENTABILIDADE */}
        <View style={styles.sectionWhite}>
          <Text style={styles.titleWhite}>Sustentabilidade</Text>

          <Text style={styles.textWhite}>
            Nosso projeto é comprometido com o desenvolvimento sustentável. Atendemos
            às metas da ODS 11 (Cidades e Comunidades Sustentáveis) e da ODS 13 (Ação
            Contra a Mudança Global do Clima), promovendo uma mobilidade urbana mais
            consciente e responsável.
          </Text>

          <Image
            source={require('../assets/images/ods11.png')}
            style={styles.odsImage}
            resizeMode="contain"
          />

          <Image
            source={require('../assets/images/ods13.png')}
            style={styles.odsImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1E293B',
  },

  backButton: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 12,
    marginTop: 10,
    backgroundColor: '#1E293B',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  sectionBlue: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 36,
    alignItems: 'center',
  },

  logo: {
    width: 210,
    height: 130,
    marginBottom: 18,
    tintColor: '#F1F5F9',
  },

  titleBlue: {
    fontSize: 31,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 26,
  },

  textBlue: {
    fontSize: 17,
    lineHeight: 31,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 24,
  },

  bold: {
    fontWeight: '700',
  },

  sectionWhite: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 34,
    alignItems: 'center',
  },

  titleWhite: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 22,
  },

  textWhite: {
    fontSize: 17,
    lineHeight: 31,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 28,
  },

  odsImage: {
    width: '100%',
    height: 240,
    marginBottom: 18,
  },
});