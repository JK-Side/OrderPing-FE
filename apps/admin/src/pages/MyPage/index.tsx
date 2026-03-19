import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { MyPageStore } from '@/api/user/entity';
import KakaoIcon from '@/assets/icons/kakao.svg?react';
import Button from '@/components/Button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import AccountSettingsModal from '@/pages/MyPage/components/AccountSettingsModal';
import StoreSettingsModal from '@/pages/MyPage/components/StoreSettingsModal';
import { useDeleteStore } from '@/pages/MyPage/hooks/useDeleteStore';
import { useDeleteUser } from '@/pages/MyPage/hooks/useDeleteUser';
import { useMyPage } from '@/pages/MyPage/hooks/useMyPage';
import { useAuth } from '@/utils/hooks/useAuth';
import { useUserInfo } from '@/utils/hooks/useUserInfo';
import styles from './MyPage.module.scss';

function getValue(value?: string | number | null) {
  if (value === null || value === undefined) return 'Not available';
  if (typeof value === 'string' && value.trim().length === 0) return 'Not available';
  return String(value);
}

interface StoreInfoCardProps {
  store: MyPageStore;
  onStoreDeleteClick: (store: MyPageStore) => void;
  isActionPending: boolean;
}

function StoreInfoCard({ store, onStoreDeleteClick, isActionPending }: StoreInfoCardProps) {
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
                <span className={styles.infoLabel}>계좌 번호</span>
                <span className={styles.infoValue}>{getValue(store.account?.accountNumber)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>은행명</span>
                <span className={styles.infoValue}>{getValue(store.account?.bankName)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>예금주명</span>
                <span className={styles.infoValue}>{getValue(store.account?.accountHolder)}</span>
              </div>
            </div>
          </section>
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>주점 정보</h2>
          <div className={styles.cardSetting}>
            <StoreSettingsModal store={store} className={styles.infoFixButton} />
            <Button
              type="button"
              variant="danger"
              className={styles.dangerActionButton}
              onClick={() => onStoreDeleteClick(store)}
              disabled={isActionPending}
            >
              주점 삭제
            </Button>
          </div>
        </div>

        <div className={styles.cardBody}>
          <section className={styles.infoGroup}>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>주점명</span>
                <span className={styles.infoValue}>{getValue(store.name)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>주점 설명</span>
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
      <h2 className={styles.stateTitle}>마이페이지 로딩 중</h2>
      <p className={styles.stateDescription}>주점 정보와 계좌 정보를 불러오고 있습니다.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.stateCard}>
      <div className={styles.stateTitle}>아직 등록된 주점이 없어요</div>
      <div className={styles.stateDescription}>첫 번째 주점을 등록하고 주점 정보를 관리해 보세요.</div>
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
      ? '로그인 정보로 등록된 계정 정보를 찾을 수 없습니다.'
      : error instanceof Error
        ? error.message
        : '현재 페이지를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.';

  return (
    <div className={styles.stateCard}>
      <h2 className={styles.stateTitle}>마이페이지를 이용할 수 없습니다.</h2>
      <p className={styles.stateDescription}>{message}</p>
      <div className={styles.stateActions}>
        <Link to="/" className={styles.secondaryLink}>
          메인 화면으로
        </Link>
      </div>
    </div>
  );
}

export default function MyPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { clearAccessToken } = useAuth();
  const { data: userInfo } = useUserInfo();
  const { data: myPage, isPending, isError, error } = useMyPage();
  const { mutateAsync: deleteUserById, isPending: isUserDeleting } = useDeleteUser();
  const { mutateAsync: deleteStoreById, isPending: isStoreDeleting } = useDeleteStore();
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [deleteTargetStore, setDeleteTargetStore] = useState<MyPageStore | null>(null);

  const stores = myPage?.stores ?? [];
  const userName = userInfo?.userName?.trim() || 'User';
  const userId = myPage?.userId ?? stores.find((store) => store.userId !== undefined)?.userId;
  const isDangerActionPending = isUserDeleting || isStoreDeleting;

  const handleDeleteUserOpenChange = (open: boolean) => {
    if (isUserDeleting) return;
    setIsDeleteUserModalOpen(open);
  };

  const handleDeleteStoreOpenChange = (open: boolean) => {
    if (isStoreDeleting) return;
    if (!open) {
      setDeleteTargetStore(null);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userId) {
      toast({
        message: '회원 아이디를 가져오는 데 실패했습니다.',
        variant: 'error',
      });
      return;
    }

    try {
      await deleteUserById(userId);
      clearAccessToken();
      window.location.href = '/';
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message =
        status === 404
          ? '회원을 찾을 수 없습니다.'
          : status === 401
            ? '로그인이 필요합니다.'
            : '회원 탈퇴에 실패했습니다.';

      toast({
        message,
        variant: 'error',
      });
    } finally {
      setIsDeleteUserModalOpen(false);
    }
  };

  const handleConfirmDeleteStore = async () => {
    if (!deleteTargetStore) return;

    try {
      await deleteStoreById(deleteTargetStore.storeId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myPage'] }),
        queryClient.invalidateQueries({ queryKey: ['userInfo'] }),
      ]);
      toast({
        message: '주점이 성공적으로 삭제되었습니다.',
        variant: 'info',
      });
      setDeleteTargetStore(null);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message =
        status === 401
          ? '로그인이 필요한 기능입니다.'
          : status === 403
            ? '자신의 주점만 삭제 가능합니다.'
            : status === 404
              ? '주점을 찾을 수 없습니다.'
              : '주점 삭제에 실패했습니다.';

      toast({
        message,
        variant: 'error',
      });
    }
  };

  return (
    <section className={styles.myPage}>
      <div className={styles.container}>
        <section className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <span className={styles.eyebrow}>My Page</span>
            <h1 className={styles.title}>
              <span className={styles.titleAccent}>{userName}</span> 님의 마이페이지
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
          {!isPending && !isError
            ? stores.map((store) => (
                <StoreInfoCard
                  key={store.storeId}
                  store={store}
                  onStoreDeleteClick={setDeleteTargetStore}
                  isActionPending={isDangerActionPending}
                />
              ))
            : null}
          <div className={styles.dangerActions}>
            <Button
              type="button"
              variant="danger"
              className={styles.dangerActionButton}
              onClick={() => setIsDeleteUserModalOpen(true)}
              disabled={isDangerActionPending || !userId}
            >
              회원 탈퇴
            </Button>
          </div>
        </section>
      </div>

      <Modal open={isDeleteUserModalOpen} onOpenChange={handleDeleteUserOpenChange}>
        <ModalContent className={styles.dangerModalContent}>
          <ModalHeader>
            <ModalTitle>회원 탈퇴</ModalTitle>
          </ModalHeader>
          <ModalBody className={styles.dangerModalBody}>
            <p className={styles.dangerModalMessage}>
              회원 탈퇴 시 계정 정보가 삭제되며 복구할 수 없습니다.
              <br />
              정말 탈퇴하시겠습니까?
            </p>
          </ModalBody>
          <ModalFooter className={styles.dangerModalFooter}>
            <Button
              type="button"
              variant="ghost"
              className={styles.dangerModalButton}
              onClick={() => setIsDeleteUserModalOpen(false)}
              disabled={isUserDeleting}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="danger"
              className={styles.dangerModalButton}
              onClick={handleConfirmDeleteUser}
              isLoading={isUserDeleting}
              disabled={isUserDeleting || !userId}
              loadingText="탈퇴 중..."
            >
              탈퇴하기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={!!deleteTargetStore} onOpenChange={handleDeleteStoreOpenChange}>
        <ModalContent className={styles.dangerModalContent}>
          <ModalHeader>
            <ModalTitle>주점 삭제</ModalTitle>
          </ModalHeader>
          <ModalBody className={styles.dangerModalBody}>
            <div className={styles.dangerModalMessage}>
              {'<'}
              {deleteTargetStore?.name ?? '주점'}
              {'>'}
              을(를) 정말 삭제하시겠습니까?
              <br />
              삭제한 주점은 복구할 수 없습니다.
            </div>
          </ModalBody>
          <ModalFooter className={styles.dangerModalFooter}>
            <Button
              type="button"
              variant="ghost"
              className={styles.dangerModalButton}
              onClick={() => setDeleteTargetStore(null)}
              disabled={isStoreDeleting}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="danger"
              className={styles.dangerModalButton}
              onClick={handleConfirmDeleteStore}
              isLoading={isStoreDeleting}
              disabled={isStoreDeleting || !deleteTargetStore}
              loadingText="삭제 중..."
            >
              삭제하기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
