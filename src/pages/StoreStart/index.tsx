import { useNavigate, useParams } from 'react-router-dom';
import AddMenuIcon from '@/assets/icons/add-menu.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import AlternativeImg from '@/assets/img/basic-img.png';
import Button from '@/components/Button';
import StoreSummaryCard from '@/components/StoreSummaryCard';
import summaryStyles from '@/components/StoreSummaryCard/StoreSummaryCard.module.scss';
import StoreSettingsModal from '@/pages/StoreOperate/components/StoreSettingsModal';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import styles from './StoreStart.module.scss';

export default function StoreStart() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const { data: storeDetail } = useStoreById(storeId);
  const storeName = storeDetail?.name ?? '주점';
  const storeImageUrl = storeDetail?.imageUrl ?? '';
  const storeImage = storeImageUrl || AlternativeImg;
  const storeDescription = storeDetail?.description ?? '';

  return (
    <section className={styles.storeStart}>
      <div className={styles.panel}>
        <div className={styles.summaryRow}>
          <StoreSummaryCard
            storeName={storeName}
            storeDescription={storeDescription}
            imageUrl={storeImageUrl}
            actions={
              <>
                <Button
                  className={summaryStyles.actionButton}
                  size="md"
                  onClick={() => id && navigate(`/store/${id}/menu/create`)}
                >
                  <AddMenuIcon className={summaryStyles.actionIcon} aria-hidden="true" />
                  메뉴 추가
                </Button>
                {storeId ? (
                  <StoreSettingsModal
                    storeId={storeId}
                    storeName={storeName}
                    storeDescription={storeDescription}
                    storeImageUrl={storeImage}
                  />
                ) : null}
              </>
            }
          />
          <div className={styles.sidePanel}>
            <div className={styles.noticeCard}>
              <InfoIcon className={styles.noticeIcon} aria-hidden="true" />
              <p className={styles.noticeText}>테이블의 체크박스를 누르고 테이블을 비워보세요!</p>
              <button type="button" className={styles.noticeClose} aria-label="안내 닫기">
                <CloseIcon className={styles.noticeCloseIcon} aria-hidden="true" />
              </button>
            </div>
            <Button className={styles.clearButton} size="md" disabled>
              테이블 비우기
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
