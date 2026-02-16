import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { useCreateStore } from '@/pages/StoreCreate/hooks/useCreateStore';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import { usePresignedUploader } from '@/utils/hooks/usePresignedUploader';
import AccoutInfo from './AccoutInfo';
import StoreCreateComplete from './Complete';
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
    shouldUnregister: false,
  });
  const { mutateAsync: createStore } = useCreateStore();
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storePreviewUrl, setStorePreviewUrl] = useState<string | null>(null);
  const storePreviewUrlRef = useRef<string | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const qrPreviewUrlRef = useRef<string | null>(null);
  const { upload } = usePresignedUploader();

  const handleStoreImageChange = useCallback((file: File | null) => {
    setStoreImageFile(file);

    setStorePreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      const nextUrl = file ? URL.createObjectURL(file) : null;
      storePreviewUrlRef.current = nextUrl;
      return nextUrl;
    });
  }, []);

  const handleQrCodeImageChange = useCallback((file: File | null) => {
    setQrPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      const nextUrl = file ? URL.createObjectURL(file) : null;
      qrPreviewUrlRef.current = nextUrl;
      return nextUrl;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (storePreviewUrlRef.current) {
        URL.revokeObjectURL(storePreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (qrPreviewUrlRef.current) {
        URL.revokeObjectURL(qrPreviewUrlRef.current);
      }
    };
  }, []);

  const uploadStoreImage = useCallback(
    async (storeImage?: File | null) => {
      if (!storeImage) {
        return '';
      }

      return await upload({
        directory: 'stores',
        fileName: storeImage.name,
        file: storeImage,
        errorMessage: 'Failed to upload store image.',
      });
    },
    [upload],
  );

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

  const handleAccountInfoSubmit = useCallback<SubmitHandler<StoreCreateForm>>(
    async (data) => {
      try {
        const imageUrl = await uploadStoreImage(storeImageFile ?? data.storeImage?.[0] ?? null);
        await createStore({
          name: data.storeName,
          description: data.storeDescription,
          imageUrl,
          bankCode: data.bankCode ?? '',
          accountHolder: data.accountHolder ?? '',
          accountNumber: data.accountNumber ?? '',
        });
        updateStep(3);
      } catch (error) {
        console.error('Failed to create store', error);
      }
    },
    [createStore, storeImageFile, updateStep, uploadStoreImage],
  );

  const isStep1Completed = step > 1;
  const isStep2Completed = step > 2;

  return (
    <section className={styles.storeCreate}>
      <div className={styles.stepper}>
        <div
          className={clsx(styles.stepItem, {
            [styles.stepItemActive]: step === 1,
            [styles.stepItemCompleted]: isStep1Completed,
          })}
        >
          <span className={styles.stepCircle}>{isStep1Completed ? '✓' : '1'}</span>
          <span className={styles.stepLabel}>주점 정보 등록</span>
        </div>
        <div
          className={clsx(styles.stepItem, {
            [styles.stepItemActive]: step === 2,
            [styles.stepItemCompleted]: isStep2Completed,
          })}
        >
          <span className={styles.stepCircle}>{isStep2Completed ? '✓' : '2'}</span>
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
        {step === 1 && (
          <StoreInfo
            register={register}
            errors={errors}
            onSubmit={handleSubmit(handleStoreInfoSubmit)}
            storePreviewUrl={storePreviewUrl}
            onStoreImageChange={handleStoreImageChange}
          />
        )}
        {step === 2 && (
          <AccoutInfo
            register={register}
            control={control}
            errors={errors}
            onSubmit={handleSubmit(handleAccountInfoSubmit)}
            qrPreviewUrl={qrPreviewUrl}
            onQrCodeImageChange={handleQrCodeImageChange}
          />
        )}
        {step === 3 && <StoreCreateComplete storeName={getValues('storeName')} />}
      </div>
    </section>
  );
}
