const CAKTO_BASE_URL = 'https://api.cakto.com.br';

interface CaktoTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

let cachedToken: string | null = null;
let tokenExpiration: number = 0;

export async function getCaktoAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiration) {
    return cachedToken;
  }

  const clientId = process.env.CAKTO_CLIENT_ID;
  const clientSecret = process.env.CAKTO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Cakto credentials not configured');
  }

  const response = await fetch(`${CAKTO_BASE_URL}/public_api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Cakto token: ${error}`);
  }

  const data: CaktoTokenResponse = await response.json();
  
  cachedToken = data.access_token;
  tokenExpiration = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}

export async function caktoFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getCaktoAccessToken();

  const response = await fetch(`${CAKTO_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error');
    throw new Error(`Cakto API error: ${response.status} - ${error}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}