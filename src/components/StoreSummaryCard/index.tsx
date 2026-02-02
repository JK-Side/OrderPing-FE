import StoreDefault from '@/assets/imgs/store_default.svg?url';
import styles from './StoreSummaryCard.module.scss';

interface StoreSummaryCardProps {
  storeName: string;
  storeDescription: string;
  imageUrl?: string;
  actions?: React.ReactNode;
}

export default function StoreSummaryCard({ storeName, storeDescription, imageUrl, actions }: StoreSummaryCardProps) {
  const storeImage = imageUrl || StoreDefault;

  return (
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
      {actions ? <div className={styles.summaryActions}>{actions}</div> : null}
    </div>
  );
}
