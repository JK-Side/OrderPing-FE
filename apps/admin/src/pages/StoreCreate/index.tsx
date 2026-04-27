import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/Toast/useToast';
import { useCreateStore } from '@/pages/StoreCreate/hooks/useCreateStore';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import { usePresignedUploader } from '@/utils/hooks/usePresignedUploader';
import { normalizeAccountNumber } from '@/utils/normalizeAccountNumber';
import AccoutInfo from './AccoutInfo';
import StoreCreateComplete from './Complete';
import styles from './StoreCreate.module.scss';
import StoreInfo from './StoreInfo';

const STEP_MIN = 1;
const STEP_MAX = 3;

const resolveCreateStoreErrorMessage = (error: unknown) => {
  const status = (error as { status?: number })?.status;

  if (status === 409) {
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message) as { message?: string };
        if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
          return parsed.message;
        }
      } catch {
        return '이미 주점을 등록한 사용자입니다.';
      }
    }

    return '이미 주점을 등록한 사용자입니다.';
  }

  if (status === 401) {
    return '로그인이 필요한 기능입니다.';
  }

  return '주점 생성에 실패했습니다.';
};

export default function StoreCreate() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = Number(searchParams.get('step'));
  const isStepParamValid = Number.isInteger(stepParam) && stepParam >= STEP_MIN && stepParam <= STEP_MAX;
  const step = isStepParamValid ? stepParam : STEP_MIN;
  const {
    register,
    control,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<StoreCreateForm>({
    mode: 'onBlur',
    shouldUnregister: false,
  });
  const { mutateAsync: createStore } = useCreateStore();
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storePreviewUrl, setStorePreviewUrl] = useState<string | null>(null);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
  const storePreviewUrlRef = useRef<string | null>(null);
  const accountSubmitLockRef = useRef(false);
  // const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
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

  // const handleQrCodeImageChange = useCallback((file: File | null) => {
  //   setQrPreviewUrl((previousUrl) => {
  //     if (previousUrl) {
  //       URL.revokeObjectURL(previousUrl);
  //     }

  //     const nextUrl = file ? URL.createObjectURL(file) : null;
  //     qrPreviewUrlRef.current = nextUrl;
  //     return nextUrl;
  //   });
  // }, []);

  useEffect(() => {
    return () => {
      if (storePreviewUrlRef.current) {
        URL.revokeObjectURL(storePreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const currentQrPreviewUrlRef = qrPreviewUrlRef;
    return () => {
      const qrPreviewUrl = currentQrPreviewUrlRef.current;
      if (qrPreviewUrl) {
        URL.revokeObjectURL(qrPreviewUrl);
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
      if (accountSubmitLockRef.current) return;

      accountSubmitLockRef.current = true;
      setIsAccountSubmitting(true);

      try {
        const imageUrl = await uploadStoreImage(storeImageFile ?? data.storeImage?.[0] ?? null);
        await createStore({
          name: data.storeName,
          description: data.storeDescription,
          imageUrl,
          bankCode: data.bankCode ?? '',
          accountHolder: data.accountHolder ?? '',
          accountNumber: normalizeAccountNumber(data.accountNumber ?? ''),
        });
        updateStep(3);
      } catch (error) {
        toast({
          message: resolveCreateStoreErrorMessage(error),
          variant: 'error',
        });
        console.error('Failed to create store', error);
      } finally {
        accountSubmitLockRef.current = false;
        setIsAccountSubmitting(false);
      }
    },
    [createStore, storeImageFile, toast, updateStep, uploadStoreImage],
  );

  const isStep1Completed = step > 1;
  const isStep2Completed = step > 2;
  const storeNameValue = watch('storeName') ?? '';
  const storeDescriptionValue = watch('storeDescription') ?? '';
  const bankCodeValue = watch('bankCode') ?? '';
  const accountHolderValue = watch('accountHolder') ?? '';
  const accountNumberValue = watch('accountNumber') ?? '';
  const normalizedAccountNumberValue = normalizeAccountNumber(accountNumberValue);
  const hasStoreName = storeNameValue.trim().length > 0 && storeNameValue.length <= 10;
  const hasStoreDescription = storeDescriptionValue.trim().length > 0 && storeDescriptionValue.length <= 100;
  const isStoreInfoValid = hasStoreName && hasStoreDescription;
  const hasBankCode = bankCodeValue.trim().length > 0;
  const hasAccountHolder = accountHolderValue.trim().length > 0 && accountHolderValue.length <= 6;
  const hasAccountNumber = /^[0-9]+$/.test(normalizedAccountNumberValue) && normalizedAccountNumberValue.length <= 20;
  const isAccountInfoValid = hasBankCode && hasAccountHolder && hasAccountNumber;

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
            isNextDisabled={!isStoreInfoValid}
            storePreviewUrl={storePreviewUrl}
            onStoreImageChange={handleStoreImageChange}
          />
        )}
        {step === 2 && (
          <AccoutInfo
            register={register}
            control={control}
            errors={errors}
            isSubmitting={isAccountSubmitting}
            isNextDisabled={!isAccountInfoValid}
            onSubmit={handleSubmit(handleAccountInfoSubmit)}
            // qrPreviewUrl={qrPreviewUrl}
            // onQrCodeImageChange={handleQrCodeImageChange}
          />
        )}
        {step === 3 && <StoreCreateComplete storeName={getValues('storeName')} />}
      </div>
    </section>
  );
}
