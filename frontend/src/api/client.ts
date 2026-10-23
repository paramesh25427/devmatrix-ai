import axios from 'axios';
import type {
  ProjectListItem,
  ProjectDetailResponse,
  AnalysisResponse,
  RequirementItem,
  TeamRecommendationResponse,
  TaskItem,
  AlertItem,
  HistoryResponse,
  DeveloperProfile
} from '../types/contract';
import { MOCK_PROJECTS } from './mock/sampleData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const apiClient = {
  async getHealth(): Promise<{ status: string; app: string }> {
    try {
      const res = await api.get('/health');
      return res.data;
    } catch {
      return { status: 'offline', app: 'DevMatrix AI (Offline Mode)' };
    }
  },

  async createProject(formData: FormData): Promise<{ id: string; title: string; client: string; status: string; message: string }> {
    if (USE_MOCK) {
      const title = formData.get('title') as string || 'New Project';
      const client = formData.get('client') as string || 'Sample Client';
      const newId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
      return {
        id: newId,
        title,
        client,
        status: 'submitted',
        message: 'Mock Project registered in submitted status.'
      };
    }
    const res = await api.post('/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async listProjects(): Promise<ProjectListItem[]> {
    if (USE_MOCK) {
      return MOCK_PROJECTS as ProjectListItem[];
    }
    try {
      const res = await api.get('/projects');
      return res.data;
    } catch (err) {
      console.warn('API error listing projects, using fallback demo list:', err);
      return MOCK_PROJECTS as ProjectListItem[];
    }
  },

  async getProject(id: string): Promise<ProjectDetailResponse> {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  async analyzeProject(id: string): Promise<AnalysisResponse> {
    const res = await api.post(`/projects/${id}/analyze`);
    return res.data;
  },

  async updateProjectAnalysis(id: string, requirements: RequirementItem[]): Promise<AnalysisResponse> {
    const res = await api.put(`/projects/${id}/analysis`, { requirements });
    return res.data;
  },

  async approveProject(id: string, approverName: string, notes?: string): Promise<AnalysisResponse> {
    const res = await api.post(`/projects/${id}/approve`, {
      approver_name: approverName,
      notes
    });
    return res.data;
  },

  async getTeamRecommendation(id: string): Promise<TeamRecommendationResponse> {
    const res = await api.post(`/projects/${id}/team`);
    return res.data;
  },

  async confirmTeam(id: string, which: 'best' | 'alternative'): Promise<{ status: string; message: string }> {
    const res = await api.post(`/projects/${id}/team/confirm`, { which });
    return res.data;
  },

  async getProjectTasks(id: string): Promise<TaskItem[]> {
    const res = await api.get(`/projects/${id}/tasks`);
    return res.data;
  },

  async updateTask(taskId: string, payload: Partial<TaskItem>): Promise<TaskItem> {
    const res = await api.patch(`/tasks/${taskId}`, payload);
    return res.data;
  },

  async getProjectAlerts(id: string): Promise<AlertItem[]> {
    const res = await api.get(`/projects/${id}/alerts`);
    return res.data;
  },

  async simulateProjectTimeline(id: string, advanceDays: number = 7): Promise<any> {
    const res = await api.post(`/projects/${id}/simulate`, { advance_days: advanceDays });
    return res.data;
  },

  async completeProject(id: string, actualWeeks: number, actualCost: number): Promise<any> {
    const res = await api.post(`/projects/${id}/complete`, {
      actual_weeks: actualWeeks,
      actual_cost: actualCost
    });
    return res.data;
  },

  async getHistory(): Promise<HistoryResponse> {
    const res = await api.get('/history');
    return res.data;
  },

  async getDevelopers(): Promise<DeveloperProfile[]> {
    const res = await api.get('/developers');
    return res.data;
  },

  async flagDeveloper(developerId: string, note: string): Promise<any> {
    const res = await api.post(`/developers/${developerId}/flag`, { note });
    return res.data;
  }
};
