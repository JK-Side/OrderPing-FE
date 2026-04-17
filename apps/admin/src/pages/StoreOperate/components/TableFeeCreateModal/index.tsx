import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { postCreatedMenu } from '@/api/menu';
import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { REGEX } from '@/static/validation';
import styles from './TableFeeCreateModal.module.scss';

const TABLE_FEE_NAME = '테이블비';
const TABLE_FEE_CATEGORY_ID = 2;
const TABLE_FEE_STOCK = 1000;

interface TableFeeCreateModalProps {
  storeId: number;
}

interface TableFeeForm {
  price: string;
}

export default function TableFeeCreateModal({ storeId }: TableFeeCreateModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { mutateAsync: createMenu, isPending: isCreating } = useMutation({
    mutationFn: postCreatedMenu,
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TableFeeForm>({
    mode: 'onChange',
    defaultValues: {
      price: '',
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset({
        price: '',
      });
    }
  };

  const handleSubmitTableFee: SubmitHandler<TableFeeForm> = async (data) => {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast({
        message: '테이블비 가격은 1원 이상 입력해 주세요.',
        variant: 'error',
      });
      return;
    }

    try {
      await createMenu({
        storeId,
        categoryId: TABLE_FEE_CATEGORY_ID,
        name: TABLE_FEE_NAME,
        price,
        description: '',
        imageUrl: '',
        stock: TABLE_FEE_STOCK,
        isTableFee: true,
      });

      await queryClient.invalidateQueries({ queryKey: ['menus', storeId] });

      toast({
        message: '테이블비 메뉴가 추가되었습니다.',
        variant: 'info',
      });
      handleOpenChange(false);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message =
        status === 400
          ? '테이블비 메뉴를 추가할 수 없습니다.'
          : status === 401
            ? '로그인이 필요한 기능입니다.'
            : status === 403
              ? '본인 매장 메뉴만 추가할 수 있습니다.'
              : status === 404
                ? '매장을 찾을 수 없습니다.'
                : status === 409
                  ? '테이블비 메뉴는 주점당 하나만 등록 가능합니다.'
                  : '테이블비 메뉴 추가에 실패했습니다.';

      toast({
        message,
        variant: 'error',
      });
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button className={styles.triggerButton} size='md'>
          <PlusIcon />
          테이블비 추가
        </Button>
      </ModalTrigger>

      <ModalContent className={styles.modalContent}>
        <ModalHeader>
          <ModalTitle>테이블비 추가</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleSubmitTableFee)}>
          <ModalBody className={styles.body}>
            <Input
              label='테이블비 가격'
              required
              message={errors.price?.message}
              messageState={errors.price ? 'error' : undefined}
            >
              <Input.Text
                type='text'
                inputMode='numeric'
                placeholder='가격을 입력해 주세요. ex) 5000'
                {...register('price', {
                  required: '테이블비 가격을 입력해 주세요.',
                  pattern: {
                    value: REGEX.NUMBER_ONLY,
                    message: '숫자만 입력해 주세요.',
                  },
                  validate: (value) => Number(value) > 0 || '테이블비 가격은 1원 이상 입력해 주세요.',
                })}
              />
            </Input>
          </ModalBody>
          <ModalFooter className={styles.footer}>
            <Button type='button' variant='ghost' fullWidth onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button
              type='submit'
              disabled={!isValid || isSubmitting || isCreating}
              isLoading={isSubmitting || isCreating}
              fullWidth
            >
              추가
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
