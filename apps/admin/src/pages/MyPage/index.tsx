import { Link } from 'react-router-dom';
import type { MyPageStore } from '@/api/user/entity';
import KakaoIcon from '@/assets/icons/kakao.svg?react';
import AccountSettingsModal from '@/pages/MyPage/components/AccountSettingsModal';
import StoreSettingsModal from '@/pages/MyPage/components/StoreSettingsModal';
import { useMyPage } from '@/pages/MyPage/hooks/useMyPage';
import { useUserInfo } from '@/utils/hooks/useUserInfo';
import styles from './MyPage.module.scss';

const FALLBACK_TEXT = 'Not available';

function getValue(value?: string | number | null) {
  if (value === null || value === undefined) return FALLBACK_TEXT;
  if (typeof value === 'string' && value.trim().length === 0) return FALLBACK_TEXT;
  return String(value);
}

function StoreInfoCard({ store }: { store: MyPageStore }) {
  return (
    <>
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>계좌 정보</h2>
          <AccountSettingsModal store={store} className={styles.infoFixButton} />
        </div>

        <div className={styles.cardBody}>
          <section className={styles.infoGroup}>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}> · 계좌 번호</span>
                <span className={styles.infoValue}>{getValue(store.account?.accountNumber)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}> · 은행명</span>
                <span className={styles.infoValue}>{getValue(store.account?.bankName)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}> · 입금자명</span>
                <span className={styles.infoValue}>{getValue(store.account?.accountHolder)}</span>
              </div>
            </div>
          </section>
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>주점 정보</h2>
          <StoreSettingsModal store={store} className={styles.infoFixButton} />
        </div>

        <div className={styles.cardBody}>
          <section className={styles.infoGroup}>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}> · 주점명</span>
                <span className={styles.infoValue}>{getValue(store.name)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}> · 주점 설명</span>
                <span className={styles.infoValue}>{getValue(store.description)}</span>
              </div>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}

function LoadingState() {
  return (
    <div className={styles.stateCard}>
      <h2 className={styles.stateTitle}>계좌 정보 로딩 중</h2>
      <p className={styles.stateDescription}>주점 정보와 계좌 정보를 가져오고 있습니다.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.stateCard}>
      <div className={styles.stateTitle}>아직 등록된 주점이 없어요</div>
      <div className={styles.stateDescription}>첫 번째 주점을 등록하고 주점 정보와 계정 정보를 관리해보세요.</div>
      <div className={styles.stateActions}>
        <Link to="/store/create" className={styles.primaryLink}>
          주점 생성하러 가기
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : undefined;
  const message =
    status === 404
      ? '해당 로그인 정보로 등록된 계정 정보를 찾을 수 없어요.'
      : error instanceof Error
        ? error.message
        : '현재 페이지를 불러올 수 없어요. 잠시 후 다시 시도해 주세요.';

  return (
    <div className={styles.stateCard}>
      <h2 className={styles.stateTitle}>My Page is unavailable</h2>
      <p className={styles.stateDescription}>{message}</p>
      <div className={styles.stateActions}>
        <Link to="/" className={styles.secondaryLink}>
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function MyPage() {
  const { data: userInfo } = useUserInfo();
  const { data: myPage, isPending, isError, error } = useMyPage();

  const stores = myPage?.stores ?? [];
  const userName = userInfo?.userName?.trim() || 'User';

  return (
    <section className={styles.myPage}>
      <div className={styles.container}>
        <section className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <span className={styles.eyebrow}>My Page</span>
            <h1 className={styles.title}>
              <span className={styles.titleAccent}>{userName}</span> 의 마이페이지
            </h1>
          </div>

          <span className={styles.statusBadge}>
            <KakaoIcon />
            카카오 계정 연동 중
          </span>
        </section>

        <section className={styles.content}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>계정 정보</h2>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>이름</span>
                  <span className={styles.infoValue}>{userName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>로그인 상태</span>
                  <span className={styles.infoValue}>카카오 계정 연동 중</span>
                </div>
              </div>
            </div>
          </article>

          {isPending ? <LoadingState /> : null}
          {!isPending && isError ? <ErrorState error={error} /> : null}
          {!isPending && !isError && stores.length === 0 ? <EmptyState /> : null}
          {!isPending && !isError ? stores.map((store) => <StoreInfoCard key={store.storeId} store={store} />) : null}
        </section>
      </div>
    </section>
  );
}
