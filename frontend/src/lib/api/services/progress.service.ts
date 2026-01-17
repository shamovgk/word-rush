import apiClient from '../client';

export interface SubmitResultDto {
  levelId: string;
  score: number;
  stars: number;
  correctAnswers: number;
  wrongAnswers: number;
  duration: number;
}

export const progressApi = {
  submitResult: async (dto: SubmitResultDto) => {
    const response = await apiClient.post('/progress/submit', dto);
    return response.data;
  },
  
  getUserProgress: async () => {
    const response = await apiClient.get('/progress/me');
    return response.data;
  },

  getPackProgress: async (packId: string) => {
    const response = await apiClient.get(`/progress/pack/${packId}`);
    return response.data;
  },

  getLevelAttempts: async (levelId: string, page: number = 1, limit: number = 10) => {
    const response = await apiClient.get(`/progress/level/${levelId}`, {
      params: { page, limit },
    });
    return response.data;
  },
};
