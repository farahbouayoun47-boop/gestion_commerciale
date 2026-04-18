import { API_BASE_URL } from '../utils/constants';
import { getCookie, deleteCookie } from '../utils/cookies';

const parseJsonResponse = async (response) => {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error('Le serveur a renvoyé une réponse inattendue. Vérifiez que le backend est démarré.');
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    throw new Error('Impossible de lire la réponse du serveur. Vérifiez que le backend est démarré.');
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Erreur de connexion');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Erreur d\'inscription');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const getCurrentUser = async () => {
  try {
    const token = getCookie('token');
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        deleteCookie('token');
        deleteCookie('user');
        return null;
      }
      throw new Error('Erreur de récupération du profil');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur getCurrentUser:', error);
    return null;
  }
};