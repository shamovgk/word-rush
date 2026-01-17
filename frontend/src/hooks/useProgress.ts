import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '@/lib/api/services/progress.service';

export const usePackProgress = (packId: string) => {
  return useQuery({
    queryKey: ['packProgress', packId],
    queryFn: () => progressApi.getPackProgress(packId),
    staleTime: 1000 * 10, // 10 секунд - короткий stale time для актуального прогресса
  });
};

export const useSubmitResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: progressApi.submitResult,
    onSuccess: (_, variables) => {
      // Инвалидируем кеш прогресса
      queryClient.invalidateQueries({ queryKey: ['packProgress'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    },
  });
};
