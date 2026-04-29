import BottomActionBar from '../../components/BottomActionBar';
import PageHeader from '../../components/PageHeader';
import { useCart } from '../../stores/cart';
import {
  buildStoreHomePath,
  clearPendingOrderDraft,
  loadPendingOrderDraft,
  parsePositiveInt,
} from '../../utils/orderFlow';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './OrderIssue.module.scss';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export default function OrderIssuePage() {
  const navigate = useNavigate();
  const { setActiveTable } = useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get('tableNum')),
    [searchParams],
  );
  const draft = useMemo(() => loadPendingOrderDraft(), []);
  const hasTableContext = storeId !== null && tableNum !== null;

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  const handleGoHome = () => {
    clearPendingOrderDraft();
    navigate(hasTableContext ? buildStoreHomePath(storeId, tableNum) : '/');
  };

  return (
    <main className={styles.orderIssue}>
      <PageHeader
        title='문의 안내'
        onBack={() =>
          navigate(
            hasTableContext ? buildStoreHomePath(storeId, tableNum) : '/',
          )
        }
      />

      <section className={styles.orderIssue__content}>
        <h1 className={styles.orderIssue__title}>주점장에게 문의하세요</h1>
        <p className={styles.orderIssue__description}>
          결제는 완료되었지만 재고 문제로 주문 접수에 실패했어요.
          <br />
          주점에서 환불을 도와드릴 수 있도록 화면을 보여 주세요.
        </p>

        {draft ? (
          <section className={styles.orderIssue__summaryCard}>
            <div className={styles.orderIssue__summaryRow}>
              <span>입금자명</span>
              <strong>{draft.depositorName}</strong>
            </div>
            <div className={styles.orderIssue__summaryRow}>
              <span>결제 금액</span>
              <strong>{formatPrice(draft.paymentAmount)}</strong>
            </div>
            <div className={styles.orderIssue__summaryRow}>
              <span>테이블</span>
              <strong>{`${draft.tableNum}번 테이블`}</strong>
            </div>
          </section>
        ) : null}
      </section>

      <BottomActionBar>
        <button
          type='button'
          className={styles.orderIssue__homeButton}
          onClick={handleGoHome}
        >
          메뉴판으로
        </button>
      </BottomActionBar>
    </main>
  );
}
