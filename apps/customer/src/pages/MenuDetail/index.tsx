import BackIcon from '@/assets/icons/back.svg?react';
import { getMenuDetailByMenuId } from '../../api/customer';
import QuantityControl from '../../components/QuantityControl';
import { useToast } from '../../components/Toast/useToast';
import { useCart } from '../../stores/cart';
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
  const { menuId: menuIdParam, tableId: tableIdParam } = useParams<{
    menuId: string;
    tableId?: string;
  }>();
  const [searchParams] = useSearchParams();

  const menuId = useMemo(() => {
    const parsed = Number(menuIdParam);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [menuIdParam]);

  const tableId = tableIdParam ?? searchParams.get('tableId');
  const tableIdNumber = useMemo(() => {
    const parsed = Number(tableId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [tableId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', 'menu-detail', menuId],
    queryFn: () => getMenuDetailByMenuId(menuId as number),
    enabled: menuId !== null,
  });

  const hasNotFoundError = (error as { status?: number } | null)?.status === 404;

  useEffect(() => {
    setActiveTable(tableIdNumber);
  }, [setActiveTable, tableIdNumber]);

  const backToMenu = () => {
    navigate(tableId ? `/tables/${tableId}` : '/');
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
      message: '장바구니에 메뉴를 추가했어요',
      variant: 'success',
      duration: 3000,
    });

    navigate(tableId ? `/tables/${tableId}` : '/');
  };

  const totalPrice = (data?.price ?? 0) * quantity;

  return (
    <main className={styles.menuDetail}>
      <header className={styles.menuDetail__header}>
        <button type="button" className={styles.menuDetail__backButton} onClick={backToMenu}>
          <BackIcon />
        </button>
        <button type="button" className={styles.menuDetail__historyButton}>
          주문 내역
        </button>
      </header>

      {!menuId ? <div className={styles.menuDetail__status}>유효하지 않은 메뉴예요.</div> : null}
      {menuId && isLoading ? (
        <div className={styles.menuDetail__status}>메뉴 정보를 불러오는 중...</div>
      ) : null}
      {menuId && !isLoading && hasNotFoundError ? (
        <div className={styles.menuDetail__status}>메뉴를 찾을 수 없어요.</div>
      ) : null}
      {menuId && !isLoading && !hasNotFoundError && error ? (
        <div className={styles.menuDetail__status}>메뉴 정보를 불러오지 못했어요.</div>
      ) : null}

      {menuId && !isLoading && !error && data ? (
        <>
          <section className={styles.menuDetail__imageWrap}>
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.name} className={styles.menuDetail__image} />
            ) : (
              <div className={styles.menuDetail__imageFallback}>이미지가 없어요.</div>
            )}
          </section>

          <section className={styles.menuDetail__content}>
            <div className={styles.menuDetail__name}>{data.name}</div>
            <div className={styles.menuDetail__description}>{data.description}</div>

            <div className={styles.menuDetail__priceRow}>
              <span className={styles.menuDetail__price}>{formatPrice(data.price)}</span>
              <QuantityControl
                value={quantity}
                onDecrease={decreaseQuantity}
                onIncrease={increaseQuantity}
                decreaseDisabled={data.isSoldOut}
                increaseDisabled={data.isSoldOut}
              />
            </div>
          </section>

          <footer className={styles.menuDetail__bottom}>
            <button
              type="button"
              className={styles.menuDetail__addButton}
              onClick={handleAddToCart}
              disabled={data.isSoldOut}
            >
              {data.isSoldOut ? (
                '품절'
              ) : (
                <>
                  <span className={styles.menuDetail__quantity}>{quantity}</span>
                  {`${formatPrice(totalPrice)} 담기`}
                </>
              )}
            </button>
          </footer>
        </>
      ) : null}
    </main>
  );
}
