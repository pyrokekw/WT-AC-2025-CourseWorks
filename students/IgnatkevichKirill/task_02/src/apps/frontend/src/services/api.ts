// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // порт твоего NestJS бэкенда
  headers: { 'Content-Type': 'application/json' },
});

// Добавляем токен в каждый запрос
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Автоматический выход при 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', res.data.access_token);
  localStorage.setItem('user', JSON.stringify(res.data.user));
  return res.data.user;
};

export const register = async (data: { email: string; password: string; name: string }) => {
  const res = await api.post('/auth/register', data);
  localStorage.setItem('token', res.data.access_token);
  localStorage.setItem('user', JSON.stringify(res.data.user));
  return res.data.user;
};

export default api;

export const getHackathons = async (status?: string) => {
  const url = status ? `/hackathons?status=${status}` : '/hackathons';
  return api.get(url);
};

export const getHackathon = async (id: string) => {
  return api.get(`/hackathons/${id}`);
};

export const joinHackathon = async (id: string) => {
  return api.post(`/hackathons/${id}/join`);
};

export const submitIdeaToHackathon = async (hackathonId: string, ideaId: string) => {
  return api.post(`/hackathons/${hackathonId}/ideas`, { ideaId });
};

export const voteForHackathonIdea = async (hackathonId: string, hackathonIdeaId: string) => {
  return api.post(`/hackathons/${hackathonId}/ideas/${hackathonIdeaId}/vote`);
};

export const getHackathonLeaderboard = async (hackathonId: string, limit = 10) => {
  return api.get(`/hackathons/${hackathonId}/leaderboard?limit=${limit}`);
};