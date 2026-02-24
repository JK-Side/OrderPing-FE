import BackIcon from '@/assets/icons/back.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';
import { useQuery } from '@tanstack/react-query';
import { getPaymentTossDeeplink, getTableMenusByTableId } from '../../api/customer';
import QuantityControl from '../../components/QuantityControl';
import { useToast } from '../../components/Toast/useToast';
import { useCart } from '../../stores/cart';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './Cart.module.scss';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;
const TOSS_ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=viva.republica.toss';
const TOSS_IOS_STORE_URL = 'https://apps.apple.com/us/app/%ED%86%A0%EC%8A%A4/id839333328?l=ko';
const APP_OPEN_FALLBACK_DELAY_MS = 1200;

type MobilePlatform = 'android' | 'ios' | 'other';

const isTossAppDeeplink = (url: string) => /^supertoss:\/\//i.test(url);

const isExternalPaymentUrl = (url: string) => /^(https?:\/\/|supertoss:\/\/)/i.test(url);

const getMobilePlatform = (): MobilePlatform => {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (/android/.test(ua)) return 'android';
  if (isIOS) return 'ios';
  return 'other';
};

export default function CartPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpeningToss, setIsOpeningToss] = useState(false);
  const { tableId: tableIdParam } = useParams<{ tableId?: string }>();
  const [searchParams] = useSearchParams();
  const tableId = tableIdParam ?? searchParams.get('tableId');
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
  const { data: tableMenuData } = useQuery({
    queryKey: ['customer', 'table-menus', tableIdNumber],
    queryFn: () => getTableMenusByTableId(tableIdNumber as number),
    enabled: tableIdNumber !== null,
  });

  const backToMenuUrl = useMemo(
    () => (tableId ? `/tables/${tableId}` : '/'),
    [tableId],
  );

  useEffect(() => {
    setActiveTable(tableIdNumber);
  }, [setActiveTable, tableIdNumber]);

  const openTossWithStoreFallback = async (tossDeeplink: string) => {
    if (!isExternalPaymentUrl(tossDeeplink)) {
      throw new Error('Invalid toss deeplink');
    }

    if (!isTossAppDeeplink(tossDeeplink)) {
      window.location.href = tossDeeplink;
      return;
    }

    const platform = getMobilePlatform();

    await new Promise<void>((resolve) => {
      let finished = false;

      const cleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearTimeout(fallbackTimer);
      };

      const finish = () => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve();
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          finish();
        }
      };

      const fallbackTimer = window.setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          finish();
          return;
        }

        if (platform === 'android') {
          window.location.href = TOSS_ANDROID_STORE_URL;
          finish();
          return;
        }

        if (platform === 'ios') {
          window.location.href = TOSS_IOS_STORE_URL;
          finish();
          return;
        }

        toast({
          message: '모바일 기기에서 토스 앱으로 결제해 주세요.',
          variant: 'info',
          duration: 3000,
        });
        finish();
      }, APP_OPEN_FALLBACK_DELAY_MS);

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.location.href = tossDeeplink;
    });
  };

  const handleOrderButtonClick = async () => {
    if (items.length === 0 || isOpeningToss) return;

    if (tableIdNumber === null) {
      toast({
        message: '테이블 정보를 확인할 수 없어요.',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    if (totalPrice <= 0) {
      toast({
        message: '결제 금액이 올바르지 않아요.',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!tableMenuData?.storeId) {
      toast({
        message: '매장 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.',
        variant: 'info',
        duration: 3000,
      });
      return;
    }

    setIsOpeningToss(true);

    try {
      const { tossDeeplink } = await getPaymentTossDeeplink({
        storeId: tableMenuData.storeId,
        amount: totalPrice,
      });

      if (!tossDeeplink) {
        throw new Error('Empty toss deeplink');
      }

      await openTossWithStoreFallback(tossDeeplink);
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;

      toast({
        message:
          status === 404
            ? '입금 계좌 정보를 찾을 수 없어요.'
            : '토스 결제 링크를 불러오지 못했어요.',
        variant: 'error',
        duration: 3000,
      });
    } finally {
      setIsOpeningToss(false);
    }
  };

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
                    <div className={styles.cart__itemPrice}>{formatPrice(item.price)}</div>
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
                  onDecrease={() => setMenuQuantity(item.menuId, Math.max(item.quantity - 1, 1))}
                  onIncrease={() =>
                    setMenuQuantity(item.menuId, Math.min(item.quantity + 1, 99))
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
          disabled={items.length === 0 || isOpeningToss}
          onClick={handleOrderButtonClick}
        >
          <span className={styles.cart__orderCount}>{totalQuantity}</span>
          <span>{isOpeningToss ? '토스 여는 중...' : `${formatPrice(totalPrice)} 주문하기`}</span>
        </button>
      </footer>
    </main>
  );
}
