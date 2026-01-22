import { useNavigate, useParams } from 'react-router-dom';
import AddMenuIcon from '@/assets/icons/add-menu.svg?react';
import WarningIcon from '@/assets/icons/warning-circle.svg?react';
import AlternativeImg from '@/assets/img/basic-img.png';
import Button from '@/components/Button';
import StoreSummaryCard from '@/components/StoreSummaryCard';
import summaryStyles from '@/components/StoreSummaryCard/StoreSummaryCard.module.scss';
import MenuList from '@/pages/StoreOperate/components/MenuList';
import StoreSettingsModal from '@/pages/StoreOperate/components/StoreSettingsModal';
import { useMenusByCategory } from '@/pages/StoreOperate/hooks/useMenus';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import styles from './StoreOperate.module.scss';

const CATEGORY_MAIN = 1;
const CATEGORY_SIDE = 2;

export default function StoreOperate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const { data: storeDetail } = useStoreById(storeId);
  const storeName = storeDetail?.name ?? '주점';
  const storeImageUrl = storeDetail?.imageUrl ?? '';
  const storeImage = storeImageUrl || AlternativeImg;
  const storeDescription = storeDetail?.description ?? '주점 소개를 입력해 주세요.';
  const { data: mainMenus = [], isError: isMainMenuError } = useMenusByCategory(storeId, CATEGORY_MAIN);
  const { data: sideMenus = [], isError: isSideMenuError } = useMenusByCategory(storeId, CATEGORY_SIDE);
  const menuItems = [...mainMenus, ...sideMenus];
  const hasMenus = menuItems.length > 0;
  const hasMenuError = isMainMenuError || isSideMenuError;

  return (
    <section className={styles.storeOperate}>
      <div className={styles.panel}>
        <StoreSummaryCard
          storeName={storeName}
          storeDescription={storeDescription}
          imageUrl={storeImageUrl}
          actions={
            <>
              <Button
                className={summaryStyles.actionButton}
                size="md"
                onClick={() => id && navigate(`/store/${id}/menu/create`)}
              >
                <AddMenuIcon className={summaryStyles.actionIcon} aria-hidden="true" />
                메뉴 추가
              </Button>
              {storeId ? (
                <StoreSettingsModal
                  storeId={storeId}
                  storeName={storeName}
                  storeDescription={storeDescription}
                  storeImageUrl={storeImage}
                />
              ) : null}
            </>
          }
        />

        {hasMenuError ? (
          <div className={styles.emptyState}>
            <WarningIcon className={styles.errorIcon} aria-hidden="true" />
            <p className={styles.errorText}>메뉴를 불러오지 못했어요.</p>
          </div>
        ) : hasMenus ? (
          <MenuList menus={menuItems} />
        ) : (
          <div className={styles.emptyState}>
            <AddMenuIcon className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyText}>메뉴를 추가해 보세요!</p>
          </div>
        )}
      </div>
    </section>
  );
}
