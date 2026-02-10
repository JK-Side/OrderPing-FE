import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent } from 'react';
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
  onStoreImageChange?: (file: File | null) => void;
}

export default function StoreInfo({ register, errors, onSubmit, onStoreImageChange }: StoreInfoProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const storeImageField = register('storeImage');
  const { onChange: handleStoreImageChange, ref: storeImageRef, ...storeImageFieldProps } = storeImageField;

  const updatePreview = useCallback((files?: FileList | null) => {
    if (!files?.length) {
      setPreviewUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return null;
      });
      onStoreImageChange?.(null);
      return;
    }
    const nextUrl = URL.createObjectURL(files[0]);
    setPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return nextUrl;
    });
    onStoreImageChange?.(files[0]);
  }, [onStoreImageChange]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleRemovePreview = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setPreviewUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return null;
      });

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

      updatePreview(files);
      storeImageField.onChange({
        target: { files, name: storeImageField.name },
      } as unknown as ChangeEvent<HTMLInputElement>);
    },
    [storeImageField, updatePreview],
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
                updatePreview(event.target.files);
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
              {previewUrl ? (
                <>
                  <img className={styles.previewImage} src={previewUrl} alt="미리보기 이미지" />
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

        <Button type="submit" size="lg" className={styles.nextButton}>
          다음
        </Button>
      </form>
    </>
  );
}
