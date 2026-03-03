import { Link } from 'react-router-dom';
import type { MyPageStore } from '@/api/user/entity';
import KakaoIcon from '@/assets/icons/kakao.svg?react';
import Button from '@/components/Button';
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
          <Button
            type="button"
            variant="ghost"
            className={styles.infoFixButton}
            onClick={() => {}}
            // isLoading={}
            // disabled={}
            loadingText="수정 중..."
          >
            수정하기
          </Button>
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
          <Button
            type="button"
            variant="ghost"
            className={styles.infoFixButton}
            onClick={() => {}}
            // isLoading={}
            // disabled={}
            loadingText="수정 중..."
          >
            수정하기
          </Button>
        </div>

        <div className={styles.cardBody}>
          <section className={styles.infoGroup}>
            <div className={styles.groupTitle}>주점 정보</div>
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
      <h2 className={styles.stateTitle}>Loading your account</h2>
      <p className={styles.stateDescription}>We are fetching your stores and payout details.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.stateCard}>
      <h2 className={styles.stateTitle}>No store yet</h2>
      <p className={styles.stateDescription}>Create your first store to manage store and account details here.</p>
      <div className={styles.stateActions}>
        <Link to="/store/create" className={styles.primaryLink}>
          Create store
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : undefined;
  const message =
    status === 404
      ? 'We could not find account details for this login.'
      : error instanceof Error
        ? error.message
        : 'Unable to load this page right now.';

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
