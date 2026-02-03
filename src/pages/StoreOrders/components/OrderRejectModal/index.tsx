import * as Dialog from '@radix-ui/react-dialog';
import CloseIcon from '@/assets/icons/close.svg?react';
import Button from '@/components/Button';
import { Modal, ModalBody, ModalContent, ModalFooter } from '@/components/Modal';
import styles from './OrderRejectModal.module.scss';

interface OrderRejectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  isLoading?: boolean;
}

export default function OrderRejectModal({ open, onOpenChange, onConfirm, isLoading = false }: OrderRejectModalProps) {
  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm?.();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={styles.modalContent}>
        <Dialog.Close className={styles.closeButton} aria-label="Close">
          <CloseIcon className={styles.closeIcon} aria-hidden="true" />
        </Dialog.Close>
        <ModalBody className={styles.body}>
          <Dialog.Title className={styles.message}>정말 주문을 취소할까요?</Dialog.Title>
        </ModalBody>
        <ModalFooter className={styles.footer}>
          <Button
            type="button"
            variant="danger"
            className={styles.footerButton}
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            아니요
          </Button>
          <Button
            type="button"
            className={styles.footerButton}
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            loadingText="취소 중..."
          >
            네
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
