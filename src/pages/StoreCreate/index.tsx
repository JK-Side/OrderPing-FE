import { useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import styles from './StoreCreate.module.scss';
import StoreInfo from './StoreInfo';

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
        <StoreInfo register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} />
      </div>
    </section>
  );
}
