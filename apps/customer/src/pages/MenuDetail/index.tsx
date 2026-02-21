import { getMenuDetailByMenuId } from "../../api/customer";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import BackIcon from "@/assets/icons/back.svg?react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import styles from "./MenuDetail.module.scss";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function MenuDetailPage() {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { menuId: menuIdParam } = useParams<{ menuId: string }>();
  const [searchParams] = useSearchParams();

  const menuId = useMemo(() => {
    const parsed = Number(menuIdParam);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [menuIdParam]);

  const tableId = searchParams.get("tableId");

  const { data, isLoading, error } = useQuery({
    queryKey: ["customer", "menu-detail", menuId],
    queryFn: () => getMenuDetailByMenuId(menuId as number),
    enabled: menuId !== null,
  });

  const hasNotFoundError =
    (error as { status?: number } | null)?.status === 404;

  const goBack = () => {
    navigate(tableId ? `/?tableId=${tableId}` : "/");
  };

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 99));
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const totalPrice = (data?.price ?? 0) * quantity;

  return (
    <main className={styles.menuDetail}>
      <header className={styles.menuDetail__header}>
        <button
          type="button"
          className={styles.menuDetail__backButton}
          onClick={goBack}
        >
          <BackIcon />
        </button>
        <button type="button" className={styles.menuDetail__historyButton}>
          주문 내역
        </button>
      </header>

      {!menuId ? (
        <div className={styles.menuDetail__status}>
          유효하지 않은 메뉴 ID예요.
        </div>
      ) : null}
      {menuId && isLoading ? (
        <div className={styles.menuDetail__status}>
          메뉴 정보를 불러오는 중입니다.
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
                이미지 준비 중
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
              <div className={styles.menuDetail__quantityControl}>
                <button
                  type="button"
                  className={styles.menuDetail__quantityButton}
                  onClick={decreaseQuantity}
                  disabled={data.isSoldOut}
                >
                  -
                </button>
                <span className={styles.menuDetail__quantityValue}>
                  {quantity}
                </span>
                <button
                  type="button"
                  className={styles.menuDetail__quantityButton}
                  onClick={increaseQuantity}
                  disabled={data.isSoldOut}
                >
                  +
                </button>
              </div>
            </div>
          </section>

          <footer className={styles.menuDetail__bottom}>
            <button
              type="button"
              className={styles.menuDetail__addButton}
              disabled={data.isSoldOut}
            >
              {data.isSoldOut ? (
                "품절된 메뉴입니다"
              ) : (
                <>
                  <span className={styles.menuDetail__quantity}>
                    {quantity}
                  </span>
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
