import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AddMenuIcon from '@/assets/icons/add-menu.svg?react';
import WarningIcon from '@/assets/icons/warning-circle.svg?react';
import StoreDefault from '@/assets/imgs/store_default.svg?url';
import Button from '@/components/Button';
import MenuList from '@/pages/StoreOperate/components/MenuList';
import StoreSettingsModal from '@/pages/StoreOperate/components/StoreSettingsModal';
// import TableFeeCreateModal from '@/pages/StoreOperate/components/TableFeeCreateModal';
import { useMenusByCategory } from '@/pages/StoreOperate/hooks/useMenus';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import styles from './StoreOperate.module.scss';

const CATEGORY_MAIN = 1;
const CATEGORY_SIDE = 2;
const CATEGORY_TABLE_FEE = 3;

export default function StoreOperate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const { data: storeDetail } = useStoreById(storeId);
  const storeName = storeDetail?.name ?? '주점';
  const storeImageUrl = storeDetail?.imageUrl ?? '';
  const storeDescription = storeDetail?.description ?? '주점 소개를 입력해 주세요.';
  const { data: mainMenus = [], isError: isMainMenuError } = useMenusByCategory(storeId, CATEGORY_MAIN);
  const { data: sideMenus = [], isError: isSideMenuError } = useMenusByCategory(storeId, CATEGORY_SIDE);
  const { data: tableFeeMenus = [], isError: isTableFeeMenuError } = useMenusByCategory(storeId, CATEGORY_TABLE_FEE);
  const menuItems = [...mainMenus, ...sideMenus, ...tableFeeMenus];
  const hasMenus = menuItems.length > 0;
  const hasMenuError = isMainMenuError || isSideMenuError || isTableFeeMenuError;
  const storeImage = storeImageUrl || StoreDefault;
  const summaryTextRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState(84);

  useLayoutEffect(() => {
    const summaryText = summaryTextRef.current;
    if (!summaryText) return;

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
    <section className={styles.storeOperate}>
      <div className={styles.panel}>
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
          <div className={styles.summaryActions}>
            {storeId ? (
              <StoreSettingsModal
                storeId={storeId}
                storeName={storeName}
                storeDescription={storeDescription}
                storeImageUrl={storeImageUrl}
              />
            ) : null}
            {/* {storeId && <TableFeeCreateModal storeId={storeId} />} */}
            <Button
              className={styles.actionButton}
              size='md'
              onClick={() => id && navigate(`/store/${id}/menu/create`)}
            >
              <AddMenuIcon className={styles.actionIcon} aria-hidden='true' />
              메뉴 추가
            </Button>
          </div>
        </div>

        {hasMenuError ? (
          <div className={styles.emptyState}>
            <WarningIcon className={styles.errorIcon} aria-hidden='true' />
            <p className={styles.errorText}>메뉴를 불러오지 못했어요.</p>
          </div>
        ) : hasMenus ? (
          <MenuList menus={menuItems} />
        ) : (
          <div className={styles.emptyState}>
            <button className={styles.emptyState__title} onClick={() => id && navigate(`/store/${id}/menu/create`)}>
              <AddMenuIcon className={styles.emptyIcon} aria-hidden='true' />
              <p className={styles.emptyText}>메뉴를 추가해 보세요!</p>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
