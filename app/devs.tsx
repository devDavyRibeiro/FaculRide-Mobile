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


const devs = [
  { nome: 'Anthonny Cocuzza', foto: require('../assets/images/team/anthonny.jpeg') },
  { nome: 'Breno Silva', foto: require('../assets/images/team/breno.jpeg') },
  { nome: 'Davy Oliveira', foto: require('../assets/images/team/davy.jpeg') },
  { nome: 'Gabriel Correa', foto: require('../assets/images/team/gabriel.jpeg') },
  { nome: 'Herivelton Gonçalves', foto: require('../assets/images/team/heri.jpeg') },
  { nome: 'Pedro Silva', foto: require('../assets/images/team/pedro.jpeg') },
  { nome: 'Ryan Carlo', foto: require('../assets/images/team/ryan.jpeg') },
  { nome: 'Wendel Augusto', foto: require('../assets/images/team/wendel.jpeg') },
  { nome: 'Wesley Queiroz', foto: require('../assets/images/team/wesley.jpeg') },
];

export default function DevsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.container}>
          <Text style={styles.title}>Nosso Time de Desenvolvedores</Text>

          <Text style={styles.subtitle}>
            O FaculRide é fruto do esforço e da inovação de estudantes apaixonados
            por tecnologia e mobilidade. Conheça quem tornou este projeto possível!
          </Text>

          <View style={styles.grid}>
            {devs.map((dev, index) => (
              <View key={index} style={styles.card}>
                <Image source={dev.foto} style={styles.avatar} />
                <Text style={styles.name}>{dev.nome}</Text>
              </View>
            ))}
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
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },

  backText: {
    color: '#0B1B35',
    fontSize: 15,
    fontWeight: '600',
  },

  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 36,
    alignItems: 'center',
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
    color: '#475569',
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 30,
  },

  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 26,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 24,
  },
});