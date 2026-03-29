import CloseIcon from '@/assets/icons/close.svg?react';
import BottomActionBar from '../../components/BottomActionBar';
import QuantityControl from '../../components/QuantityControl';
import { useToast } from '../../components/Toast/useToast';
import { useCart } from '../../stores/cart';
import {
  buildOrderConfirmPath,
  buildStoreHomePath,
  parsePositiveInt,
} from '../../utils/orderFlow';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './Cart.module.scss';
import PageHeader from '../../components/PageHeader';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export default function CartPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(
    () => parsePositiveInt(storeIdParam ?? searchParams.get('storeId')),
    [searchParams, storeIdParam],
  );
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get('tableNum')),
    [searchParams],
  );
  const hasTableContext = storeId !== null && tableNum !== null;

  const {
    items,
    totalPrice,
    totalQuantity,
    removeMenu,
    setMenuQuantity,
    setActiveTable,
  } = useCart();

  const backToMenuUrl = useMemo(
    () => (hasTableContext ? buildStoreHomePath(storeId, tableNum) : '/'),
    [hasTableContext, storeId, tableNum],
  );

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  const handleOrderButtonClick = () => {
    if (items.length === 0) return;

    if (!hasTableContext) {
      toast({
        message: '테이블 정보를 확인할 수 없어요.',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    navigate(buildOrderConfirmPath(storeId, tableNum));
  };

  return (
    <main className={styles.cart}>
      <PageHeader title='장바구니' onBack={() => navigate(backToMenuUrl)} />

      <section className={styles.cart__content}>
        {items.length === 0 ? (
          <div className={styles.cart__emptyState}>장바구니가 비어 있어요.</div>
        ) : (
          <>
            {items.map((item) => (
              <article key={item.menuId} className={styles.cart__item}>
                <div className={styles.cart__infoContainer}>
                  <div className={styles.cart__itemContainer}>
                    <div className={styles.cart__itemName}>{item.name}</div>
                    <div className={styles.cart__itemPrice}>
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  <button
                    type='button'
                    className={styles.cart__removeButton}
                    onClick={() => removeMenu(item.menuId)}
                    aria-label={`${item.name} 삭제`}
                  >
                    <CloseIcon fill='#fff' width={16} height={16} />
                  </button>
                </div>

                <QuantityControl
                  className={styles.cart__quantityControl}
                  value={item.quantity}
                  onDecrease={() =>
                    setMenuQuantity(item.menuId, Math.max(item.quantity - 1, 1))
                  }
                  onIncrease={() =>
                    setMenuQuantity(
                      item.menuId,
                      Math.min(item.quantity + 1, 99),
                    )
                  }
                />
              </article>
            ))}

            <button
              type='button'
              className={styles.cart__addMoreButton}
              onClick={() => navigate(backToMenuUrl)}
            >
              메뉴 더 추가 +
            </button>
          </>
        )}
      </section>

      <BottomActionBar>
        <button
          type='button'
          className={styles.cart__orderButton}
          disabled={items.length === 0}
          onClick={handleOrderButtonClick}
        >
          <span className={styles.cart__orderCount}>{totalQuantity}</span>
          <span>{`${formatPrice(totalPrice)} 주문하기`}</span>
        </button>
      </BottomActionBar>
    </main>
  );
}
