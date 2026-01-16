import { useParams } from 'react-router-dom';
import AddMenuIcon from '@/assets/icons/add-menu.svg?react';
import SettingDetailIcon from '@/assets/icons/setting-2.svg?react';
import AlternativeImg from '@/assets/img/basic-img.png';
import Button from '@/components/Button';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import styles from './StoreOperate.module.scss';

export default function StoreOperate() {
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const { data: storeDetail } = useStoreById(storeId);
  const storeName = storeDetail?.name ?? '주점';
  const storeImageUrl = storeDetail?.imageUrl ?? '';
  const storeImage = storeImageUrl || AlternativeImg;
  const storeDescription = storeDetail?.description ?? '주점 소개를 입력해 주세요.';

  return (
    <section className={styles.storeOperate}>
      <div className={styles.panel}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryInfo}>
            <div className={styles.summaryImageWrap}>
              <img className={styles.summaryImage} src={storeImage} alt={`${storeName} 주점`} />
            </div>
            <div className={styles.summaryText}>
              <div className={styles.summaryTitle}>
                <span className={styles.storeName}>{storeName}</span> 주점
              </div>
              <p className={styles.summaryDescription}>{storeDescription}</p>
            </div>
          </div>
          <div className={styles.summaryActions}>
            <Button className={styles.actionButton} size="md">
              <AddMenuIcon className={styles.actionIcon} aria-hidden="true" />
              메뉴 추가
            </Button>
            <Button className={styles.actionButton} size="md" variant="ghost">
              <SettingDetailIcon className={styles.actionIcon} aria-hidden="true" />
              주점 설정
            </Button>
          </div>
        </div>

        <div className={styles.emptyState}>
          <AddMenuIcon className={styles.emptyIcon} aria-hidden="true" />
          <p className={styles.emptyText}>메뉴를 추가해 보세요!</p>
        </div>
      </div>
    </section>
  );
}
