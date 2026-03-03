import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type { MyPageStore } from '@/api/user/entity';
import StoreDefault from '@/assets/imgs/store_default.svg?url';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useUpdateStore } from '@/pages/StoreOperate/hooks/useUpdateStore';
import { usePresignedUploader } from '@/utils/hooks/usePresignedUploader';
import styles from './InfoEditModal.module.scss';

interface StoreSettingsModalProps {
  store: MyPageStore;
  className?: string;
}

interface StoreSettingsForm {
  name: string;
  description: string;
}

export default function StoreSettingsModal({ store, className }: StoreSettingsModalProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: updateStore } = useUpdateStore();
  const { toast } = useToast();
  const { upload } = usePresignedUploader();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const currentImageUrl = store.imageUrl || StoreDefault;

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<StoreSettingsForm>({
    mode: 'onChange',
    defaultValues: {
      name: store.name,
      description: store.description,
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setSubmitError(null);

    if (nextOpen) {
      reset({
        name: store.name,
        description: store.description,
      });
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const uploadStoreImage = async (file: File | null) => {
    if (!file) {
      return store.imageUrl ?? '';
    }

    return await upload({
      directory: 'stores',
      fileName: file.name,
      file,
      errorMessage: '이미지 업로드에 실패했습니다.',
    });
  };

  const handleSubmitStore: SubmitHandler<StoreSettingsForm> = async (data) => {
    setSubmitError(null);

    try {
      const imageUrl = await uploadStoreImage(selectedFile);

      await updateStore({
        storeId: store.storeId,
        body: {
          name: data.name.trim(),
          description: data.description.trim(),
          imageUrl,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myPage'] }),
        queryClient.invalidateQueries({ queryKey: ['store', store.storeId] }),
        queryClient.invalidateQueries({ queryKey: ['userInfo'] }),
      ]);

      toast({
        message: '주점 정보가 업데이트에 성공했습니다.',
        variant: 'info',
      });
      setOpen(false);
    } catch (error) {
      const status = (error as { status?: number })?.status;

      if (status === 401) {
        toast({
          message: '로그인이 필요합니다.',
          variant: 'error',
        });
      } else if (status === 403) {
        toast({
          message: '본인 주점이 아닙니다.',
          variant: 'error',
        });
      } else if (status === 404) {
        toast({
          message: '주점을 찾을 수 없습니다.',
          variant: 'error',
        });
      } else {
        toast({
          message: '주점 정보 업데이트에 실패했습니다.',
          variant: 'error',
        });
      }
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button type="button" variant="ghost" className={clsx(styles.triggerButton, className)}>
          수정하기
        </Button>
      </ModalTrigger>

      <ModalContent className={styles.modalContent}>
        <ModalHeader>
          <ModalTitle>주점 정보 수정</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleSubmitStore)}>
          <ModalBody>
            <div className={styles.form}>
              <Input
                label="주점명"
                required
                message={errors.name?.message}
                messageState={errors.name ? 'error' : undefined}
              >
                <Input.Text
                  placeholder="Enter store name"
                  {...register('name', {
                    required: 'Enter store name.',
                  })}
                />
              </Input>

              <Input
                label="주점 설명"
                required
                message={errors.description?.message}
                messageState={errors.description ? 'error' : undefined}
              >
                <Input.TextArea
                  placeholder="Enter store description"
                  {...register('description', {
                    required: 'Enter store description.',
                  })}
                />
              </Input>

              <div className={styles.imageRow}>
                <div className={styles.imageColumn}>
                  <div className={styles.imageLabel}>현재 이미지</div>
                  <div className={styles.imagePreview}>
                    <img src={currentImageUrl} alt={`${store.name} 주점`} />
                  </div>
                </div>

                <div className={styles.imageColumn}>
                  <div className={styles.imageLabel}>새 이미지</div>
                  <label className={styles.imageUpload}>
                    <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                    {previewUrl ? (
                      <img className={styles.imagePreviewImage} src={previewUrl} alt="새 이미지" />
                    ) : (
                      <span className={styles.uploadHint}>클릭하여 이미지 업로드</span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              size="md"
              className={styles.footerButton}
              isLoading={isSubmitting}
              disabled={!isValid || isSubmitting}
              loadingText="수정 중..."
            >
              수정하기
            </Button>
          </ModalFooter>
        </form>

        {submitError ? <p className={styles.submitError}>{submitError}</p> : null}
      </ModalContent>
    </Modal>
  );
}
