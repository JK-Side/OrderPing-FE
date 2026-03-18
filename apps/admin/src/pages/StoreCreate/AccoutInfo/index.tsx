// import { useState } from 'react';
import { Controller, FieldErrors, type Control, type UseFormRegister } from 'react-hook-form';
// import InfoIcon from '@/assets/icons/info-circle.svg?react';
// import QrIcon from '@/assets/icons/qr-code.svg?react';
// import tossStep1 from '@/assets/imgs/toss1.jpg';
// import tossStep2 from '@/assets/imgs/toss2.jpg';
// import tossStep3 from '@/assets/imgs/toss3.jpg';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
// import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/Modal';
import { useBanks } from '@/pages/StoreCreate/hooks/useBanks';
import { StoreCreateForm } from '@/pages/StoreCreate/types.ts';
import styles from './AccoutInfo.module.scss';

interface AccoutInfoProps {
  register: UseFormRegister<StoreCreateForm>;
  control: Control<StoreCreateForm>;
  errors: FieldErrors<StoreCreateForm>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  isSubmitting?: boolean;
  isNextDisabled?: boolean;
  qrPreviewUrl?: string | null;
  onQrCodeImageChange?: (file: File | null) => void;
}

export default function AccoutInfo({
  register,
  control,
  errors,
  onSubmit,
  isSubmitting = false,
  isNextDisabled = false,
  // qrPreviewUrl,
  // onQrCodeImageChange,
}: AccoutInfoProps) {
  const { data: banks, isLoading } = useBanks();
  // const [isHelpOpen, setIsHelpOpen] = useState(false);

  const bankOptions = banks?.map((b) => ({ value: b.code, label: b.name })) ?? [];
  // const qrCodeImageField = register('qrCodeImage');
  // const { onChange: handleQrCodeImageChange, ref: qrCodeImageRef, ...qrCodeImageFieldProps } = qrCodeImageField;

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.mainTitle}>정산 받을 계좌를 등록해 주세요.</h1>
        <p className={styles.mainSubtitle}>마지막으로 주점의 대표 계좌를 설정해 주세요!</p>
      </header>

      <form className={styles.form} onSubmit={onSubmit}>
        <h2 className={styles.sectionTitle}>정산 계좌 정보</h2>

        <div className={styles.fields}>
          <div className={styles.bankField}>
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
          </div>

          <Input
            label="예금주"
            required
            message={errors.accountHolder?.message}
            messageState={errors.accountHolder ? 'error' : undefined}
          >
            <Input.Text
              placeholder="예금주명을 입력해 주세요. (최대 6글자)"
              {...register('accountHolder', {
                required: '예금주명을 입력해 주세요.',
                maxLength: { value: 6, message: '예금주명은 최대 6자입니다.' },
              })}
            />
          </Input>

          <Input
            label="계좌번호"
            required
            message={errors.accountNumber?.message || '입력한 계좌 정보는 주점 정산 용도로만 사용돼요'}
            messageState={errors.accountNumber ? 'error' : 'info'}
          >
            <Input.Text
              placeholder="계좌번호를 숫자만 입력해 주세요. (최대 20글자)"
              inputMode="numeric"
              {...register('accountNumber', {
                required: '계좌번호를 입력해 주세요.',
                maxLength: { value: 20, message: '계좌번호은 최대 20자입니다.' },
                onChange: (e) => {
                  const value = e.target.value;
                  e.target.value = value.replace(/[^0-9]/g, '');
                },
              })}
            />
          </Input>

          {/* <div className={styles.qrSection}>
            <h3 className={styles.qrTitle}>토스 QR 코드 등록</h3>
            <input
              id="qrCodeImage"
              type="file"
              accept="image/*"
              hidden
              {...qrCodeImageFieldProps}
              ref={qrCodeImageRef}
              onChange={(event) => {
                handleQrCodeImageChange(event);
                onQrCodeImageChange?.(event.target.files?.[0] ?? null);
              }}
            />
            <label className={styles.qrUpload} htmlFor="qrCodeImage">
              {qrPreviewUrl ? (
                <img className={styles.qrPreview} src={qrPreviewUrl} alt="QR 코드 미리보기" />
              ) : (
                <>
                  <QrIcon className={styles.qrIcon} aria-hidden="true" />
                  <span>클릭하여 QR코드 삽입</span>
                </>
              )}
            </label>
            <button type="button" className={styles.qrHelp} onClick={() => setIsHelpOpen(true)}>
              <InfoIcon className={styles.qrHelpIcon} aria-hidden="true" />
              토스 QR 코드 추가하는 법
            </button>
          </div> */}
        </div>

        <Button
          type="submit"
          size="lg"
          className={styles.nextButton}
          disabled={isSubmitting || isNextDisabled}
          isLoading={isSubmitting}
        >
          다음
        </Button>
      </form>

      {/* <Modal open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <ModalContent className={styles.helpModalContent}>
          <ModalHeader>
            <ModalTitle>토스 QR 등록 방법</ModalTitle>
          </ModalHeader>
          <ModalBody className={styles.helpBody}>
            <div className={styles.helpSteps}>
              <div className={styles.helpStep}>
                <div className={styles.helpStep__image}>
                  <img src={tossStep1} alt="Step 1 screen" />
                </div>
                <div className={styles.helpStep__text}>
                  <span className={styles['helpStep__text--index']}>1</span>
                  <p className={styles['helpStep__text--description']}>전체 메뉴에서 검색 버튼을 찾아요</p>
                </div>
              </div>
              <div className={styles.helpStep}>
                <div className={styles.helpStep__image}>
                  <img src={tossStep2} alt="Step 2 screen" />
                </div>
                <div className={styles.helpStep__text}>
                  <span className={styles['helpStep__text--index']}>2</span>
                  <p className={styles['helpStep__text--description']}>
                    검색창에 &quot;QR 코드 발급&quot;이라고 검색해요
                  </p>
                </div>
              </div>
              <div className={styles.helpStep}>
                <div className={styles.helpStep__image}>
                  <img src={tossStep3} alt="Step 3 screen" />
                </div>
                <div className={styles.helpStep__text}>
                  <span className={styles['helpStep__text--index']}>3</span>
                  <p className={styles['helpStep__text--description']}>
                    내 계좌 정보를 등록하고
                    <br />
                    QR 코드를 발급 받아요
                  </p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className={styles.helpModalFooter}>
            <Button size="lg" fullWidth onClick={() => setIsHelpOpen(false)}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal> */}
    </>
  );
}
