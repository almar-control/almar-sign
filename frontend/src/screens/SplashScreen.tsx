import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo_negro.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.text}>Sistema de control horario</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center", padding: 24 },
  logo: { width: 320, height: 220, marginBottom: 32 },
  text: { color: "#F3F0EA", fontSize: 16, marginBottom: 40 },
  button: { backgroundColor: "#B07A4F", paddingVertical: 16, paddingHorizontal: 48, borderRadius: 14, minWidth: 220, alignItems: "center" },
  buttonText: { color: "#0A0A0A", fontSize: 16, fontWeight: "700" },
});
