import { useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import { postPresignedUrl } from '@/api/store';
import SettingDetailIcon from '@/assets/icons/setting-2.svg?react';
import UploadIcon from '@/assets/icons/upload.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useUpdateStore } from '@/pages/StoreOperate/hooks/useUpdateStore';
import styles from './StoreSettingsModal.module.scss';

interface StoreSettingsModalProps {
  storeId: number;
  storeName: string;
  storeDescription: string;
  storeImageUrl: string;
}

export default function StoreSettingsModal({
  storeId,
  storeName,
  storeDescription,
  storeImageUrl,
}: StoreSettingsModalProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: updateStore } = useUpdateStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(storeName);
  const [description, setDescription] = useState(storeDescription);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setName(storeName);
      setDescription(storeDescription);
      setSubmitError(null);
    } else {
      setSubmitError(null);
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

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      setSubmitError('필수 항목을 모두 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const imageUrl = await uploadStoreImage(selectedFile);
      await updateStore({
        storeId,
        body: {
          name: name.trim(),
          description: description.trim(),
          imageUrl,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['store', storeId] });
      setOpen(false);
    } catch (error) {
      const status = (error as { status?: number })?.status;
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
    } finally {
      setIsSubmitting(false);
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
        <ModalBody>
          <div className={styles.form}>
            <Input label="주점명" required>
              <Input.Text
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="주점명을 입력해 주세요."
              />
            </Input>
            <Input label="주점 설명" required>
              <Input.TextArea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="주점 설명을 입력해 주세요."
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
          <Button size="md" className={styles.submitButton} onClick={handleSubmit} disabled={isSubmitting}>
            수정 완료
          </Button>
        </ModalFooter>
        {submitError && <p className={styles.submitError}>{submitError}</p>}
      </ModalContent>
    </Modal>
  );
}
