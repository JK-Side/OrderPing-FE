import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WarningIcon from '@/assets/icons/warning-circle.svg?react';
import Button from '@/components/Button';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import { useTableQrList } from './hooks/useTableQrList';
import styles from './TableQrPrint.module.scss';

const formatTableLabel = (tableNum: number) => `테이블 ${String(tableNum).padStart(2, '0')}`;

export default function TableQrPrint() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;

  const { data: storeDetail, isPending: isStorePending, isError: isStoreError } = useStoreById(storeId);
  const { data: qrList, isPending: isQrPending, isError: isQrError } = useTableQrList(storeId);

  const tables = useMemo(() => [...(qrList?.tables ?? [])].sort((a, b) => a.tableNum - b.tableNum), [qrList?.tables]);
  const storeName = storeDetail?.name ?? '주점';
  const isPending = isStorePending || isQrPending;
  const isError = isStoreError || isQrError || !storeId;

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{storeName} 테이블 QR 출력</h1>
          <p className={styles.description}>출력 전 미리보기를 확인하고 PDF로 저장할 수 있습니다.</p>
        </div>

        <div className={styles.actions}>
          <Button type='button' variant='secondary' size='md' onClick={() => navigate(-1)}>
            돌아가기
          </Button>
          <Button type='button' size='md' onClick={() => window.print()} disabled={isPending || isError}>
            인쇄하기
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className={styles.stateCard}>QR 목록을 불러오는 중입니다.</div>
      ) : isError ? (
        <div className={styles.stateCard}>
          <WarningIcon className={styles.stateIcon} aria-hidden='true' />
          <p className={styles.stateTitle}>QR 출력 정보를 불러오지 못했습니다.</p>
          <p className={styles.stateDescription}>매장 접근 권한과 QR 목록 API 응답을 확인해 주세요.</p>
        </div>
      ) : tables.length === 0 ? (
        <div className={styles.stateCard}>
          <p className={styles.stateTitle}>출력할 QR이 없습니다.</p>
          <p className={styles.stateDescription}>활성 테이블에 QR 이미지가 등록되어 있는지 확인해 주세요.</p>
        </div>
      ) : (
        <div className={styles.sheet}>
          <div className={styles.sheetHeader}>
            <h2 className={styles.sheetTitle}>{storeName}</h2>
            <p className={styles.sheetMeta}>테이블 QR 코드 {tables.length}개</p>
          </div>

          <div className={styles.grid}>
            {tables.map((table) => (
              <article key={table.tableNum} className={styles.card}>
                <div className={styles.cardLabel}>{formatTableLabel(table.tableNum)}</div>
                <img className={styles.qrImage} src={table.qrImageUrl} alt={`${formatTableLabel(table.tableNum)} QR`} />
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
