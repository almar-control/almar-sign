import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { changePassword, checkIn, checkOut, getGpsSettings, getHours } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "WorkerHome">;

type GpsData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type ZoneStatus = "pending" | "inside" | "outside";

export default function WorkerHomeScreen({ navigation, route }: Props) {
  const [gps, setGps] = useState<GpsData | null>(null);
  const [gpsStatus, setGpsStatus] = useState("GPS pendiente");
  const [loadingGps, setLoadingGps] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>("pending");
  const [distance, setDistance] = useState<number | null>(null);
  const [hours, setHours] = useState(0);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const userEmail = route.params?.email || "worker@almar.com";
  const userRole = route.params?.role || "worker";

  useEffect(() => {
    getGps();
    loadHours();
  }, []);

  async function loadHours() {
    try {
      const data = await getHours(userEmail);
      setHours(data.hours || 0);
    } catch (error) {
      console.log(error);
    }
  }

  async function getGps() {
    try {
      setLoadingGps(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setGps(null);
        setGpsStatus("GPS denegado");
        setZoneStatus("pending");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      if (!latitude || !longitude || latitude === 0 || longitude === 0) {
        setGps(null);
        setGpsStatus("GPS inválido");
        setZoneStatus("pending");
        return;
      }

      const gpsSettings = await getGpsSettings();

      const meters = getDistance(
        { latitude, longitude },
        {
          latitude: gpsSettings.latitude,
          longitude: gpsSettings.longitude,
        }
      );

      setDistance(meters);
      setZoneStatus(meters <= gpsSettings.radius_meters ? "inside" : "outside");
      setGps({ latitude, longitude, accuracy });
      setGpsStatus("GPS operativo");
    } catch {
      setGps(null);
      setGpsStatus("Error GPS");
      setZoneStatus("pending");
    } finally {
      setLoadingGps(false);
    }
  }

  async function handleCheckIn() {
    try {
      if (!gps) {
        Alert.alert("GPS requerido", "Debes obtener GPS antes de fichar.");
        return;
      }

      if (zoneStatus !== "inside") {
        Alert.alert("Fuera de zona", "No puedes fichar fuera de la zona permitida.");
        return;
      }

      setLoadingRecord(true);

      const response = await checkIn({
        email: userEmail,
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy,
        device: "expo-go",
      });

      await loadHours();

      Alert.alert("Entrada registrada", response.record.timestamp);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo fichar entrada");
    } finally {
      setLoadingRecord(false);
    }
  }

  async function handleCheckOut() {
    try {
      if (!gps) {
        Alert.alert("GPS requerido", "Debes obtener GPS antes de fichar.");
        return;
      }

      if (zoneStatus !== "inside") {
        Alert.alert("Fuera de zona", "No puedes fichar fuera de la zona permitida.");
        return;
      }

      setLoadingRecord(true);

      const response = await checkOut({
        email: userEmail,
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy,
        device: "expo-go",
      });

      await loadHours();

      Alert.alert("Salida registrada", response.record.timestamp);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo fichar salida");
    } finally {
      setLoadingRecord(false);
    }
  }

  async function savePasswordChange() {
    try {
      if (!passwordForm.current_password || !passwordForm.new_password) {
        Alert.alert("Contraseña", "Rellena contraseña actual y nueva");
        return;
      }

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        Alert.alert("Contraseña", "La nueva contraseña no coincide");
        return;
      }

      await changePassword({
        email: userEmail,
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      Alert.alert("Contraseña actualizada", "Tu contraseña se ha cambiado correctamente");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cambiar la contraseña");
    }
  }

  async function logout() {
    await AsyncStorage.removeItem("user_email");
    await AsyncStorage.removeItem("user_role");
    navigation.replace("Login");
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Trabajador</Text>

      <Text style={styles.user}>{userEmail}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Estado GPS</Text>
        <Text style={styles.value}>{gpsStatus}</Text>

        <Text
          style={[
            styles.zone,
            zoneStatus === "inside" ? styles.inside : styles.outside,
          ]}
        >
          {zoneStatus === "inside" ? "DENTRO ZONA" : "FUERA ZONA"}
        </Text>

        {distance !== null ? (
          <Text style={styles.distance}>Distancia: {distance} m</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Horas acumuladas</Text>
        <Text style={styles.value}>{hours} h</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={getGps}>
        {loadingGps ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text style={styles.buttonText}>Actualizar GPS</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, zoneStatus !== "inside" && styles.disabledButton]}
        onPress={handleCheckIn}
        disabled={loadingRecord}
      >
        <Text style={styles.buttonText}>Fichar entrada</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryButton,
          zoneStatus !== "inside" && styles.disabledSecondaryButton,
        ]}
        onPress={handleCheckOut}
        disabled={loadingRecord}
      >
        <Text style={styles.secondaryButtonText}>Fichar salida</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("History")}>
        <Text style={styles.link}>Ver historial</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>Cambiar contraseña</Text>

        <TextInput
          style={styles.input}
          placeholder="Contraseña actual"
          placeholderTextColor="#8F8A82"
          secureTextEntry
          value={passwordForm.current_password}
          onChangeText={(value) =>
            setPasswordForm({ ...passwordForm, current_password: value })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Nueva contraseña"
          placeholderTextColor="#8F8A82"
          secureTextEntry
          value={passwordForm.new_password}
          onChangeText={(value) =>
            setPasswordForm({ ...passwordForm, new_password: value })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar nueva contraseña"
          placeholderTextColor="#8F8A82"
          secureTextEntry
          value={passwordForm.confirm_password}
          onChangeText={(value) =>
            setPasswordForm({ ...passwordForm, confirm_password: value })
          }
        />

        <TouchableOpacity style={styles.secondaryButton} onPress={savePasswordChange}>
          <Text style={styles.secondaryButtonText}>Guardar contraseña</Text>
        </TouchableOpacity>
      </View>

      {userRole === "admin" ? (
        <TouchableOpacity onPress={() => navigation.navigate("Admin")}>
          <Text style={styles.link}>Panel admin</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity onPress={logout}>
        <Text style={styles.logout}>Volver al login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    padding: 24,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  title: {
    color: "#F3F0EA",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  user: {
    color: "#B07A4F",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#111315",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    color: "#B07A4F",
    fontSize: 12,
    marginBottom: 8,
  },
  value: {
    color: "#F3F0EA",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  zone: {
    fontSize: 18,
    fontWeight: "700",
  },
  inside: {
    color: "#7ED957",
  },
  outside: {
    color: "#FF5C5C",
  },
  distance: {
    color: "#F3F0EA",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#B07A4F",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
  secondaryButton: {
    borderColor: "#B07A4F",
    borderWidth: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  disabledSecondaryButton: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: "#B07A4F",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#111",
    color: "#F3F0EA",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderColor: "#333",
    borderWidth: 1,
  },

  link: {
    color: "#F3F0EA",
    textAlign: "center",
    marginTop: 12,
  },
  logout: {
    color: "#B07A4F",
    textAlign: "center",
    marginTop: 18,
    fontWeight: "700",
  },
});
