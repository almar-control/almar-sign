const API_BASE_URL = "http://192.168.1.37:8000";

export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend no responde correctamente");
  }

  return response.json();
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Credenciales incorrectas");
  }

  return response.json();
}

type RecordPayload = {
  email: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  device: string;
};

export async function checkIn(payload: RecordPayload) {
  const response = await fetch(`${API_BASE_URL}/records/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error en entrada");
  }

  return data;
}

export async function checkOut(payload: RecordPayload) {
  const response = await fetch(`${API_BASE_URL}/records/check-out`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error en salida");
  }

  return data;
}
