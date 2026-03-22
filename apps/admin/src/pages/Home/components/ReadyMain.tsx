import { useNavigate } from 'react-router-dom';
import type { UserStore } from '@/api/auth/entity';
import StoreDefault from '@/assets/imgs/store_default.svg?url';
import Button from '@/components/Button';
import styles from './ReadyMain.module.scss';

interface ReadyMainProps {
  userName?: string;
  store: UserStore;
}

export default function ReadyMain({ userName, store }: ReadyMainProps) {
  const navigate = useNavigate();
  const trimmedUserName = userName?.trim();
  const displayName = trimmedUserName && trimmedUserName.toLowerCase() !== 'user' ? trimmedUserName : undefined;
  const storeName = store.name || '주점';
  const storeImageUrl = store.imageUrl || '';
  const storeImage = storeImageUrl || StoreDefault;

  return (
    <section className={styles.readyMain}>
      <div className={styles.greeting}>
        <h2 className={styles.title}>
          {displayName ? (
            <>
              <span className={styles.highlight}>{displayName}</span>님, 안녕하세요!
            </>
          ) : (
            '안녕하세요!'
          )}
        </h2>
        <p className={styles.subtitle}>주점 운영을 시작해볼까요?</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.storeCard}>
          <h3 className={styles.storeTitle}>
            <span className={styles.storeName}>{storeName}</span>
          </h3>
          <div className={styles.storeImageWrap}>
            <img className={styles.storeImage} src={storeImage} alt={`${storeName} 주점`} />
          </div>
          <Button className={styles.storeButton} size="md" onClick={() => navigate(`/store/operate/${store.id}`)}>
            주점 시작
          </Button>
        </div>
      </div>
    </section>
  );
}