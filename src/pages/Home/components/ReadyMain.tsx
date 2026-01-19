import { Link, useNavigate } from 'react-router-dom';
import SettingIcon from '@/assets/icons/setting-1.svg?react';
import AlternativeImg from '@/assets/img/basic-img.png';
import Button from '@/components/Button';
import styles from './ReadyMain.module.scss';

type StoreInfo = {
  id: number;
  name: string;
  imageUrl: string;
};

interface ReadyMainProps {
  userName?: string;
  store?: StoreInfo;
}

export default function ReadyMain({ userName = 'User', store }: ReadyMainProps) {
  const navigate = useNavigate();
  const storeName = store?.name ?? '주점';
  const storeImageUrl = store?.imageUrl ?? '';
  const storeImage = storeImageUrl || AlternativeImg;

  return (
    <section className={styles.readyMain}>
      <div className={styles.greeting}>
        <h2 className={styles.title}>
          <span className={styles.highlight}>{userName}</span> 님, 안녕하세요!
        </h2>
        <p className={styles.subtitle}>주점 운영을 시작해볼까요?</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.cardColumn}>
          <div className={styles.storeCard}>
            <h3 className={styles.storeTitle}>
              <span className={styles.storeName}>{storeName}</span> 주점
            </h3>
            <div className={styles.storeImageWrap}>
              <img className={styles.storeImage} src={storeImage} alt={`${storeName} 주점`} />
            </div>
            <Button
              className={styles.storeButton}
              size="md"
              onClick={() => navigate(`/store/${store!.id}/start`)}
            >
              주점 시작
            </Button>
          </div>

          <Link
            to={`/store/operate/${store!.id}`}
            className={styles.settingsLink}
            onClick={() => navigate(`/store/operate/${store!.id}`)}
          >
            <SettingIcon />
            <span className={styles.settingsText}>주점 설정</span>
          </Link>
        </div>

        <aside className={styles.guide}>
          <h3 className={styles.guideTitle}>HOW TO USE?</h3>

          <div className={styles.guideItems}>
            <div className={styles.guideItem}>
              <div className={styles.guideHeading}>주점 설정</div>
              <div className={styles.guideText}>주점 정보를 등록하고 운영 설정을 확인할 수 있어요.</div>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.guideHeading}>주점 시작</div>
              <div className={styles.guideText}>주문을 받고 판매를 시작해보세요.</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
