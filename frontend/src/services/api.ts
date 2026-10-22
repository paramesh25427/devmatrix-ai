import axios from 'axios';
import type {
  ProjectCreate,
  ProjectResponse,
  FeasibilityReportResponse,
  ApiResponse
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Organization-ID': 'ORG-001',
  },
  timeout: 10000,
});

export interface ApiResponseWrapper<T> {
  data: T;
  isMock: boolean;
}

// -------------------------------------------------------------
// Live API Methods
// -------------------------------------------------------------

export async function createProject(payload: ProjectCreate): Promise<ApiResponseWrapper<ProjectResponse>> {
  try {
    const res = await apiClient.post<ApiResponse<ProjectResponse>>('/projects', payload);
    return { data: res.data.data, isMock: false };
  } catch (err: any) {
    console.warn('Backend unavailable, using fallback client mode:', err.message);
    throw err;
  }
}

export async function getProject(projectId: string): Promise<ApiResponseWrapper<ProjectResponse>> {
  try {
    const res = await apiClient.get<ApiResponse<ProjectResponse>>(`/projects/${projectId}`);
    return { data: res.data.data, isMock: false };
  } catch (err: any) {
    console.warn(`Error fetching project ${projectId}:`, err.message);
    throw err;
  }
}

export async function listProjects(): Promise<ApiResponseWrapper<ProjectResponse[]>> {
  try {
    const res = await apiClient.get<ApiResponse<ProjectResponse[]>>('/projects');
    return { data: res.data.data, isMock: false };
  } catch (err: any) {
    console.warn('Error listing projects:', err.message);
    throw err;
  }
}

export async function runFeasibilityAnalysis(projectId: string): Promise<ApiResponseWrapper<FeasibilityReportResponse>> {
  try {
    const res = await apiClient.post<ApiResponse<FeasibilityReportResponse>>(`/projects/${projectId}/analyze`);
    return { data: res.data.data, isMock: false };
  } catch (err: any) {
    console.warn(`Error running analysis for ${projectId}:`, err.message);
    throw err;
  }
}

export async function getLatestFeasibilityReport(projectId: string): Promise<ApiResponseWrapper<FeasibilityReportResponse>> {
  try {
    const res = await apiClient.get<ApiResponse<FeasibilityReportResponse>>(`/projects/${projectId}/reports/latest`);
    return { data: res.data.data, isMock: false };
  } catch (err: any) {
    console.warn(`Error fetching latest report for ${projectId}:`, err.message);
    throw err;
  }
}
