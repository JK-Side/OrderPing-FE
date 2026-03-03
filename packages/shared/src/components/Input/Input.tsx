import ErrorCircleIcon from "../../assets/icons/error-circle.svg?react";
import InfoCircleIcon from "../../assets/icons/info-circle.svg?react";
import WarningCircleIcon from "../../assets/icons/warning-circle.svg?react";
import clsx from "clsx";
import type { ReactNode, SVGProps } from "react";
import styles from "./Input.module.scss";

export type InputMessageState = "error" | "warning" | "success" | "info";

interface InputProps {
  label?: string;
  message?: string;
  messageState?: InputMessageState;
  required?: boolean;
  children: ReactNode;
}

function SuccessCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="7" fill="#11B76B" />
      <path
        d="m5.1 8.2 1.8 1.8 4-4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InputRoot({
  label,
  message,
  messageState,
  required,
  children,
}: InputProps) {
  const MessageIcon =
    messageState === "warning"
      ? WarningCircleIcon
      : messageState === "info"
        ? InfoCircleIcon
        : messageState === "success"
          ? SuccessCircleIcon
          : ErrorCircleIcon;

  return (
    <div className={styles.wrapper}>
      {label ? (
        <label className={styles.label}>
          {label}
          {required ? <span className={styles.required}>*</span> : null}
        </label>
      ) : null}

      {children}

      {message ? (
        <div className={styles.infoWrapper}>
          {messageState ? (
            <MessageIcon className={styles.messageIcon} />
          ) : null}
          <div
            className={clsx(
              styles.message,
              messageState && styles[messageState],
            )}
          >
            {message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
