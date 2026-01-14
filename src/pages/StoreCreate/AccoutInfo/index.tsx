import { useEffect, useState } from 'react';
import { Controller, FieldErrors, type Control, type UseFormRegister, useWatch } from 'react-hook-form';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import QrIcon from '@/assets/icons/qr-code.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { useBanks } from '@/pages/StoreCreate/hooks/useBanks';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import styles from './AccoutInfo.module.scss';

interface AccoutInfoProps {
  register: UseFormRegister<StoreCreateForm>;
  control: Control<StoreCreateForm>;
  errors: FieldErrors<StoreCreateForm>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

export default function AccoutInfo({ register, control, errors, onSubmit }: AccoutInfoProps) {
  const { data: banks, isLoading } = useBanks();
  console.log(banks);

  const bankOptions = banks?.map((b) => ({ value: b.code, label: b.name })) ?? [];
  const qrCodeImage = useWatch({ control, name: 'qrCodeImage' });
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const file = qrCodeImage?.[0];
    if (!file) {
      setQrPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setQrPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [qrCodeImage]);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.mainTitle}>정산 받을 계좌를 등록해 주세요.</h1>
        <p className={styles.mainSubtitle}>먼저, 주점의 기본 정보를 입력해 주세요.</p>
      </header>

      <form className={styles.form} onSubmit={onSubmit}>
        <h2 className={styles.sectionTitle}>정산 계좌 정보</h2>

        <div className={styles.fields}>
          <Controller
            name="bankCode"
            control={control}
            rules={{ required: '은행명을 선택해 주세요.' }}
            render={({ field }) => (
              <Input.InputSelect
                name={field.name}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                options={bankOptions}
                placeholder="은행명을 선택해 주세요."
                disabled={isLoading}
                required
              />
            )}
          />

          <Input
            label="예금주"
            required
            message={errors.accountHolder?.message}
            messageState={errors.accountHolder ? 'error' : undefined}
          >
            <Input.Text
              placeholder="예금주명을 입력해 주세요."
              {...register('accountHolder', {
                required: '예금주명을 입력해 주세요.',
              })}
            />
          </Input>

          <Input
            label="계좌번호"
            required
            message="입력한 계좌 정보는 주점 정산 용도로만 사용돼요"
            messageState="info"
            // message={errors.accountNumber?.message}
            // messageState={errors.accountNumber ? 'error' : undefined}
          >
            <Input.Text
              placeholder="계좌번호를 입력해 주세요."
              inputMode="numeric"
              {...register('accountNumber', {
                required: '계좌번호를 입력해 주세요.',
              })}
            />
          </Input>

          {/* <div className={styles.infoRow}>
            <InfoIcon className={styles.infoIcon} aria-hidden="true" />
            <span>입력한 계좌 정보는 주점 정산 용도로만 사용돼요</span>
          </div> */}

          <div className={styles.qrSection}>
            <h3 className={styles.qrTitle}>토스 QR 코드 등록</h3>
            <input id="qrCodeImage" type="file" accept="image/*" hidden {...register('qrCodeImage')} />
            <label className={styles.qrUpload} htmlFor="qrCodeImage">
              {qrPreviewUrl ? (
                <img className={styles.qrPreview} src={qrPreviewUrl} alt="QR preview" />
              ) : (
                <>
                  <QrIcon className={styles.qrIcon} aria-hidden="true" />
                  <span>클릭하여 QR코드 삽입</span>
                </>
              )}
            </label>
            <button type="button" className={styles.qrHelp}>
              <InfoIcon className={styles.qrHelpIcon} aria-hidden="true" />
              토스 QR 코드 추가하는 법
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" className={styles.nextButton}>
          다음
        </Button>
      </form>
    </>
  );
}
