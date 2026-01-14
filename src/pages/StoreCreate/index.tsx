import clsx from 'clsx';
import { useCallback, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import AccoutInfo from './AccoutInfo';
import styles from './StoreCreate.module.scss';
import StoreInfo from './StoreInfo';

const STEP_MIN = 1;
const STEP_MAX = 3;

export default function StoreCreate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = Number(searchParams.get('step'));
  const isStepParamValid = Number.isInteger(stepParam) && stepParam >= STEP_MIN && stepParam <= STEP_MAX;
  const step = isStepParamValid ? stepParam : STEP_MIN;
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<StoreCreateForm>({
    mode: 'onBlur',
  });

  const updateStep = useCallback(
    (nextStep: number, options?: { replace?: boolean }) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('step', String(nextStep));
      setSearchParams(nextParams, options);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (!isStepParamValid) {
      updateStep(STEP_MIN, { replace: true });
    }
  }, [isStepParamValid, updateStep]);

  const handleStoreInfoSubmit = useCallback<SubmitHandler<StoreCreateForm>>(() => {
    updateStep(2);
  }, [updateStep]);

  const handleAccountInfoSubmit = useCallback<SubmitHandler<StoreCreateForm>>(() => {
    updateStep(3);
  }, [updateStep]);

  useEffect(() => {
    console.log('step', step, getValues());
  }, [step, getValues]);

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
          <AccoutInfo
            register={register}
            control={control}
            errors={errors}
            onSubmit={handleSubmit(handleAccountInfoSubmit)}
          />
        )}
      </div>
    </section>
  );
}
