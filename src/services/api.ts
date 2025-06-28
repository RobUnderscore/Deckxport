const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.magicthegathering.io/v1'

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  cards: {
    search: (query: string) => 
      fetchJson<{ cards: any[] }>(`${API_BASE_URL}/cards?name=${encodeURIComponent(query)}`),
    getById: (id: string) => 
      fetchJson<{ card: any }>(`${API_BASE_URL}/cards/${id}`),
  },
}