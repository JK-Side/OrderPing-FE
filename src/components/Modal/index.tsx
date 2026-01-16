import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import * as Dialog from '@radix-ui/react-dialog';
import CloseIcon from '@/assets/icons/close.svg?react';
import styles from './Modal.module.scss';

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;

interface ModalContentProps extends Dialog.DialogContentProps {
  className?: string;
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, ...props }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content ref={ref} className={clsx(styles.content, className)} {...props}>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  ),
);
ModalContent.displayName = 'ModalContent';

interface ModalHeaderProps {
  children: ReactNode;
  showClose?: boolean;
}

export function ModalHeader({ children, showClose = true }: ModalHeaderProps) {
  return (
    <div className={styles.header}>
      {children}
      {showClose && (
        <Dialog.Close className={styles.closeButton} aria-label="Close">
          <CloseIcon className={styles.closeIcon} aria-hidden="true" />
        </Dialog.Close>
      )}
    </div>
  );
}

interface ModalTitleProps extends Dialog.DialogTitleProps {
  className?: string;
}

export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, ...props }, ref) => (
    <Dialog.Title ref={ref} className={clsx(styles.title, className)} {...props} />
  ),
);
ModalTitle.displayName = 'ModalTitle';

interface ModalSectionProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function ModalBody({ className, ...props }: ModalSectionProps) {
  return <div className={clsx(styles.body, className)} {...props} />;
}

export function ModalFooter({ className, ...props }: ModalSectionProps) {
  return <div className={clsx(styles.footer, className)} {...props} />;
}

