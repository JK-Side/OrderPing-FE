import { useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { postPresignedUrl } from '@/api/store';
import SettingDetailIcon from '@/assets/icons/setting-2.svg?react';
import UploadIcon from '@/assets/icons/upload.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useUpdateStore } from '@/pages/StoreOperate/hooks/useUpdateStore';
import styles from './StoreSettingsModal.module.scss';

interface StoreSettingsModalProps {
  storeId: number;
  storeName: string;
  storeDescription: string;
  storeImageUrl: string;
}

interface StoreSettingsForm {
  name: string;
  description: string;
}

export default function StoreSettingsModal({
  storeId,
  storeName,
  storeDescription,
  storeImageUrl,
}: StoreSettingsModalProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: updateStore } = useUpdateStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<StoreSettingsForm>({
    mode: 'onChange',
    defaultValues: {
      name: storeName,
      description: storeDescription,
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      reset({
        name: storeName,
        description: storeDescription,
      });
    }
    setSubmitError(null);
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
      return storeImageUrl;
    }

    const { presignedUrl, imageUrl } = await postPresignedUrl({
      directory: 'stores',
      fileName: file.name,
    });
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload store image.');
    }

    return imageUrl;
  };

  const handleSubmitStore: SubmitHandler<StoreSettingsForm> = async (data) => {
    setSubmitError(null);
    try {
      const imageUrl = await uploadStoreImage(selectedFile);
      await updateStore({
        storeId,
        body: {
          name: data.name.trim(),
          description: data.description.trim(),
          imageUrl,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['store', storeId] });
      toast({
        message: '\uC8FC\uC810 \uC815\uBCF4 \uC218\uC815\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4',
        variant: 'info',
      });
      setOpen(false);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      toast({
        message: '\uC8FC\uC810 \uC815\uBCF4 \uC218\uC815\uC744 \uC2E4\uD328\uD558\uC600\uC2B5\uB2C8\uB2E4.',
        variant: 'error',
      });

      if (status === 401) {
        setSubmitError('인증이 필요합니다.');
      } else if (status === 403) {
        setSubmitError('본인 매장이 아닙니다.');
      } else if (status === 404) {
        setSubmitError('매장을 찾을 수 없습니다.');
      } else {
        setSubmitError('주점 정보를 수정하지 못했어요.');
      }
      console.error('Failed to update store', error);
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button className={styles.triggerButton} size="md" variant="ghost">
          <SettingDetailIcon className={styles.triggerIcon} aria-hidden="true" />
          주점 설정
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>주점 기본 정보 수정</ModalTitle>
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
                  placeholder="주점명을 입력해 주세요."
                  {...register('name', {
                    required: '주점명을 입력해 주세요.',
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
                  placeholder="주점 설명을 입력해 주세요."
                  {...register('description', {
                    required: '주점 설명을 입력해 주세요.',
                  })}
                />
              </Input>
              <div className={styles.imageRow}>
                <div className={styles.imageColumn}>
                  <div className={styles.imageLabel}>현재 이미지</div>
                  <div className={styles.imagePreview}>
                    <img src={storeImageUrl} alt={`${storeName} 주점 이미지`} />
                  </div>
                </div>
                <div className={styles.imageColumn}>
                  <div className={styles.imageLabel}>변경할 이미지</div>
                  <label className={styles.imageUpload}>
                    <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                    {previewUrl ? (
                      <img className={styles.imagePreviewImage} src={previewUrl} alt="변경할 이미지 미리보기" />
                    ) : (
                      <>
                        <UploadIcon className={styles.uploadIcon} aria-hidden="true" />
                        <span>드래그 하여 이미지 삽입</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" size="md" className={styles.submitButton} disabled={!isValid || isSubmitting}>
              수정 완료
            </Button>
          </ModalFooter>
        </form>
        {submitError && <p className={styles.submitError}>{submitError}</p>}
      </ModalContent>
    </Modal>
  );
}
