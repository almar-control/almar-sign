const API_BASE_URL = "http://192.168.1.37:8000";

export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend no responde correctamente");
  }

  return response.json();
}
