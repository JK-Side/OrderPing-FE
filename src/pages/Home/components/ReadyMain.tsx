import { Link } from 'react-router-dom';
import SettingIcon from '@/assets/icons/setting-1.svg?react';

import AlternativeImg from '@/assets/img/basic-img.png';
import Button from '@/components/Button';
import styles from './ReadyMain.module.scss';

export default function ReadyMain() {
  const userName = 'User';
  const shopName = '주점명';
  const shopImageUrl = '';
  const shopImage = shopImageUrl || AlternativeImg;

  return (
    <section className={styles.readyMain}>
      <div className={styles.greeting}>
        <h1 className={styles.title}>
          <span className={styles.highlight}>{userName}</span> 님 안녕하세요.
        </h1>
        <p className={styles.subtitle}>주점을 클릭해 운영을 시작해 보세요!</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.cardColumn}>
          <div className={styles.shopCard}>
            <h3 className={styles.shopTitle}>
              <span className={styles.shopName}>{shopName}</span> 주점
            </h3>
            <div className={styles.shopImageWrap}>
              <img className={styles.shopImage} src={shopImage} alt={`${shopName} 주점`} />
            </div>
            <Button className={styles.shopButton} size="md">
              주점 운영
            </Button>
          </div>

          <Link to="/shop/settings" className={styles.settingsLink}>
            <SettingIcon />
            <span className={styles.settingsText}>주점 설정</span>
          </Link>
        </div>

        <aside className={styles.guide}>
          <h3 className={styles.guideTitle}>HOW TO USE?</h3>

          <div className={styles.guideItems}>
            <div className={styles.guideItem}>
              <div className={styles.guideHeading}>주점 설정</div>
              <div className={styles.guideText}>주점명, 메뉴 추가, 재고 관리 등 주점 기본 설정을 할 수 있어요!</div>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.guideHeading}>주점 운영</div>
              <div className={styles.guideText}>축제 당일, 주점 운영을 진행할 수 있어요!</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
