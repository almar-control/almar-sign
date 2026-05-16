import { API_BASE_URL } from "../config/api";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
  createUser,
  getCompanyWorkplaceSettings,
  getWorkers,
  updateCompanyWorkplaceSettings,
  updateUserActive,
  updateUserContract,
} from "../api/client";


type Props = NativeStackScreenProps<RootStackParamList, "Admin">;

type RecordItem = {
  id: string;
  email: string;
  type: string;
  timestamp: string;
};

type Summary = {
  total_records: number;
  active_workers: number;
  worker_hours: number;
  last_record: RecordItem | null;
};

type WorkerItem = {
  email: string;
  name?: string;
  active?: boolean;
  hours: number;
  weekly_hours?: number;
  role?: string;
  company_id?: string;
  workplace_id?: string;
  last_record: RecordItem | null;
};

export default function AdminScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [showInactiveWorkers, setShowInactiveWorkers] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    company_name: "",
    workplace_name: "",
    latitude: "",
    longitude: "",
    radius_meters: "",
  });
  const [contractDrafts, setContractDrafts] = useState<Record<string, string>>({});
  const [newUser, setNewUser] = useState({
    name: "",
    surname: "",
    dni: "",
    phone: "",
    address: "",
    social_security_number: "",
    job_category: "",
    department: "",
    base_salary: "",
    iban: "",
    email: "",
    password: "",
    weekly_hours: "40",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    try {
      const summaryResponse = await fetch(`${API_BASE_URL}/admin/summary`);
      const summaryData = await summaryResponse.json();

      const settingsData = await getCompanyWorkplaceSettings();

      setCompanySettings({
        company_name: settingsData.company_name || "",
        workplace_name: settingsData.workplace_name || "",
        latitude: String(settingsData.latitude || ""),
        longitude: String(settingsData.longitude || ""),
        radius_meters: String(settingsData.radius_meters || ""),
      });

      const workersData = await getWorkers();
      const loadedWorkers = (workersData.workers || []).sort(
        (a: WorkerItem, b: WorkerItem) => {
          if (a.active !== b.active) {
            return a.active ? -1 : 1;
          }

          return (a.name || a.email).localeCompare(b.name || b.email);
        }
      );

      const drafts: Record<string, string> = {};

      loadedWorkers.forEach((worker: WorkerItem) => {
        drafts[worker.email] = String(worker.weekly_hours || 0);
      });

      setSummary(summaryData);
      setWorkers(loadedWorkers);
      setContractDrafts(drafts);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo cargar el panel admin");
    } finally {
      setLoading(false);
    }
  }


  async function saveCompanySettings() {
    try {
      const latitude = Number(companySettings.latitude);
      const longitude = Number(companySettings.longitude);
      const radiusMeters = Number(companySettings.radius_meters);

      if (!companySettings.company_name.trim() || !companySettings.workplace_name.trim()) {
        Alert.alert("Empresa", "Empresa y centro son obligatorios");
        return;
      }

      if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude === 0 || longitude === 0) {
        Alert.alert("GPS", "Latitud y longitud no válidas");
        return;
      }

      if (Number.isNaN(radiusMeters) || radiusMeters <= 0) {
        Alert.alert("GPS", "Radio no válido");
        return;
      }

      await updateCompanyWorkplaceSettings({
        company_name: companySettings.company_name,
        workplace_name: companySettings.workplace_name,
        latitude,
        longitude,
        radius_meters: radiusMeters,
      });

      await loadAdmin();

      Alert.alert("Empresa actualizada", "Datos de empresa y centro guardados");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar empresa y centro");
    }
  }

  async function handleCreateUser() {
    try {
      const weeklyHours = Number(newUser.weekly_hours);

      if (!newUser.name || !newUser.email || !newUser.password) {
        Alert.alert("Usuario", "Nombre, email y contraseña son obligatorios");
        return;
      }

      if (Number.isNaN(weeklyHours) || weeklyHours < 0) {
        Alert.alert("Contrato", "Horas no válidas");
        return;
      }

      await createUser({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        surname: newUser.surname,
        dni: newUser.dni,
        phone: newUser.phone,
        address: newUser.address,
        social_security_number: newUser.social_security_number,
        job_category: newUser.job_category,
        department: newUser.department,
        base_salary: Number(newUser.base_salary || 0),
        iban: newUser.iban,
        role: "worker",
        weekly_hours: weeklyHours,
      });

      setNewUser({
        name: "",
        surname: "",
        dni: "",
        phone: "",
        address: "",
        social_security_number: "",
        job_category: "",
        department: "",
        base_salary: "",
        iban: "",
        email: "",
        password: "",
        weekly_hours: "40",
      });

      await loadAdmin();
      Alert.alert("Usuario creado", "Trabajador creado correctamente");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear usuario");
    }
  }

  async function toggleWorkerActive(email: string, active: boolean) {
    try {
      await updateUserActive(email, active);
      await loadAdmin();

      Alert.alert(
        "Estado actualizado",
        active ? "Trabajador activado" : "Trabajador desactivado"
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar el estado");
    }
  }

  async function saveContract(email: string) {
    try {
      const value = Number(contractDrafts[email]);

      if (Number.isNaN(value) || value < 0) {
        Alert.alert("Contrato", "Introduce horas válidas");
        return;
      }

      await updateUserContract(email, value);
      await loadAdmin();

      Alert.alert("Contrato actualizado", `${email}: ${value} h/semana`);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo actualizar el contrato");
    }
  }

  async function openCsvExport() {
    const url = `${API_BASE_URL}/admin/export.csv`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log(error);
      Alert.alert("CSV", "No se pudo abrir el CSV");
    }
  }

  function formatRecordType(type?: string) {
    if (type === "in") return "ENTRADA";
    if (type === "out") return "SALIDA";
    return "Sin fichajes";
  }

  function formatDate(timestamp?: string) {
    if (!timestamp) return "Sin fecha";
    return new Date(timestamp).toLocaleString();
  }

  const workerStats = workers
    .filter((worker) => worker.role !== "admin")
    .reduce(
      (stats, worker) => {
        if (worker.active) {
          stats.active += 1;
        } else {
          stats.inactive += 1;
        }

        return stats;
      },
      { active: 0, inactive: 0 }
    );

  const filteredWorkers = workers
    .filter((worker) => worker.role !== "admin")
    .filter((worker) => showInactiveWorkers || worker.active)
    .filter((worker) => {
      const query = searchText.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        worker.email.toLowerCase().includes(query) ||
        (worker.name || "").toLowerCase().includes(query)
      );
    });

  async function logout() {
    await AsyncStorage.removeItem("user_email");
    await AsyncStorage.removeItem("user_role");
    navigation.replace("Login");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#B07A4F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.label}>Registros</Text>
            <Text style={styles.value}>{summary?.total_records ?? 0}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.label}>Trabajadores</Text>
            <Text style={styles.value}>{summary?.active_workers ?? 0}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.label}>Horas totales</Text>
            <Text style={styles.value}>{summary?.worker_hours ?? 0} h</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exportButton} onPress={openCsvExport}>
          <Text style={styles.exportButtonText}>Exportar CSV</Text>
        </TouchableOpacity>


        <Text style={styles.sectionTitle}>Empresa y centro</Text>

        <View style={styles.workerCard}>
          <TextInput
            style={styles.input}
            placeholder="Nombre empresa"
            placeholderTextColor="#8F8A82"
            value={companySettings.company_name}
            onChangeText={(value) =>
              setCompanySettings({ ...companySettings, company_name: value })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Nombre centro"
            placeholderTextColor="#8F8A82"
            value={companySettings.workplace_name}
            onChangeText={(value) =>
              setCompanySettings({ ...companySettings, workplace_name: value })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Latitud GPS"
            placeholderTextColor="#8F8A82"
            keyboardType="decimal-pad"
            value={companySettings.latitude}
            onChangeText={(value) =>
              setCompanySettings({
                ...companySettings,
                latitude: value.replace(",", "."),
              })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Longitud GPS"
            placeholderTextColor="#8F8A82"
            keyboardType="decimal-pad"
            value={companySettings.longitude}
            onChangeText={(value) =>
              setCompanySettings({
                ...companySettings,
                longitude: value.replace(",", "."),
              })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Radio permitido en metros"
            placeholderTextColor="#8F8A82"
            keyboardType="number-pad"
            value={companySettings.radius_meters}
            onChangeText={(value) =>
              setCompanySettings({ ...companySettings, radius_meters: value })
            }
          />

          <TouchableOpacity style={styles.saveButtonFull} onPress={saveCompanySettings}>
            <Text style={styles.saveButtonText}>Guardar empresa y centro</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Crear trabajador</Text>

        <View style={styles.workerCard}>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#8F8A82"
            value={newUser.name}
            onChangeText={(value) => setNewUser({ ...newUser, name: value })}
          />

          <TextInput
            style={styles.input}
            placeholder="Apellidos"
            placeholderTextColor="#8F8A82"
            value={newUser.surname}
            onChangeText={(value) => setNewUser({ ...newUser, surname: value })}
          />

          <TextInput
            style={styles.input}
            placeholder="DNI / NIE"
            placeholderTextColor="#8F8A82"
            autoCapitalize="characters"
            value={newUser.dni}
            onChangeText={(value) => setNewUser({ ...newUser, dni: value })}
          />

          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            placeholderTextColor="#8F8A82"
            keyboardType="phone-pad"
            value={newUser.phone}
            onChangeText={(value) => setNewUser({ ...newUser, phone: value })}
          />

          <TextInput
            style={styles.input}
            placeholder="Dirección"
            placeholderTextColor="#8F8A82"
            value={newUser.address}
            onChangeText={(value) => setNewUser({ ...newUser, address: value })}
          />

          <TextInput
            style={styles.input}
            placeholder="Número Seguridad Social"
            placeholderTextColor="#8F8A82"
            value={newUser.social_security_number}
            onChangeText={(value) =>
              setNewUser({ ...newUser, social_security_number: value })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Categoría"
            placeholderTextColor="#8F8A82"
            value={newUser.job_category}
            onChangeText={(value) =>
              setNewUser({ ...newUser, job_category: value })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Departamento"
            placeholderTextColor="#8F8A82"
            value={newUser.department}
            onChangeText={(value) =>
              setNewUser({ ...newUser, department: value })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Salario base"
            placeholderTextColor="#8F8A82"
            keyboardType="decimal-pad"
            value={newUser.base_salary}
            onChangeText={(value) =>
              setNewUser({ ...newUser, base_salary: value.replace(",", ".") })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="IBAN"
            placeholderTextColor="#8F8A82"
            autoCapitalize="characters"
            value={newUser.iban}
            onChangeText={(value) => setNewUser({ ...newUser, iban: value })}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8F8A82"
            autoCapitalize="none"
            keyboardType="email-address"
            value={newUser.email}
            onChangeText={(value) => setNewUser({ ...newUser, email: value })}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#8F8A82"
            secureTextEntry
            value={newUser.password}
            onChangeText={(value) => setNewUser({ ...newUser, password: value })}
          />

          <TextInput
            style={styles.input}
            placeholder="Horas semanales"
            placeholderTextColor="#8F8A82"
            keyboardType="decimal-pad"
            value={newUser.weekly_hours}
            onChangeText={(value) =>
              setNewUser({ ...newUser, weekly_hours: value.replace(",", ".") })
            }
          />

          <TouchableOpacity style={styles.saveButtonFull} onPress={handleCreateUser}>
            <Text style={styles.saveButtonText}>Crear trabajador</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Trabajadores</Text>

        <TextInput
          style={styles.input}
          placeholder="Buscar trabajador por nombre o email"
          placeholderTextColor="#8F8A82"
          autoCapitalize="none"
          value={searchText}
          onChangeText={setSearchText}
        />

        <View style={styles.filterRow}>
          <Text style={styles.resultCount}>
            {workerStats.active} activos · {workerStats.inactive} inactivos
          </Text>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowInactiveWorkers(!showInactiveWorkers)}
          >
            <Text style={styles.filterButtonText}>
              {showInactiveWorkers ? "Ocultar inactivos" : "Mostrar inactivos"}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item.email}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.workerCard,
                !item.active && styles.inactiveWorkerCard,
              ]}
            >
              {!item.active ? (
                <Text style={styles.inactiveLabel}>Trabajador oculto</Text>
              ) : null}

              <View style={styles.workerHeader}>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>
                    {item.name || item.email}
                  </Text>

                  <Text style={styles.workerEmail}>
                    {item.email}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.workerStatus,
                    item.active ? styles.workerActive : styles.workerInactive,
                  ]}
                >
                  {item.active ? "ACTIVO" : "INACTIVO"}
                </Text>
              </View>

              <View style={styles.workerMetaRow}>
                <Text style={styles.workerMeta}>
                  Rol: {item.role || "worker"}
                </Text>

                <Text style={styles.workerMeta}>
                  Horas: {item.hours} h
                </Text>
              </View>

              <Text style={styles.contract}>Contrato h/semana</Text>

              <View style={styles.contractRow}>
                <TextInput
                  style={styles.contractInput}
                  keyboardType="decimal-pad"
                  value={contractDrafts[item.email] || ""}
                  onChangeText={(value) =>
                    setContractDrafts({
                      ...contractDrafts,
                      [item.email]: value.replace(",", "."),
                    })
                  }
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => saveContract(item.email)}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.activeToggleButton,
                  item.active
                    ? styles.deactivateButton
                    : styles.activateButton,
                ]}
                onPress={() => toggleWorkerActive(item.email, !item.active)}
              >
                <Text style={styles.activeToggleButtonText}>
                  {item.active ? "Desactivar trabajador" : "Activar trabajador"}
                </Text>
              </TouchableOpacity>

              {item.last_record ? (
                <View style={styles.lastRecordBox}>
                  <Text style={styles.type}>
                    Último fichaje: {formatRecordType(item.last_record.type)}
                  </Text>

                  <Text style={styles.date}>
                    {formatDate(item.last_record.timestamp)}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay trabajadores con fichajes todavía</Text>
          }
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.button}
        onPress={logout}
      >
        <Text style={styles.buttonText}>Volver al login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    padding: 24,
    paddingTop: 60,
  },

  title: {
    color: "#F3F0EA",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 24,
  },

  grid: {
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    backgroundColor: "#111315",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },

  label: {
    color: "#B07A4F",
    fontSize: 12,
    marginBottom: 8,
  },

  value: {
    color: "#F3F0EA",
    fontSize: 24,
    fontWeight: "700",
  },

  exportButton: {
    backgroundColor: "#F3F0EA",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 24,
  },

  exportButtonText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },

  sectionTitle: {
    color: "#F3F0EA",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  input: {
    backgroundColor: "#0A0A0A",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 10,
    color: "#F3F0EA",
    padding: 12,
    marginBottom: 10,
  },

  saveButtonFull: {
    backgroundColor: "#B07A4F",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },

  workerCard: {
    backgroundColor: "#111315",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },




  filterRow: {
    marginBottom: 12,
  },

  filterButton: {
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },

  filterButtonText: {
    color: "#B07A4F",
    fontWeight: "700",
  },

  resultCount: {
    color: "#8F8A82",
    fontSize: 13,
    marginBottom: 12,
  },


  inactiveWorkerCard: {
    opacity: 0.82,
    borderColor: "#5A2A2A",
  },

  inactiveLabel: {
    color: "#FF5C5C",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
  },

  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },

  workerInfo: {
    flex: 1,
  },

  workerName: {
    color: "#F3F0EA",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  workerEmail: {
    color: "#8F8A82",
    fontSize: 13,
  },

  workerStatus: {
    fontSize: 11,
    fontWeight: "700",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: "hidden",
  },

  workerActive: {
    backgroundColor: "#163D22",
    color: "#7ED957",
  },

  workerInactive: {
    backgroundColor: "#3D1616",
    color: "#FF5C5C",
  },

  workerMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },

  workerMeta: {
    color: "#F3F0EA",
    opacity: 0.8,
    fontSize: 13,
  },

  activeToggleButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },

  activateButton: {
    backgroundColor: "#163D22",
    borderColor: "#7ED957",
    borderWidth: 1,
  },

  deactivateButton: {
    backgroundColor: "#3D1616",
    borderColor: "#FF5C5C",
    borderWidth: 1,
  },

  activeToggleButtonText: {
    color: "#F3F0EA",
    fontWeight: "700",
  },

  lastRecordBox: {
    backgroundColor: "#0A0A0A",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },

  email: {
    color: "#F3F0EA",
    fontWeight: "700",
    marginBottom: 8,
  },

  hours: {
    color: "#7ED957",
    fontWeight: "700",
    marginBottom: 8,
  },

  contract: {
    color: "#F3F0EA",
    opacity: 0.8,
    marginBottom: 8,
  },

  contractRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  contractInput: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 10,
    color: "#F3F0EA",
    padding: 12,
  },

  saveButton: {
    backgroundColor: "#B07A4F",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },

  saveButtonText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },

  type: {
    color: "#B07A4F",
    marginBottom: 6,
  },

  date: {
    color: "#F3F0EA",
    opacity: 0.8,
  },

  empty: {
    color: "#F3F0EA",
    opacity: 0.7,
    textAlign: "center",
    marginTop: 24,
  },

  button: {
    backgroundColor: "#B07A4F",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },

  buttonText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
});
