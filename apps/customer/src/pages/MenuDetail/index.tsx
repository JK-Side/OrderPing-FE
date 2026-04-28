import { getMenuDetailByMenuId } from '../../api/customer';
import BottomActionBar from '../../components/BottomActionBar';
import PageHeader from '../../components/PageHeader';
import QuantityControl from '../../components/QuantityControl';
import { useToast } from '../../components/Toast/useToast';
import { useCart } from '../../stores/cart';
import MenuDefaultImage from '../../assets/imgs/menu_default.svg?react';
import { buildOrderHistoryPath, parsePositiveInt } from '../../utils/orderFlow';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './MenuDetail.module.scss';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export default function MenuDetailPage() {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addMenu, setActiveTable } = useCart();
  const { menuId: menuIdParam, storeId: storeIdParam } = useParams<{
    menuId: string;
    storeId?: string;
  }>();
  const [searchParams] = useSearchParams();

  const menuId = useMemo(() => {
    const parsed = Number(menuIdParam);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [menuIdParam]);

  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get('tableNum')),
    [searchParams],
  );
  const hasTableContext = storeId !== null && tableNum !== null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', 'menu-detail', menuId],
    queryFn: () => getMenuDetailByMenuId(menuId as number),
    enabled: menuId !== null,
  });

  const hasNotFoundError =
    (error as { status?: number } | null)?.status === 404;

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  const backToMenu = () => {
    navigate(hasTableContext ? `/stores/${storeId}?tableNum=${tableNum}` : '/');
  };

  const openOrderHistoryPage = () => {
    navigate(hasTableContext ? buildOrderHistoryPath(storeId, tableNum) : '/');
  };

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 99));
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleAddToCart = () => {
    if (!data || data.isSoldOut) return;

    addMenu(
      {
        menuId: data.id,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl,
      },
      quantity,
    );

    toast({
      message: '장바구니에 메뉴를 추가했어요.',
      variant: 'success',
      duration: 3000,
    });

    navigate(hasTableContext ? `/stores/${storeId}?tableNum=${tableNum}` : '/');
  };

  const totalPrice = (data?.price ?? 0) * quantity;

  return (
    <main className={styles.menuDetail}>
      <PageHeader
        title='메뉴 상세'
        onBack={backToMenu}
        rightSlot={
          hasTableContext ? (
            <button
              type='button'
              className={styles.menuDetail__historyButton}
              onClick={openOrderHistoryPage}
            >
              주문 내역
            </button>
          ) : null
        }
      />

      {!menuId ? (
        <div className={styles.menuDetail__status}>유효하지 않은 메뉴예요.</div>
      ) : null}
      {menuId && isLoading ? (
        <div className={styles.menuDetail__status}>
          메뉴 정보를 불러오는 중...
        </div>
      ) : null}
      {menuId && !isLoading && hasNotFoundError ? (
        <div className={styles.menuDetail__status}>메뉴를 찾을 수 없어요.</div>
      ) : null}
      {menuId && !isLoading && !hasNotFoundError && error ? (
        <div className={styles.menuDetail__status}>
          메뉴 정보를 불러오지 못했어요.
        </div>
      ) : null}

      {menuId && !isLoading && !error && data ? (
        <>
          <section className={styles.menuDetail__imageWrap}>
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt={data.name}
                className={styles.menuDetail__image}
              />
            ) : (
              <div className={styles.menuDetail__imageFallback}>
                <MenuDefaultImage aria-hidden='true' />
              </div>
            )}
          </section>

          <section className={styles.menuDetail__content}>
            <div className={styles.menuDetail__name}>{data.name}</div>
            <div className={styles.menuDetail__description}>
              {data.description}
            </div>

            <div className={styles.menuDetail__priceRow}>
              <span className={styles.menuDetail__price}>
                {formatPrice(data.price)}
              </span>
              <QuantityControl
                value={quantity}
                onDecrease={decreaseQuantity}
                onIncrease={increaseQuantity}
                decreaseDisabled={data.isSoldOut}
                increaseDisabled={data.isSoldOut}
              />
            </div>
          </section>

          <BottomActionBar>
            <button
              type='button'
              className={styles.menuDetail__addButton}
              onClick={handleAddToCart}
              disabled={data.isSoldOut}
            >
              {data.isSoldOut ? (
                '품절'
              ) : (
                <>
                  <span className={styles.menuDetail__quantity}>
                    {quantity}
                  </span>
                  {`${formatPrice(totalPrice)} 담기`}
                </>
              )}
            </button>
          </BottomActionBar>
        </>
      ) : null}
    </main>
  );
}
