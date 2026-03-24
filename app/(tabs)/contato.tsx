import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContatoScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View>
        <Text style={styles.title}>Contato</Text>
        <Text style={styles.subtitle}>Tela de contato em construção.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
});