import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../config';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || API_BASE,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para añadir token
    this.api.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(nombre: string, email: string, password: string) {
    const response = await this.api.post('/auth/register', { nombre, email, password });
    return response.data;
  }

  async validateEmail(token: string) {
    const response = await this.api.post('/auth/validate-email', { token });
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.api.post('/auth/reset-password', { token, password });
    return response.data;
  }

  async refreshToken() {
    const refreshToken = useAuthStore.getState().refreshToken;
    const response = await this.api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  // Metas endpoints
  async getMetas() {
    const response = await this.api.get('/metas');
    return response.data;
  }

  async getMeta(id: number) {
    const response = await this.api.get(`/metas/${id}`);
    return response.data;
  }

  async createMeta(meta: any) {
    const response = await this.api.post('/metas', meta);
    return response.data;
  }

  async updateMeta(id: number, meta: any) {
    const response = await this.api.put(`/metas/${id}`, meta);
    return response.data;
  }

  async deleteMeta(id: number) {
    const response = await this.api.delete(`/metas/${id}`);
    return response.data;
  }

  // Contratistas endpoints
  async getContratistas() {
    const response = await this.api.get('/contratistas');
    return response.data;
  }

  async createContratista(contratista: any) {
    const response = await this.api.post('/contratistas', contratista);
    return response.data;
  }

  async updateContratista(id: number, contratista: any) {
    const response = await this.api.put(`/contratistas/${id}`, contratista);
    return response.data;
  }

  async deleteContratista(id: number) {
    const response = await this.api.delete(`/contratistas/${id}`);
    return response.data;
  }

  // Avances endpoints
  async getAvances(metaId?: number) {
    const url = metaId ? `/avances?meta_id=${metaId}` : '/avances';
    const response = await this.api.get(url);
    return response.data;
  }

  async createAvance(avance: any) {
    const response = await this.api.post('/avances', avance);
    return response.data;
  }

  async updateAvance(id: number, avance: any) {
    const response = await this.api.put(`/avances/${id}`, avance);
    return response.data;
  }

  async deleteAvance(id: number) {
    const response = await this.api.delete(`/avances/${id}`);
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardStats() {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  // Generic methods
  get(url: string, config?: AxiosRequestConfig) {
    return this.api.get(url, config);
  }

  post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.post(url, data, config);
  }

  put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.put(url, data, config);
  }

  delete(url: string, config?: AxiosRequestConfig) {
    return this.api.delete(url, config);
  }
}

export const apiService = new ApiService();
export default apiService;
