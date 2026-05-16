import { API_BASE_URL } from "../config/api";

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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error entrada");
  }

  return data;
}

export async function checkOut(payload: RecordPayload) {
  const response = await fetch(`${API_BASE_URL}/records/check-out`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error salida");
  }

  return data;
}

export async function getRecords() {
  const response = await fetch(`${API_BASE_URL}/records`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar registros");
  }

  return response.json();
}

export async function getGpsSettings() {
  const response = await fetch(
    `${API_BASE_URL}/settings/gps`
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar GPS");
  }

  return response.json();
}

export async function getHours(email: string) {
  const response = await fetch(
    `${API_BASE_URL}/admin/hours/${email}`
  );

  if (!response.ok) {
    throw new Error(
      "No se pudieron cargar horas"
    );
  }

  return response.json();
}

export async function getWorkers() {
  const response = await fetch(
    `${API_BASE_URL}/admin/workers`
  );

  if (!response.ok) {
    throw new Error(
      "No se pudieron cargar trabajadores"
    );
  }

  return response.json();
}


export async function updateUserContract(
  email: string,
  weeklyHours: number
) {
  const response = await fetch(
    `${API_BASE_URL}/admin/users/${email}/contract`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        weekly_hours: weeklyHours,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo actualizar contrato"
    );
  }

  return response.json();
}


export async function updateUserActive(
  email: string,
  active: boolean
) {
  const response = await fetch(
    `${API_BASE_URL}/admin/users/${email}/active`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "No se pudo actualizar estado");
  }

  return data;
}


export type CreateUserPayload = {
  email: string;
  password: string;
  name: string;
  surname: string;
  dni: string;
  phone?: string;
  address?: string;
  social_security_number?: string;
  job_category?: string;
  department?: string;
  base_salary?: number;
  iban?: string;
  role: string;
  company_id?: string;
  workplace_id?: string;
  weekly_hours: number;
};

export async function createUser(payload: CreateUserPayload) {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "No se pudo crear usuario");
  }

  return data;
}


export type CompanyWorkplaceSettings = {
  company_id: string;
  company_name: string;
  workplace_id: string;
  workplace_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

export async function getCompanyWorkplaceSettings() {
  const response = await fetch(`${API_BASE_URL}/admin/settings/company-workplace`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "No se pudo cargar empresa y centro");
  }

  return data;
}

export async function updateCompanyWorkplaceSettings(
  payload: Omit<CompanyWorkplaceSettings, "company_id" | "workplace_id">
) {
  const response = await fetch(`${API_BASE_URL}/admin/settings/company-workplace`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "No se pudo actualizar empresa y centro");
  }

  return data;
}


export type UpdateUserPayload = {
  name: string;
  surname: string;
  dni: string;
  phone: string;
  address: string;
  social_security_number: string;
  department: string;
  job_category: string;
  base_salary: number;
  iban: string;
  password?: string;
};

export async function updateUser(email: string, payload: UpdateUserPayload) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${email}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "No se pudo actualizar trabajador");
  }

  return data;
}
