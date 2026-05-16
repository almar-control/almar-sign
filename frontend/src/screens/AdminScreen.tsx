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
  Image,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
  changePassword,
  correctRecord,
  createUser,
  getCompanyWorkplaceSettings,
  getWorkers,
  updateCompanyWorkplaceSettings,
  updateUser,
  updateUserActive,
  updateUserContract,
} from "../api/client";


type Props = NativeStackScreenProps<RootStackParamList, "Admin">;

type RecordItem = {
  id: string;
  email: string;
  type: string;
  timestamp: string;
  status?: string;
  status_reason?: string;
  distance_meters?: number | null;
  allowed_radius_meters?: number | null;
  correction_reason?: string;
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
  surname?: string;
  dni?: string;
  phone?: string;
  address?: string;
  social_security_number?: string;
  department?: string;
  job_category?: string;
  base_salary?: number;
  iban?: string;
  active?: boolean;
  hours: number;
  total_hours?: number;
  today_hours?: number;
  week_hours?: number;
  month_hours?: number;
  weekly_balance?: number;
  open_shift?: boolean;
  weekly_hours?: number;
  role?: string;
  company_id?: string;
  workplace_id?: string;
  last_record: RecordItem | null;
};

export default function AdminScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [activeAdminSection, setActiveAdminSection] = useState("resumen");
  const [workerPanel, setWorkerPanel] = useState("listado");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [recordStatusFilter, setRecordStatusFilter] = useState("all");
  const [recordSearch, setRecordSearch] = useState("");
  const [adminIdentity, setAdminIdentity] = useState({
    name: "Admin",
    email: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
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
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recordCorrection, setRecordCorrection] = useState({
    type: "in",
    timestamp: "",
    reason: "",
  });
  const [editUser, setEditUser] = useState({
    name: "",
    surname: "",
    dni: "",
    phone: "",
    department: "",
    job_category: "",
    base_salary: "",
    iban: "",
  });
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
    loadAdminIdentity();
    loadAdmin();
  }, []);

  async function loadAdminIdentity() {
    const email = await AsyncStorage.getItem("user_email");
    const name = await AsyncStorage.getItem("user_name");

    setAdminIdentity({
      name: name || "Admin",
      email: email || "",
    });
  }

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

      const recordsResponse = await fetch(`${API_BASE_URL}/admin/records`);
      const recordsData = await recordsResponse.json();

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
      setRecords(recordsData.records || []);
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


  function startEditWorker(worker: WorkerItem) {
    setEditingEmail(worker.email);
    setEditUser({
      name: worker.name || "",
      surname: worker.surname || "",
      dni: worker.dni || "",
      phone: worker.phone || "",
      department: worker.department || "",
      job_category: worker.job_category || "",
      base_salary: String(worker.base_salary || ""),
      iban: worker.iban || "",
    });
  }

  function cancelEditWorker() {
    setEditingEmail(null);
  }

  async function saveEditWorker() {
    if (!editingEmail) return;

    try {
      await updateUser(editingEmail, {
        name: editUser.name,
        surname: editUser.surname,
        dni: editUser.dni,
        phone: editUser.phone,
        address: "",
        social_security_number: "",
        department: editUser.department,
        job_category: editUser.job_category,
        base_salary: Number(editUser.base_salary || 0),
        iban: editUser.iban,
        password: "",
      });

      await loadAdmin();
      setEditingEmail(null);
      Alert.alert("Trabajador actualizado");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar");
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

  async function savePasswordChange() {
    try {
      const adminEmail = await AsyncStorage.getItem("user_email");

      if (!adminEmail) {
        Alert.alert("Sesión", "No se encontró el usuario actual");
        return;
      }

      if (!passwordForm.current_password || !passwordForm.new_password) {
        Alert.alert("Contraseña", "Rellena contraseña actual y nueva");
        return;
      }

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        Alert.alert("Contraseña", "La nueva contraseña no coincide");
        return;
      }

      await changePassword({
        email: adminEmail,
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

  async function openCsvExport() {
    const url = `${API_BASE_URL}/admin/export.csv`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log(error);
      Alert.alert("CSV", "No se pudo abrir el CSV");
    }
  }

  async function exportFilteredRecordsCsv() {
    try {
      const header = [
        "email",
        "tipo",
        "fecha",
        "estado",
        "motivo_estado",
        "distancia_metros",
        "radio_metros",
        "motivo_correccion",
      ];

      const rows = filteredRecords.map((record) => [
        record.email,
        formatRecordType(record.type),
        formatDate(record.timestamp),
        formatRecordStatus(record.status),
        record.status_reason || "",
        record.distance_meters ?? "",
        record.allowed_radius_meters ?? "",
        record.correction_reason || "",
      ]);

      const csv = [header, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

      const file = new FileSystem.File(
        FileSystem.Paths.cache,
        `almar_records_${Date.now()}.csv`
      );

      file.write(csv);

      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Exportar fichajes CSV",
      });
    } catch (error) {
      console.log(error);
      Alert.alert("CSV", "No se pudo exportar el CSV filtrado");
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

  function formatRecordStatus(status?: string) {
    if (status === "valid") return "Válido";
    if (status === "review") return "Revisar";
    if (status === "corrected") return "Corregido";
    return "Sin estado";
  }

  function startCorrectRecord(record: RecordItem) {
    setEditingRecordId(record.id);
    setRecordCorrection({
      type: record.type,
      timestamp: record.timestamp,
      reason: "",
    });
  }

  function cancelCorrectRecord() {
    setEditingRecordId(null);
    setRecordCorrection({
      type: "in",
      timestamp: "",
      reason: "",
    });
  }

  async function saveRecordCorrection() {
    try {
      if (!editingRecordId) {
        return;
      }

      if (!recordCorrection.reason.trim()) {
        Alert.alert("Corrección", "El motivo es obligatorio");
        return;
      }

      await correctRecord(editingRecordId, {
        type: recordCorrection.type,
        timestamp: recordCorrection.timestamp,
        reason: recordCorrection.reason,
      });

      cancelCorrectRecord();
      await loadAdmin();

      Alert.alert("Fichaje corregido");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo corregir fichaje");
    }
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

  const filteredRecords = records
    .filter((record) => {
      if (recordStatusFilter === "all") {
        return true;
      }

      return record.status === recordStatusFilter;
    })
    .filter((record) => {
      const query = recordSearch.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return record.email.toLowerCase().includes(query);
    });

  function SectionHeader({ title }: { title: string }) {
    return (
      <View style={styles.sectionHeaderCard}>
        <Image
          source={require("../../assets/logo_blanco.png")}
          style={styles.sectionLogo}
          resizeMode="contain"
        />

        <View>
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
          <Text style={styles.sectionHeaderSubtitle}>
            {adminIdentity.name} · {adminIdentity.email}
          </Text>
        </View>
      </View>
    );
  }

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
      <View style={styles.adminHeader}>
        <Image
          source={require("../../assets/logo_blanco.png")}
          style={styles.adminLogo}
          resizeMode="contain"
        />

        <View>
          <Text style={styles.title}>{adminIdentity.name}</Text>
          <Text style={styles.subtitle}>{adminIdentity.email || "Panel admin"}</Text>
        </View>
      </View>

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

        <View style={styles.adminSectionTabs}>
          {[
            ["resumen", "Resumen"],
            ["trabajadores", "Trabajadores"],
            ["horas", "Horas"],
            ["fichajes", "Fichajes"],
            ["empresa", "Empresa"],
            ["cuenta", "Cuenta"],
          ].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.adminSectionTab,
                activeAdminSection === key && styles.adminSectionTabActive,
              ]}
              onPress={() => setActiveAdminSection(key)}
            >
              <Text
                style={[
                  styles.adminSectionTabText,
                  activeAdminSection === key && styles.adminSectionTabTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeAdminSection === "resumen" ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Resumen general" />

            <Text style={styles.sectionHint}>
              Vista rápida del estado actual de registros, trabajadores y horas.
            </Text>

            <TouchableOpacity style={styles.exportButton} onPress={openCsvExport}>
          <Text style={styles.exportButtonText}>Exportar CSV</Text>
        </TouchableOpacity>
          </View>
        ) : null}

        {activeAdminSection === "cuenta" ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Cuenta" />

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => setShowPasswordForm(!showPasswordForm)}
            >
          <Text style={styles.exportButtonText}>
            {showPasswordForm ? "Cerrar cambio de contraseña" : "Cambiar mi contraseña"}
          </Text>
        </TouchableOpacity>

        {showPasswordForm ? (
          <View style={styles.workerCard}>
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

          <TouchableOpacity style={styles.saveButtonFull} onPress={savePasswordChange}>
            <Text style={styles.saveButtonText}>Guardar nueva contraseña</Text>
          </TouchableOpacity>
        </View>
            ) : null}
          </View>
        ) : null}

        {activeAdminSection === "empresa" ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Empresa y centro" />

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
          </View>
        ) : null}

        {activeAdminSection === "trabajadores" ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Trabajadores" />

            <View style={styles.subSectionTabs}>
              <TouchableOpacity
                style={[
                  styles.subSectionTab,
                  workerPanel === "listado" && styles.subSectionTabActive,
                ]}
                onPress={() => setWorkerPanel("listado")}
              >
                <Text
                  style={[
                    styles.subSectionTabText,
                    workerPanel === "listado" && styles.subSectionTabTextActive,
                  ]}
                >
                  📋 Listado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subSectionTab,
                  workerPanel === "crear" && styles.subSectionTabActive,
                ]}
                onPress={() => setWorkerPanel("crear")}
              >
                <Text
                  style={[
                    styles.subSectionTabText,
                    workerPanel === "crear" && styles.subSectionTabTextActive,
                  ]}
                >
                  ➕ Crear
                </Text>
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

          </View>
        ) : null}

        {activeAdminSection === "fichajes" ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Fichajes" />

            <Text style={styles.sectionTitle}>Últimos fichajes</Text>

        <TextInput
          style={styles.input}
          placeholder="Buscar trabajador por email"
          placeholderTextColor="#8F8A82"
          value={recordSearch}
          onChangeText={setRecordSearch}
        />

        <View style={styles.recordFilterRow}>
          {["all", "valid", "review", "corrected"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.recordFilterButton,
                recordStatusFilter === status && styles.recordFilterButtonActive,
              ]}
              onPress={() => setRecordStatusFilter(status)}
            >
              <Text style={styles.recordFilterText}>
                {status === "all"
                  ? "Todos"
                  : status === "valid"
                    ? "Válidos"
                    : status === "review"
                      ? "Revisar"
                      : "Corregidos"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportFilteredRecordsCsv}
        >
          <Text style={styles.exportButtonText}>
            Exportar fichajes filtrados CSV
          </Text>
        </TouchableOpacity>

        {filteredRecords.slice(0, 30).map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <Text style={styles.workerName}>{record.email}</Text>

            <Text style={styles.workerMeta}>
              {formatRecordType(record.type)} · {formatDate(record.timestamp)}
            </Text>

            <Text
              style={[
                styles.recordStatus,
                record.status === "valid"
                  ? styles.recordStatusValid
                  : styles.recordStatusReview,
              ]}
            >
              {formatRecordStatus(record.status)}
              {record.status_reason ? ` · ${record.status_reason}` : ""}
            </Text>

            {record.correction_reason ? (
              <Text style={styles.recordDistance}>
                Motivo: {record.correction_reason}
              </Text>
            ) : null}

            {record.distance_meters !== undefined && record.distance_meters !== null ? (
              <Text style={styles.recordDistance}>
                Distancia: {record.distance_meters} m / radio{" "}
                {record.allowed_radius_meters ?? "-"} m
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.correctRecordButton}
              onPress={() => startCorrectRecord(record)}
            >
              <Text style={styles.correctRecordButtonText}>Corregir fichaje</Text>
            </TouchableOpacity>
          </View>
        ))}

          </View>
        ) : null}

        {activeAdminSection === "trabajadores" ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Listado trabajadores</Text>

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
                  Total: {item.total_hours ?? item.hours} h
                </Text>
              </View>

              <View style={styles.hoursGrid}>
                <View style={styles.hourBox}>
                  <Text style={styles.hourLabel}>Hoy</Text>
                  <Text style={styles.hourValue}>{item.today_hours ?? 0} h</Text>
                </View>

                <View style={styles.hourBox}>
                  <Text style={styles.hourLabel}>Semana</Text>
                  <Text style={styles.hourValue}>{item.week_hours ?? 0} h</Text>
                </View>

                <View style={styles.hourBox}>
                  <Text style={styles.hourLabel}>Mes</Text>
                  <Text style={styles.hourValue}>{item.month_hours ?? 0} h</Text>
                </View>
              </View>

              <Text
                style={[
                  styles.weeklyBalance,
                  (item.weekly_balance ?? 0) >= 0
                    ? styles.positiveBalance
                    : styles.negativeBalance,
                ]}
              >
                Balance semanal: {(item.weekly_balance ?? 0) >= 0 ? "+" : ""}
                {item.weekly_balance ?? 0} h
              </Text>

              {item.open_shift ? (
                <Text style={styles.openShift}>Turno abierto ahora</Text>
              ) : null}

              <TouchableOpacity
                style={styles.editWorkerButton}
                onPress={() => startEditWorker(item)}
              >
                <Text style={styles.editWorkerButtonText}>Editar trabajador</Text>
              </TouchableOpacity>

              {editingEmail === item.email ? (
                <View style={styles.editPanel}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre"
                    placeholderTextColor="#8F8A82"
                    value={editUser.name}
                    onChangeText={(value) => setEditUser({ ...editUser, name: value })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Apellidos"
                    placeholderTextColor="#8F8A82"
                    value={editUser.surname}
                    onChangeText={(value) => setEditUser({ ...editUser, surname: value })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="DNI / NIE"
                    placeholderTextColor="#8F8A82"
                    value={editUser.dni}
                    onChangeText={(value) => setEditUser({ ...editUser, dni: value })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Teléfono"
                    placeholderTextColor="#8F8A82"
                    value={editUser.phone}
                    onChangeText={(value) => setEditUser({ ...editUser, phone: value })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Departamento"
                    placeholderTextColor="#8F8A82"
                    value={editUser.department}
                    onChangeText={(value) => setEditUser({ ...editUser, department: value })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Categoría"
                    placeholderTextColor="#8F8A82"
                    value={editUser.job_category}
                    onChangeText={(value) => setEditUser({ ...editUser, job_category: value })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Salario base"
                    placeholderTextColor="#8F8A82"
                    keyboardType="decimal-pad"
                    value={editUser.base_salary}
                    onChangeText={(value) =>
                      setEditUser({ ...editUser, base_salary: value.replace(",", ".") })
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="IBAN"
                    placeholderTextColor="#8F8A82"
                    value={editUser.iban}
                    onChangeText={(value) => setEditUser({ ...editUser, iban: value })}
                  />

                  <TouchableOpacity style={styles.saveButtonFull} onPress={saveEditWorker}>
                    <Text style={styles.saveButtonText}>Guardar trabajador</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelEditButton} onPress={cancelEditWorker}>
                    <Text style={styles.cancelEditButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

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

                  <Text
                    style={[
                      styles.recordStatus,
                      item.last_record.status === "valid"
                        ? styles.recordStatusValid
                        : styles.recordStatusReview,
                    ]}
                  >
                    {formatRecordStatus(item.last_record.status)}
                    {item.last_record.status_reason
                      ? ` · ${item.last_record.status_reason}`
                      : ""}
                  </Text>

                  {item.last_record.distance_meters !== undefined &&
                  item.last_record.distance_meters !== null ? (
                    <Text style={styles.recordDistance}>
                      Distancia: {item.last_record.distance_meters} m / radio{" "}
                      {item.last_record.allowed_radius_meters ?? "-"} m
                    </Text>
                  ) : null}

                  {item.last_record.correction_reason ? (
                    <Text style={styles.recordDistance}>
                      Motivo: {item.last_record.correction_reason}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.correctRecordButton}
                    onPress={() => item.last_record && startCorrectRecord(item.last_record)}
                  >
                    <Text style={styles.correctRecordButtonText}>
                      Corregir último fichaje
                    </Text>
                  </TouchableOpacity>

                  {editingRecordId === item.last_record.id ? (
                    <View style={styles.correctionPanel}>
                      <Text style={styles.contract}>Tipo corregido</Text>

                      <View style={styles.correctionTypeRow}>
                        <TouchableOpacity
                          style={[
                            styles.correctionTypeButton,
                            recordCorrection.type === "in" && styles.correctionTypeSelected,
                          ]}
                          onPress={() =>
                            setRecordCorrection({ ...recordCorrection, type: "in" })
                          }
                        >
                          <Text style={styles.correctionTypeText}>Entrada</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.correctionTypeButton,
                            recordCorrection.type === "out" && styles.correctionTypeSelected,
                          ]}
                          onPress={() =>
                            setRecordCorrection({ ...recordCorrection, type: "out" })
                          }
                        >
                          <Text style={styles.correctionTypeText}>Salida</Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        style={styles.input}
                        placeholder="Fecha ISO"
                        placeholderTextColor="#8F8A82"
                        value={recordCorrection.timestamp}
                        onChangeText={(value) =>
                          setRecordCorrection({ ...recordCorrection, timestamp: value })
                        }
                      />

                      <TextInput
                        style={styles.input}
                        placeholder="Motivo obligatorio"
                        placeholderTextColor="#8F8A82"
                        value={recordCorrection.reason}
                        onChangeText={(value) =>
                          setRecordCorrection({ ...recordCorrection, reason: value })
                        }
                      />

                      <TouchableOpacity
                        style={styles.saveButtonFull}
                        onPress={saveRecordCorrection}
                      >
                        <Text style={styles.saveButtonText}>Guardar corrección</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelEditButton}
                        onPress={cancelCorrectRecord}
                      >
                        <Text style={styles.cancelEditButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay trabajadores con fichajes todavía</Text>
          }
        />
          </View>
        ) : null}

        {activeAdminSection === "horas" ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Horas" />

            <Text style={styles.sectionHint}>
              Resumen preparado para contrato, horas realizadas, pendientes, extras,
              nocturnas y festivas. Los cálculos actuales ya se muestran dentro de
              cada trabajador.
            </Text>

            <View style={styles.hoursGrid}>
              <View style={styles.hourBox}>
                <Text style={styles.hourLabel}>Horas totales</Text>
                <Text style={styles.hourValue}>{summary?.worker_hours ?? 0} h</Text>
              </View>

              <View style={styles.hourBox}>
                <Text style={styles.hourLabel}>Activos</Text>
                <Text style={styles.hourValue}>{workerStats.active}</Text>
              </View>

              <View style={styles.hourBox}>
                <Text style={styles.hourLabel}>Inactivos</Text>
                <Text style={styles.hourValue}>{workerStats.inactive}</Text>
              </View>
            </View>
          </View>
        ) : null}
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


  adminHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 28,
  },

  adminLogo: {
    width: 96,
    height: 96,
    borderRadius: 20,
    opacity: 0.92,
    marginRight: 6,
  },

  title: {
    color: "#F3F0EA",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },

  subtitle: {
    color: "#B07A4F",
    fontSize: 14,
    fontWeight: "600",
  },


  subSectionTabs: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  subSectionTab: {
    flex: 1,
    backgroundColor: "#050505",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  subSectionTabActive: {
    borderColor: "#1E5EFF",
    backgroundColor: "#0B1F4D",
  },

  subSectionTabText: {
    color: "#8F8A82",
    fontWeight: "700",
    fontSize: 13,
  },

  subSectionTabTextActive: {
    color: "#FFFFFF",
  },

  adminSectionTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  adminSectionTab: {
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#050505",
  },

  adminSectionTabActive: {
    borderColor: "#B07A4F",
    backgroundColor: "#24180F",
  },

  adminSectionTabText: {
    color: "#8F8A82",
    fontWeight: "700",
    fontSize: 12,
  },

  adminSectionTabTextActive: {
    color: "#F3F0EA",
  },

  sectionBlock: {
    marginBottom: 24,
  },

  sectionHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#050505",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },

  sectionLogo: {
    width: 48,
    height: 48,
  },

  sectionHeaderTitle: {
    color: "#F3F0EA",
    fontSize: 18,
    fontWeight: "700",
  },

  sectionHeaderSubtitle: {
    color: "#8F8A82",
    fontSize: 12,
    marginTop: 3,
  },

  sectionHint: {
    color: "#8F8A82",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
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


  hoursGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  hourBox: {
    flex: 1,
    backgroundColor: "#050505",
    borderRadius: 12,
    padding: 10,
    borderColor: "#1F1F1F",
    borderWidth: 1,
  },

  hourLabel: {
    color: "#8F8A82",
    fontSize: 11,
    marginBottom: 4,
  },

  hourValue: {
    color: "#F3F0EA",
    fontSize: 15,
    fontWeight: "700",
  },

  weeklyBalance: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },

  positiveBalance: {
    color: "#7ED957",
  },

  negativeBalance: {
    color: "#FFB020",
  },

  openShift: {
    color: "#7ED957",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },

  editWorkerButton: {
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 14,
  },

  editWorkerButtonText: {
    color: "#B07A4F",
    fontWeight: "700",
  },

  editPanel: {
    backgroundColor: "#050505",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },

  cancelEditButton: {
    borderColor: "#777",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },

  cancelEditButtonText: {
    color: "#AAA",
    fontWeight: "700",
  },




  recordFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  recordFilterButton: {
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  recordFilterButtonActive: {
    backgroundColor: "#24180F",
    borderColor: "#B07A4F",
  },

  recordFilterText: {
    color: "#F3F0EA",
    fontSize: 12,
    fontWeight: "700",
  },

  recordCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderColor: "#222",
    borderWidth: 1,
  },

  correctRecordButton: {
    borderColor: "#FFB020",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },

  correctRecordButtonText: {
    color: "#FFB020",
    fontWeight: "700",
  },

  correctionPanel: {
    backgroundColor: "#050505",
    borderColor: "#FFB020",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },

  correctionTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  correctionTypeButton: {
    flex: 1,
    borderColor: "#777",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },

  correctionTypeSelected: {
    borderColor: "#B07A4F",
    backgroundColor: "#24180F",
  },

  correctionTypeText: {
    color: "#F3F0EA",
    fontWeight: "700",
  },

  recordStatus: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },

  recordStatusValid: {
    color: "#7ED957",
  },

  recordStatusReview: {
    color: "#FFB020",
  },

  recordDistance: {
    color: "#8F8A82",
    fontSize: 12,
    marginTop: 4,
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
