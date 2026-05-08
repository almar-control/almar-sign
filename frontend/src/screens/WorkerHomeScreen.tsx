import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Location from "expo-location";

import {
  getDistance,
} from "geolib";

import type {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import type {
  RootStackParamList,
} from "../navigation/AppNavigator";

import {
  checkIn,
  checkOut,
  getGpsSettings,
  getHours,
} from "../api/client";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "WorkerHome"
>;

type GpsData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type ZoneStatus =
  | "pending"
  | "inside"
  | "outside";

export default function WorkerHomeScreen({
  navigation,
}: Props) {
  const [gps, setGps] =
    useState<GpsData | null>(null);

  const [gpsStatus, setGpsStatus] =
    useState("GPS pendiente");

  const [loadingGps, setLoadingGps] =
    useState(false);

  const [loadingRecord, setLoadingRecord] =
    useState(false);

  const [zoneStatus, setZoneStatus] =
    useState<ZoneStatus>("pending");

  const [distance, setDistance] =
    useState<number | null>(null);

  const [hours, setHours] =
    useState<number>(0);

  const userEmail = "worker@almar.com";

  useEffect(() => {
    getGps();
    loadHours();
  }, []);

  async function loadHours() {
    try {
      const data = await getHours(
        userEmail
      );

      setHours(data.hours || 0);
    } catch (error) {
      console.log(error);
    }
  }

  async function getGps() {
    try {
      setLoadingGps(true);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setGpsStatus("GPS denegado");
        return;
      }

      const position =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      const accuracy =
        position.coords.accuracy;

      if (
        !latitude ||
        !longitude ||
        latitude === 0 ||
        longitude === 0
      ) {
        setGpsStatus("GPS inválido");
        return;
      }

      const gpsSettings =
        await getGpsSettings();

      const meters = getDistance(
        {
          latitude,
          longitude,
        },
        {
          latitude:
            gpsSettings.latitude,
          longitude:
            gpsSettings.longitude,
        }
      );

      setDistance(meters);

      if (
        meters <=
        gpsSettings.radius_meters
      ) {
        setZoneStatus("inside");
      } else {
        setZoneStatus("outside");
      }

      setGps({
        latitude,
        longitude,
        accuracy,
      });

      setGpsStatus("GPS operativo");
    } catch {
      setGpsStatus("Error GPS");
    } finally {
      setLoadingGps(false);
    }
  }

  async function handleCheckIn() {
    try {
      if (!gps) {
        Alert.alert(
          "GPS requerido"
        );

        return;
      }

      setLoadingRecord(true);

      const response =
        await checkIn({
          email: userEmail,
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          device: "expo-go",
        });

      await loadHours();

      Alert.alert(
        "Entrada registrada",
        response.record.timestamp
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message
      );
    } finally {
      setLoadingRecord(false);
    }
  }

  async function handleCheckOut() {
    try {
      if (!gps) {
        Alert.alert(
          "GPS requerido"
        );

        return;
      }

      setLoadingRecord(true);

      const response =
        await checkOut({
          email: userEmail,
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          device: "expo-go",
        });

      await loadHours();

      Alert.alert(
        "Salida registrada",
        response.record.timestamp
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message
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

        <Text
          style={[
            styles.zone,
            zoneStatus === "inside"
              ? styles.inside
              : styles.outside,
          ]}
        >
          {zoneStatus === "inside"
            ? "DENTRO ZONA"
            : "FUERA ZONA"}
        </Text>

        {distance !== null ? (
          <Text style={styles.distance}>
            Distancia: {distance} m
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Horas acumuladas
        </Text>

        <Text style={styles.value}>
          {hours} h
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={getGps}
      >
        {loadingGps ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text style={styles.buttonText}>
            Actualizar GPS
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCheckIn}
        disabled={loadingRecord}
      >
        <Text style={styles.buttonText}>
          Fichar entrada
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleCheckOut}
        disabled={loadingRecord}
      >
        <Text
          style={
            styles.secondaryButtonText
          }
        >
          Fichar salida
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate(
            "History"
          )
        }
      >
        <Text style={styles.link}>
          Ver historial
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Admin")
        }
      >
        <Text style={styles.link}>
          Panel admin
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
    marginTop: 12,
  },
});

