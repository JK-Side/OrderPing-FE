import { FieldErrors, UseFormRegister } from 'react-hook-form';
import UploadIcon from '@/assets/icons/upload.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import styles from './StoreInfo.module.scss';

interface StoreInfoProps {
  register: UseFormRegister<StoreCreateForm>;
  errors: FieldErrors<StoreCreateForm>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

export default function StoreInfo({ register, errors, onSubmit }: StoreInfoProps) {
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
              placeholder={`주점 설명을 입력해 주세요.\n예시) 포인터 당장 삭제해. 널 참조하는 건 우리 컴공 주점 뿐이다.`}
              {...register('storeDescription', {
                required: '주점 설명을 입력해 주세요.',
              })}
            />
          </Input>

          <div className={styles.imageField}>
            <label className={styles.fieldLabel} htmlFor="storeImage">
              주점 이미지
            </label>
            <input id="storeImage" type="file" accept="image/*" hidden {...register('storeImage')} />
            <label className={styles.imageUpload} htmlFor="storeImage">
              <UploadIcon className={styles.uploadIcon} aria-hidden="true" />
              <span>드래그 하여 이미지 삽입</span>
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
