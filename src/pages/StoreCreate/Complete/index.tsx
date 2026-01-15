import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import styles from './StoreCreateComplete.module.scss';

interface StoreCreateCompleteProps {
  storeName?: string;
}

export default function StoreCreateComplete({ storeName }: StoreCreateCompleteProps) {
  const navigate = useNavigate();
  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {storeName ? (
          <>
            <span className={styles.storeName}>{storeName}</span>
            주점 생성이 완료 되었어요!
          </>
        ) : (
          '주점 생성이 완료 되었어요!'
        )}
      </h2>
      <p className={styles.subtitle}>이제 주문을 받고 주점을 운영할 수 있어요.</p>
      <Button size="lg" className={styles.homeButton} onClick={handleGoHome}>
        홈으로 가기
      </Button>
    </div>
  );
}
