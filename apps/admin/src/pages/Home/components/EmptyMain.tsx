import { useNavigate } from 'react-router-dom';
import PlusIcon from '@/assets/icons/plus.svg?react';
import styles from './EmptyMain.module.scss';

interface EmptyMainProps {
  userName?: string;
}

export default function EmptyMain({ userName }: EmptyMainProps) {
  const navigate = useNavigate();
  const trimmedUserName = userName?.trim();
  const displayName = trimmedUserName && trimmedUserName.toLowerCase() !== 'user' ? trimmedUserName : undefined;

  return (
    <section className={styles.emptyMain}>
      <div className={styles.greeting}>
        <h2 className={styles.title}>
          {displayName ? (
            <>
              <span className={styles.highlight}>{displayName}</span>님, 안녕하세요.
            </>
          ) : (
            '안녕하세요.'
          )}
        </h2>
        <p className={styles.subtitle}>주점을 클릭해 운영을 시작해 보세요!</p>
      </div>

      <div className={styles.panel}>
        <button className={styles.createBox} onClick={() => navigate('/store/create')}>
          <PlusIcon width={32} height={32} fill="#8e8e93" />
        </button>
        <p className={styles.panelText}>주점을 생성해 보세요!</p>
      </div>
    </section>
  );
}
