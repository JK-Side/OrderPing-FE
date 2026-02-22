import BackIcon from "@/assets/icons/back.svg?react";
import QuantityControl from "../../components/QuantityControl";
import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CloseIcon from "@/assets/icons/close.svg?react";
import { useCart } from "../../stores/cart";
import styles from "./Cart.module.scss";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function CartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("tableId");
  const tableIdNumber = useMemo(() => {
    const parsed = Number(tableId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [tableId]);

  const {
    items,
    totalPrice,
    totalQuantity,
    removeMenu,
    setMenuQuantity,
    setActiveTable,
  } = useCart();

  const backToMenuUrl = useMemo(
    () => (tableId ? `/?tableId=${tableId}` : "/"),
    [tableId],
  );

  useEffect(() => {
    setActiveTable(tableIdNumber);
  }, [setActiveTable, tableIdNumber]);

  return (
    <main className={styles.cart}>
      <header className={styles.cart__header}>
        <button
          type="button"
          className={styles.cart__backButton}
          onClick={() => navigate(backToMenuUrl)}
        >
          <BackIcon />
        </button>
        <div className={styles.cart__title}>장바구니</div>
        <div className={styles.cart__spacer} />
      </header>

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
                    type="button"
                    className={styles.cart__removeButton}
                    onClick={() => removeMenu(item.menuId)}
                    aria-label={`${item.name} 삭제`}
                  >
                    <CloseIcon fill="#fff" width={16} height={16} />
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
              type="button"
              className={styles.cart__addMoreButton}
              onClick={() => navigate(backToMenuUrl)}
            >
              메뉴 더 추가 +
            </button>
          </>
        )}
      </section>

      <footer className={styles.cart__bottom}>
        <button
          type="button"
          className={styles.cart__orderButton}
          disabled={items.length === 0}
        >
          <span className={styles.cart__orderCount}>{totalQuantity}</span>
          <span>{`${formatPrice(totalPrice)} 주문하기`}</span>
        </button>
      </footer>
    </main>
  );
}
