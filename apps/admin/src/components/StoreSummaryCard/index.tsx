import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import StoreDefault from '@/assets/imgs/store_default.svg?url';
import styles from './StoreSummaryCard.module.scss';

interface StoreSummaryCardProps {
  storeName: string;
  storeDescription: string;
  imageUrl?: string;
  actions?: ReactNode;
}

export default function StoreSummaryCard({ storeName, storeDescription, imageUrl, actions }: StoreSummaryCardProps) {
  const storeImage = imageUrl || StoreDefault;
  const summaryTextRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState(84);

  useLayoutEffect(() => {
    const summaryText = summaryTextRef.current;
    if (!summaryText) {
      return;
    }

    const updateImageSize = () => {
      const textHeight = summaryText.getBoundingClientRect().height;
      const nextSize = Math.min(140, Math.max(72, Math.round(textHeight)));
      setImageSize((prev) => (prev === nextSize ? prev : nextSize));
    };

    updateImageSize();

    const resizeObserver = new ResizeObserver(updateImageSize);
    resizeObserver.observe(summaryText);

    return () => {
      resizeObserver.disconnect();
    };
  }, [storeName, storeDescription]);

  const imageWrapStyle = { '--summary-image-size': `${imageSize}px` } as CSSProperties;

  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryInfo}>
        <div className={styles.summaryImageWrap} style={imageWrapStyle}>
          <img className={styles.summaryImage} src={storeImage} alt={`${storeName} 주점`} />
        </div>
        <div className={styles.summaryText} ref={summaryTextRef}>
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
