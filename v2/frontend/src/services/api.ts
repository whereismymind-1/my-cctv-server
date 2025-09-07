import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  AuthResponse,
  LoginForm,
  RegisterForm,
  Stream,
  CreateStreamForm,
  Comment,
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: RegisterForm): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      API_ENDPOINTS.auth.register,
      data
    );
    return response.data;
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      data
    );
    return response.data;
  }

  async getMe() {
    const response = await this.client.get(API_ENDPOINTS.auth.me);
    return response.data;
  }

  // Stream endpoints
  async getStreams(params?: {
    status?: 'live' | 'ended' | 'waiting';
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const response = await this.client.get<{
      streams: Stream[];
      total: number;
      page: number;
      limit: number;
    }>(API_ENDPOINTS.streams.list, { params });
    return response.data;
  }

  async getStream(id: string): Promise<Stream> {
    const response = await this.client.get<Stream>(
      API_ENDPOINTS.streams.detail(id)
    );
    return response.data;
  }

  async createStream(data: CreateStreamForm): Promise<Stream> {
    const response = await this.client.post<Stream>(
      API_ENDPOINTS.streams.create,
      data
    );
    return response.data;
  }

  async startStream(id: string) {
    const response = await this.client.post(API_ENDPOINTS.streams.start(id));
    return response.data;
  }

  async endStream(id: string) {
    const response = await this.client.post(API_ENDPOINTS.streams.end(id));
    return response.data;
  }

  async deleteStream(id: string) {
    await this.client.delete(API_ENDPOINTS.streams.delete(id));
  }

  async getStreamComments(
    streamId: string,
    params?: { limit?: number; offset?: number }
  ) {
    const response = await this.client.get<{
      comments: Comment[];
      total: number;
      hasMore: boolean;
    }>(API_ENDPOINTS.streams.comments(streamId), { params });
    return response.data;
  }

  // Health check
  async checkHealth() {
    const response = await this.client.get(API_ENDPOINTS.health.check);
    return response.data;
  }
}

export const apiService = new ApiService();