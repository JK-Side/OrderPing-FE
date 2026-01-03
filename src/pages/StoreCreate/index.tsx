import { useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import UploadIcon from '@/assets/icons/upload.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import styles from './StoreCreate.module.scss';

type StoreCreateForm = {
  storeName: string;
  storeDescription: string;
  storeImage?: FileList;
};

export default function StoreCreate() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreCreateForm>({
    mode: 'onBlur',
  });

  const onSubmit = useCallback<SubmitHandler<StoreCreateForm>>(() => {}, []);

  return (
    <section className={styles.storeCreate}>
      <div className={styles.stepper}>
        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <span className={styles.stepCircle}>1</span>
          <span className={styles.stepLabel}>주점 정보 등록</span>
        </div>
        <div className={styles.stepItem}>
          <span className={styles.stepCircle}>2</span>
          <span className={styles.stepLabel}>계좌 정보 등록</span>
        </div>
        <div className={styles.stepItem}>
          <span className={styles.stepCircle}>3</span>
          <span className={styles.stepLabel}>주점 시작!</span>
        </div>
      </div>

      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.mainTitle}>주점 운영을 시작해 볼까요?</h1>
          <p className={styles.mainSubtitle}>먼저, 주점의 기본 정보를 입력해 주세요.</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <h2 className={styles.sectionTitle}>주점 정보</h2>

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
                placeholder={`주점 설명을 입력해 주세요.\n예시) 포인터 당장 삭제해. 날 잡초하는 건 우리 컵 청춘 주점 뿐이다.`}
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
                {...register('storeImage')}
              />
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
      </div>
    </section>
  );
}
