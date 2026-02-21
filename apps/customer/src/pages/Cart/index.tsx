import BackIcon from '@/assets/icons/back.svg?react';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../stores/cart';
import styles from './Cart.module.scss';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export default function CartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');
  const { items, totalPrice, totalQuantity, removeMenu, setMenuQuantity } = useCart();

  const backToMenuUrl = useMemo(() => (tableId ? `/?tableId=${tableId}` : '/'), [tableId]);

  return (
    <main className={styles.cart}>
      <header className={styles.cart__header}>
        <button type="button" className={styles.cart__backButton} onClick={() => navigate(backToMenuUrl)}>
          <BackIcon />
        </button>
        <h1 className={styles.cart__title}>장바구니</h1>
        <div className={styles.cart__spacer} />
      </header>

      <section className={styles.cart__content}>
        {items.length === 0 ? (
          <div className={styles.cart__emptyState}>장바구니가 비어 있어요.</div>
        ) : (
          <>
            {items.map((item) => (
              <article key={item.menuId} className={styles.cart__item}>
                <button
                  type="button"
                  className={styles.cart__removeButton}
                  onClick={() => removeMenu(item.menuId)}
                  aria-label={`${item.name} 삭제`}
                >
                  x
                </button>

                <h2 className={styles.cart__itemName}>{item.name}</h2>
                <p className={styles.cart__itemPrice}>{formatPrice(item.price)}</p>

                <div className={styles.cart__quantityControl}>
                  <button
                    type="button"
                    className={styles.cart__quantityButton}
                    onClick={() => setMenuQuantity(item.menuId, Math.max(item.quantity - 1, 1))}
                  >
                    -
                  </button>
                  <span className={styles.cart__quantityValue}>{item.quantity}</span>
                  <button
                    type="button"
                    className={styles.cart__quantityButton}
                    onClick={() => setMenuQuantity(item.menuId, Math.min(item.quantity + 1, 99))}
                  >
                    +
                  </button>
                </div>
              </article>
            ))}

            <button type="button" className={styles.cart__addMoreButton} onClick={() => navigate(backToMenuUrl)}>
              메뉴 더 추가 +
            </button>
          </>
        )}
      </section>

      <footer className={styles.cart__bottom}>
        <button type="button" className={styles.cart__orderButton} disabled={items.length === 0}>
          <span className={styles.cart__orderCount}>{totalQuantity}</span>
          <span>{`${formatPrice(totalPrice)} 주문하기`}</span>
        </button>
      </footer>
    </main>
  );
}
