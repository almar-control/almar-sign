import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Location from "expo-location";

import type { NativeStackScreenProps } from 
"@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

import { checkIn, checkOut } from "../api/client";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "WorkerHome"
>;

type GpsData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export default function WorkerHomeScreen({
  navigation,
}: Props) {
  const [gps, setGps] = useState<GpsData | null>(null);

  const [gpsStatus, setGpsStatus] =
    useState("GPS pendiente");

  const [loadingGps, setLoadingGps] =
    useState(false);

  const [loadingRecord, setLoadingRecord] =
    useState(false);

  const userEmail = "worker@almar.com";

  async function getGps() {
    try {
      setLoadingGps(true);

      setGpsStatus("Solicitando permiso GPS...");

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setGps(null);

        setGpsStatus("GPS denegado");

        return;
      }

      setGpsStatus("Obteniendo ubicación real...");

      const position =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      if (
        !latitude ||
        !longitude ||
        latitude === 0 ||
        longitude === 0
      ) {
        setGps(null);

        setGpsStatus("GPS inválido");

        return;
      }

      setGps({
        latitude,
        longitude,
        accuracy,
      });

      setGpsStatus("GPS operativo");
    } catch {
      setGps(null);

      setGpsStatus("Error obteniendo GPS");
    } finally {
      setLoadingGps(false);
    }
  }

  async function handleCheckIn() {
    try {
      if (!gps) {
        Alert.alert(
          "GPS requerido",
          "Debes obtener GPS antes de fichar."
        );

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

      Alert.alert(
        "Entrada registrada",
        response.record.timestamp
      );
    } catch (error: any) {
      Alert.alert(
        "Error entrada",
        error.message || "No se pudo fichar entrada"
      );
    } finally {
      setLoadingRecord(false);
    }
  }

  async function handleCheckOut() {
    try {
      if (!gps) {
        Alert.alert(
          "GPS requerido",
          "Debes obtener GPS antes de fichar."
        );

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

      Alert.alert(
        "Salida registrada",
        response.record.timestamp
      );
    } catch (error: any) {
      Alert.alert(
        "Error salida",
        error.message || "No se pudo fichar salida"
      );
    } finally {
      setLoadingRecord(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Trabajador
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Estado GPS
        </Text>

        <Text style={styles.value}>
          {gpsStatus}
        </Text>

        {gps ? (
          <View style={styles.gpsBox}>
            <Text style={styles.gpsText}>
              Lat: {gps.latitude.toFixed(6)}
            </Text>

            <Text style={styles.gpsText}>
              Lng: {gps.longitude.toFixed(6)}
            </Text>

            <Text style={styles.gpsText}>
              Accuracy:{" "}
              {gps.accuracy
                ? `${Math.round(gps.accuracy)} m`
                : "N/D"}
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={getGps}
        disabled={loadingGps}
      >
        {loadingGps ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text style={styles.buttonText}>
            Comprobar GPS
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCheckIn}
        disabled={loadingRecord}
      >
        {loadingRecord ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text style={styles.buttonText}>
            Fichar entrada
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleCheckOut}
        disabled={loadingRecord}
      >
        {loadingRecord ? (
          <ActivityIndicator color="#B07A4F" />
        ) : (
          <Text style={styles.secondaryButtonText}>
            Fichar salida
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("History")
        }
      >
        <Text style={styles.link}>
          Ver historial
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    color: "#F3F0EA",
    fontSize: 32,
    fontWeight: "700",
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
    textTransform: "uppercase",
    marginBottom: 8,
  },

  value: {
    color: "#F3F0EA",
    fontSize: 18,
    fontWeight: "700",
  },

  gpsBox: {
    marginTop: 16,
  },

  gpsText: {
    color: "#F3F0EA",
    opacity: 0.8,
    marginBottom: 6,
  },

  button: {
    backgroundColor: "#B07A4F",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
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

  secondaryButtonText: {
    color: "#B07A4F",
    fontWeight: "700",
  },

  link: {
    color: "#F3F0EA",
    textAlign: "center",
    opacity: 0.9,
    marginTop: 12,
  },
});
