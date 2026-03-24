import { router } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ComoFuncionaScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.sectionBlue}>
          <Text style={styles.title}>Como Funciona</Text>

          <Text style={styles.subtitle}>
            Cadastre-se, encontre ou ofereça uma carona, conecte-se e combine os
            detalhes para aproveitar sua viagem rumo ao futuro.
          </Text>

          <View style={styles.imagesContainer}>
            <Image
              source={require('../assets/images/etapa1.png')}
              style={styles.stepImage}
              resizeMode="contain"
            />

            <Image
              source={require('../assets/images/etapa2.png')}
              style={styles.stepImage}
              resizeMode="contain"
            />

            <Image
              source={require('../assets/images/etapa3.png')}
              style={styles.stepImage}
              resizeMode="contain"
            />

            <Image
              source={require('../assets/images/etapa4.png')}
              style={styles.stepImage}
              resizeMode="contain"
            />

            <Image
              source={require('../assets/images/etapa5.png')}
              style={styles.stepImage}
              resizeMode="contain"
            />
          </View>
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
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#1E293B',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  sectionBlue: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 36,
    alignItems: 'center',
  },

  title: {
    fontSize: 31,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 30,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 30,
  },

  imagesContainer: {
    width: '100%',
    alignItems: 'center',
  },

  stepImage: {
    width: '100%',
    height: 220,
    marginBottom: 18,
  },
});