import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import AccoutInfo from './AccoutInfo';
import styles from './StoreCreate.module.scss';
import StoreInfo from './StoreInfo';

export default function StoreCreate() {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreCreateForm>({
    mode: 'onBlur',
  });

  const handleStoreInfoSubmit = useCallback<SubmitHandler<StoreCreateForm>>(() => {
    setStep(2);
  }, []);

  const handleAccountInfoSubmit = useCallback<SubmitHandler<StoreCreateForm>>(() => {
    setStep(3);
  }, []);

  return (
    <section className={styles.storeCreate}>
      <div className={styles.stepper}>
        <div
          className={clsx(styles.stepItem, {
            [styles.stepItemActive]: step === 1,
          })}
        >
          <span className={styles.stepCircle}>1</span>
          <span className={styles.stepLabel}>주점 정보 등록</span>
        </div>
        <div
          className={clsx(styles.stepItem, {
            [styles.stepItemActive]: step === 2,
          })}
        >
          <span className={styles.stepCircle}>2</span>
          <span className={styles.stepLabel}>계좌 정보 등록</span>
        </div>
        <div
          className={clsx(styles.stepItem, {
            [styles.stepItemActive]: step === 3,
          })}
        >
          <span className={styles.stepCircle}>3</span>
          <span className={styles.stepLabel}>주점 시작!</span>
        </div>
      </div>

      <div className={styles.content}>
        {step === 1 ? (
          <StoreInfo register={register} errors={errors} onSubmit={handleSubmit(handleStoreInfoSubmit)} />
        ) : (
          <AccoutInfo register={register} errors={errors} onSubmit={handleSubmit(handleAccountInfoSubmit)} />
        )}
      </div>
    </section>
  );
}
