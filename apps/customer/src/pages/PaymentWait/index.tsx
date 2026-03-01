import { getPaymentTossDeeplink } from '../../api/customer';
import CoinIcon from '../../assets/3d-coin-icon.jpg?url';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../components/Toast/useToast';
import { useCart } from '../../stores/cart';
import {
  buildCartPath,
  buildOrderStatusPath,
  buildStoreHomePath,
  clearPendingOrderDraft,
  loadPendingOrderDraft,
  openTossWithStoreFallback,
  parsePositiveInt,
  savePendingOrderDraft,
} from '../../utils/orderFlow';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './PaymentWait.module.scss';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export default function PaymentWaitPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setActiveTable } = useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(() => parsePositiveInt(searchParams.get('tableNum')), [searchParams]);
  const hasTableContext = storeId !== null && tableNum !== null;
  const draft = useMemo(() => loadPendingOrderDraft(), []);
  const hasRedirectedRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);
  const [isMovingNext, setIsMovingNext] = useState(false);

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  useEffect(() => {
    if (!hasTableContext || !draft || draft.storeId !== storeId || draft.tableNum !== tableNum) {
      if (hasRedirectedRef.current || !hasTableContext) return;
      hasRedirectedRef.current = true;
      toast({
        message: '결제 정보를 다시 준비해 주세요.',
        variant: 'warning',
        duration: 3000,
      });
      navigate(hasTableContext ? buildCartPath(storeId, tableNum) : '/cart', { replace: true });
    }
  }, [draft, hasTableContext, navigate, storeId, tableNum, toast]);

  const ensureTossDeeplink = async () => {
    if (!draft) {
      throw new Error('Missing draft');
    }

    if (draft.tossDeeplink) {
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

  const openToss = async () => {
    const latestDraft = await ensureTossDeeplink();

    await openTossWithStoreFallback(latestDraft.tossDeeplink, () => {
      toast({
        message: '모바일 기기에서 토스 앱으로 결제해 주세요.',
        variant: 'info',
        duration: 3000,
      });
    });
  };

  useEffect(() => {
    if (!draft || hasAutoOpenedRef.current) return;

    hasAutoOpenedRef.current = true;
    openToss().catch((error) => {
      const status = (error as { status?: number } | null)?.status;
      toast({
        message:
          status === 404
            ? '입금 계좌 정보를 찾을 수 없어요. 다시 시도해 주세요.'
            : '토스 앱을 열지 못했어요. 다시 시도해 주세요.',
        variant: 'error',
        duration: 3000,
      });
    });
  }, [draft, toast]);

  const handleCompletePayment = () => {
    if (!draft || isMovingNext) return;

    setIsMovingNext(true);
    clearPendingOrderDraft();
    navigate(buildOrderStatusPath(draft.storeId, draft.tableNum, draft.orderId), {
      replace: true,
    });
  };

  if (!hasTableContext || !draft || draft.storeId !== storeId || draft.tableNum !== tableNum) {
    return <main className={styles.paymentWait} />;
  }

  return (
    <main className={styles.paymentWait}>
      <PageHeader
        title="결제 진행"
        onBack={() =>
          navigate(hasTableContext ? buildStoreHomePath(storeId, tableNum) : '/cart')
        }
      />

      <section className={styles.paymentWait__content}>
        <img src={CoinIcon} alt="결제 대기 아이콘" className={styles.paymentWait__coinIcon} />
        <div className={styles.paymentWait__headline}>
          결제 완료 후
          <br />
          아래 결제 완료 버튼을 눌러주세요
        </div>
        <div className={styles.paymentWait__summary}>{formatPrice(draft.paymentAmount)}</div>
        <div className={styles.paymentWait__helper}>
          <button
            type="button"
            className={styles.paymentWait__linkButton}
            onClick={() => void openToss()}
          >
            토스앱이 열리지 않나요?
          </button>
        </div>
      </section>

      <footer className={styles.paymentWait__bottom}>
        <button
          type="button"
          className={styles.paymentWait__submitButton}
          disabled={isMovingNext}
          onClick={handleCompletePayment}
        >
          {isMovingNext ? '다음 화면으로 이동 중...' : '결제 완료'}
        </button>
      </footer>
    </main>
  );
}
