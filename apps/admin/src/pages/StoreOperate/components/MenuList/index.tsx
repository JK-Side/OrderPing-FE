import { useNavigate } from 'react-router-dom';
import SettingIcon from '@/assets/icons/setting-3.svg?react';
import MenuDefault from '@/assets/imgs/menu_default.svg?url';
import styles from './MenuList.module.scss';
import type { MenuResponse } from '@order-ping/shared/api/menu/entity';

interface MenuListProps {
  menus: MenuResponse[];
}

const CATEGORY_MAIN = 1;
const CATEGORY_SIDE = 2;

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

function MenuSection({ title, menus }: { title: string; menus: MenuResponse[] }) {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.menuGrid}>
        {menus.map((menu) => (
          <article key={menu.id} className={styles.menuCard}>
            <div className={styles.menuImageWrap}>
              <img className={styles.menuImage} src={menu.imageUrl || MenuDefault} alt={menu.name} />
              <button
                type="button"
                className={styles.menuAction}
                aria-label={`${menu.name} 설정`}
                onClick={() => navigate(`/store/${menu.storeId}/menu/${menu.id}/edit`)}
              >
                <SettingIcon className={styles.menuActionIcon} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.menuInfo}>
              <div className={styles.menuName}>{menu.name}</div>
              <div className={styles.menuPrice}>{formatPrice(menu.price)}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MenuList({ menus }: MenuListProps) {
  const mainMenus = menus.filter((menu) => menu.categoryId === CATEGORY_MAIN);
  const sideMenus = menus.filter((menu) => menu.categoryId === CATEGORY_SIDE);

  return (
    <div className={styles.menuList}>
      {mainMenus.length > 0 && <MenuSection title="메인 메뉴" menus={mainMenus} />}
      {sideMenus.length > 0 && <MenuSection title="사이드 메뉴" menus={sideMenus} />}
    </div>
  );
}
