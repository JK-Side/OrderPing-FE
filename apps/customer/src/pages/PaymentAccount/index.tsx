import { getPaymentTossDeeplink } from '../../api/customer';
import BottomActionBar from '../../components/BottomActionBar';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../components/Toast/useToast';
import { useCart } from '../../stores/cart';
import {
  buildCartPath,
  buildOrderPaymentWaitPath,
  loadPendingOrderDraft,
  openTossWithStoreFallback,
  parsePositiveInt,
  savePendingOrderDraft,
} from '../../utils/orderFlow';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './PaymentAccount.module.scss';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export default function PaymentAccountPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setActiveTable } = useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get('tableNum')),
    [searchParams],
  );
  const hasTableContext = storeId !== null && tableNum !== null;
  const draft = useMemo(() => loadPendingOrderDraft(), []);
  const [isOpeningToss, setIsOpeningToss] = useState(false);

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  useEffect(() => {
    if (
      !hasTableContext ||
      !draft ||
      draft.storeId !== storeId ||
      draft.tableNum !== tableNum
    ) {
      navigate(hasTableContext ? buildCartPath(storeId, tableNum) : '/cart', {
        replace: true,
      });
    }
  }, [draft, hasTableContext, navigate, storeId, tableNum]);

  const ensurePaymentInfo = async () => {
    if (!draft) {
      throw new Error('Missing draft');
    }

    if (draft.tossDeeplink && draft.account.accountNumber) {
      return draft;
    }

    const paymentInfo = await getPaymentTossDeeplink({
      storeId: draft.storeId,
      amount: draft.paymentAmount,
    });

    const nextDraft = {
      ...draft,
      tossDeeplink: paymentInfo.tossDeeplink,
      account: paymentInfo.account,
    };

    savePendingOrderDraft(nextDraft);
    return nextDraft;
  };

  const handleCopyAccountNumber = async () => {
    if (!draft?.account.accountNumber) return;

    try {
      await navigator.clipboard.writeText(draft.account.accountNumber);
      toast({
        message: '계좌번호를 복사했어요.',
        variant: 'success',
        duration: 1250,
      });
    } catch {
      toast({
        message: '계좌번호를 복사하지 못했어요.',
        variant: 'error',
        duration: 1250,
      });
    }
  };

  const handleOpenToss = async () => {
    try {
      setIsOpeningToss(true);
      const latestDraft = await ensurePaymentInfo();
      await openTossWithStoreFallback(latestDraft.tossDeeplink, () => {
        toast({
          message: '모바일 기기에서 토스 앱으로 결제해 주세요.',
          variant: 'info',
          duration: 1500,
        });
      });
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      toast({
        message:
          status === 404
            ? '입금 계좌 정보를 찾을 수 없어요. 다시 시도해 주세요.'
            : '토스 앱을 열지 못했어요. 다시 시도해 주세요.',
        variant: 'error',
        duration: 1500,
      });
    } finally {
      setIsOpeningToss(false);
    }
  };

  if (
    !hasTableContext ||
    !draft ||
    draft.storeId !== storeId ||
    draft.tableNum !== tableNum
  ) {
    return <main className={styles.paymentAccount} />;
  }

  return (
    <main className={styles.paymentAccount}>
      <PageHeader
        title='계좌번호 확인'
        onBack={() => navigate(buildOrderPaymentWaitPath(storeId, tableNum))}
      />

      <section className={styles.paymentAccount__content}>
        <div className={styles.paymentAccount__hero}>
          <p className={styles.paymentAccount__eyebrow}>
            직접 이체가 필요한 경우
          </p>
          <div className={styles.paymentAccount__title}>
            계좌번호를 확인하고 송금해 주세요
          </div>
          <div className={styles.paymentAccount__description}>
            토스 앱이 바로 열리지 않더라도 아래 계좌 정보로 송금한 뒤, 결제 대기
            화면에서 결제 완료를 눌러주시면 됩니다.
          </div>
        </div>

        <section className={styles.paymentAccount__accountCard}>
          <div className={styles.paymentAccount__amountRow}>
            <span className={styles.paymentAccount__amountLabel}>
              보낼 금액
            </span>
            <div className={styles.paymentAccount__amountValue}>
              {formatPrice(draft.paymentAmount)}
            </div>
          </div>

          <div className={styles.paymentAccount__divider} />

          <div className={styles.paymentAccount__infoRow}>
            <span className={styles.paymentAccount__infoLabel}>계좌번호</span>
            <div className={styles.paymentAccount__accountValueWrap}>
              <div className={styles.paymentAccount__accountNumber}>
                {draft.account.accountNumber}
              </div>
              <button
                type='button'
                className={styles.paymentAccount__copyButton}
                onClick={handleCopyAccountNumber}
              >
                복사
              </button>
            </div>
          </div>

          <div className={styles.paymentAccount__infoRow}>
            <span className={styles.paymentAccount__infoLabel}>은행명</span>
            <div className={styles.paymentAccount__infoValue}>
              {draft.account.bankName}
            </div>
          </div>

          <div className={styles.paymentAccount__infoRow}>
            <span className={styles.paymentAccount__infoLabel}>예금주</span>
            <div className={styles.paymentAccount__infoValue}>
              {draft.account.accountHolder}
            </div>
          </div>
        </section>

        <button
          type='button'
          className={styles.paymentAccount__reopenButton}
          onClick={() => void handleOpenToss()}
          disabled={isOpeningToss}
        >
          {isOpeningToss ? '토스 앱 여는 중...' : '토스 앱 다시 열기'}
        </button>
      </section>

      <BottomActionBar>
        <button
          type='button'
          className={styles.paymentAccount__confirmButton}
          onClick={() => navigate(buildOrderPaymentWaitPath(storeId, tableNum))}
        >
          확인 완료
        </button>
      </BottomActionBar>
    </main>
  );
}
