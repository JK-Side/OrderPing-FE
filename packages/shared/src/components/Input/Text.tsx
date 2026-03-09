import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./Input.module.scss";

export const Text = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`${styles.input} ${className || ""}`.trim()}
      {...props}
    />
  );
});

Text.displayName = "Text";
