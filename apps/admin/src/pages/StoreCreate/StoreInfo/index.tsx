import { useCallback, useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent } from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import CloseIcon from '@/assets/icons/close.svg?react';
import UploadIcon from '@/assets/icons/upload.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import styles from './StoreInfo.module.scss';

interface StoreInfoProps {
  register: UseFormRegister<StoreCreateForm>;
  errors: FieldErrors<StoreCreateForm>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  storePreviewUrl?: string | null;
  onStoreImageChange?: (file: File | null) => void;
}

export default function StoreInfo({ register, errors, onSubmit, storePreviewUrl, onStoreImageChange }: StoreInfoProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const storeImageField = register('storeImage');
  const { onChange: handleStoreImageChange, ref: storeImageRef, ...storeImageFieldProps } = storeImageField;

  const handleRemovePreview = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (inputRef.current) {
        inputRef.current.value = '';
        handleStoreImageChange({ target: inputRef.current } as ChangeEvent<HTMLInputElement>);
        onStoreImageChange?.(null);
        return;
      }

      storeImageField.onChange({
        target: { files: null, name: storeImageField.name },
      } as unknown as ChangeEvent<HTMLInputElement>);
      onStoreImageChange?.(null);
    },
    [handleStoreImageChange, onStoreImageChange, storeImageField],
  );

  const handleDragEnter = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      const files = event.dataTransfer.files;
      if (!files?.length) {
        return;
      }

      onStoreImageChange?.(files[0]);
      storeImageField.onChange({
        target: { files, name: storeImageField.name },
      } as unknown as ChangeEvent<HTMLInputElement>);
    },
    [onStoreImageChange, storeImageField],
  );

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.mainTitle}>주점 운영을 시작해 볼까요?</h1>
        <p className={styles.mainSubtitle}>먼저, 주점의 기본 정보를 입력해 주세요.</p>
      </header>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.sectionTitle}>주점 정보</div>

        <div className={styles.fields}>
          <Input
            label="주점명"
            required
            message={errors.storeName?.message}
            messageState={errors.storeName ? 'error' : undefined}
          >
            <Input.Text
              placeholder="주점명을 입력해 주세요."
              {...register('storeName', {
                required: '주점명을 입력해 주세요.',
              })}
            />
          </Input>

          <Input
            label="주점 설명"
            required
            message={errors.storeDescription?.message}
            messageState={errors.storeDescription ? 'error' : undefined}
          >
            <Input.TextArea
              placeholder={`주점 설명을 입력해 주세요.\n예시) 어서오세요, 컴퓨터공학부 주점입니다!`}
              {...register('storeDescription', {
                required: '주점 설명을 입력해 주세요.',
              })}
            />
          </Input>

          <div className={styles.imageField}>
            <label className={styles.fieldLabel} htmlFor="storeImage">
              주점 이미지
            </label>
            <input
              id="storeImage"
              type="file"
              accept="image/*"
              hidden
              {...storeImageFieldProps}
              ref={(element) => {
                inputRef.current = element;
                storeImageRef(element);
              }}
              onChange={(event) => {
                handleStoreImageChange(event);
                onStoreImageChange?.(event.target.files?.[0] ?? null);
              }}
            />
            <label
              className={`${styles.imageUpload} ${isDragging ? styles.imageUploadDragging : ''}`}
              htmlFor="storeImage"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {storePreviewUrl ? (
                <>
                  <img className={styles.previewImage} src={storePreviewUrl} alt="미리보기 이미지" />
                  <button
                    type="button"
                    className={styles.previewRemove}
                    aria-label="Remove image"
                    onClick={handleRemovePreview}
                  >
                    <CloseIcon className={styles.previewRemoveIcon} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <>
                  <UploadIcon className={styles.uploadIcon} aria-hidden="true" />
                  <span>파일 드래그 또는 클릭하여 업로드</span>
                </>
              )}
            </label>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <Button type="submit" size="lg" className={styles.nextButton}>
            다음
          </Button>
        </div>
      </form>
    </>
  );
}
