import { useMutation } from '@tanstack/react-query';
import { postCreateService } from '@/api/order';
import type { ServiceOrderRequest, ServiceOrderResponse } from '@/api/order/entity';

export const useCreateServiceOrder = () => {
  return useMutation<ServiceOrderResponse, Error, ServiceOrderRequest>({
    mutationFn: (body) => postCreateService(body),
  });
};
