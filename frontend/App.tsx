import { StatusBar } from "expo-status-bar";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <Image
          source={require("./assets/almar-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.status}>
          Sistema de control horario
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            Entrar
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  logoImage: {
    width: 320,
    height: 220,
    marginBottom: 40,
  },

  status: {
    color: "#F3F0EA",
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 40,
  },

  button: {
    backgroundColor: "#B07A4F",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    minWidth: 220,
    alignItems: "center",
  },

  buttonText: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "700",
  },
});