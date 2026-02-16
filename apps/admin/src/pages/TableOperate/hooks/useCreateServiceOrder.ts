import { postCreateService } from '@order-ping/shared/api/order';
import { useMutation } from '@tanstack/react-query';
import type { ServiceOrderRequest, ServiceOrderResponse } from '@order-ping/shared/api/order/entity';

export const useCreateServiceOrder = () => {
  return useMutation<ServiceOrderResponse, Error, ServiceOrderRequest>({
    mutationFn: (body) => postCreateService(body),
  });
};
