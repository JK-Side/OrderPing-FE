import { useNavigate } from 'react-router-dom';
import PlusIcon from '@/assets/icons/plus.svg?react';
import { useUserInfo } from '@/utils/hooks/useUserInfo';
import styles from './EmptyMain.module.scss';

export default function EmptyMain() {
  const { data: userInfo } = useUserInfo();
  const navigate = useNavigate();
  const userName = userInfo?.userName ?? 'User';

  return (
    <section className={styles.emptyMain}>
      <div className={styles.greeting}>
        <h2 className={styles.title}>
          <span className={styles.highlight}>{userName}</span> 님 안녕하세요.
        </h2>
        <p className={styles.subtitle}>주점을 클릭해 운영을 시작해 보세요!</p>
      </div>

      <button
        type="button"
        className={styles.panel}
        onClick={() => navigate('/store/create')}
      >
        <div className={styles.createBox}>
          <PlusIcon width={32} height={32} fill="#8e8e93" />
        </div>
        <p className={styles.panelText}>주점을 생성해 보세요!</p>
      </button>
    </section>
  );
}
