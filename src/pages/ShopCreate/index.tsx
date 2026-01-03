import { useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import UploadIcon from '@/assets/icons/upload.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import styles from './ShopCreate.module.scss';

type ShopCreateForm = {
  shopName: string;
  shopDescription: string;
  shopImage?: FileList;
};

export default function ShopCreate() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopCreateForm>({
    mode: 'onBlur',
  });

  const onSubmit = useCallback<SubmitHandler<ShopCreateForm>>(() => {}, []);

  return (
    <section className={styles.shopCreate}>
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
              message={errors.shopName?.message}
              messageState={errors.shopName ? 'error' : undefined}
            >
              <Input.Text
                placeholder="주점명을 입력해 주세요."
                {...register('shopName', {
                  required: '주점명을 입력해 주세요.',
                })}
              />
            </Input>

            <Input
              label="주점 설명"
              required
              message={errors.shopDescription?.message}
              messageState={errors.shopDescription ? 'error' : undefined}
            >
              <Input.TextArea
                placeholder={`주점 설명을 입력해 주세요.\n  예시) 포인터 당장 삭제해. 날 잡초하는 건 우리 컵 청춘 주점 뿐이다.`}
                {...register('shopDescription', {
                  required: '주점 설명을 입력해 주세요.',
                })}
              />
            </Input>

            <div className={styles.imageField}>
              <label className={styles.fieldLabel} htmlFor="shopImage">
                주점 이미지
              </label>
              <div className={styles.imageUpload}>
                <input id="shopImage" type="file" accept="image/*" hidden {...register('shopImage')} />
                <UploadIcon className={styles.uploadIcon} aria-hidden="true" />
                <span>드래그 하여 이미지 삽입</span>
              </div>
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
