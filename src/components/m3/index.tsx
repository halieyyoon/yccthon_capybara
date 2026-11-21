'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// Material Design 3 기본 컴포넌트. 스펙(높이·모서리·상태 레이어)은 m3.material.io 컴포넌트 가이드 기준.

import Link from 'next/link';
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useEffect,
  useId,
  useRef,
} from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Icon({ name, filled, size = 24, className }: { name: string; filled?: boolean; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx('material-symbols-rounded', filled && 'filled', className)}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${Math.min(48, Math.max(20, size))}` }}
    >
      {name}
    </span>
  );
}

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';

const buttonStyles: Record<ButtonVariant, string> = {
  filled: 'bg-primary text-on-primary disabled:bg-on-surface/12 disabled:text-on-surface/38',
  tonal: 'bg-secondary-container text-on-secondary-container disabled:bg-on-surface/12 disabled:text-on-surface/38',
  outlined: 'border border-outline text-primary disabled:border-on-surface/12 disabled:text-on-surface/38',
  text: 'text-primary disabled:text-on-surface/38 px-3',
  elevated: 'bg-surface-container-low text-primary shadow-[0_1px_2px_rgba(0,0,0,.3),0_1px_3px_1px_rgba(0,0,0,.15)] disabled:shadow-none disabled:text-on-surface/38',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  trailingIcon?: string;
  href?: string;
  size?: 'md' | 'lg';
}

export function Button({ variant = 'filled', icon, trailingIcon, href, size = 'md', className, children, ...rest }: ButtonProps) {
  const cls = cx(
    'state-layer inline-flex items-center justify-center gap-2 rounded-full label-large whitespace-nowrap select-none',
    'transition-[background-color,box-shadow] duration-200 disabled:cursor-not-allowed',
    size === 'lg' ? 'h-14 px-7 text-[16px]' : 'h-10 px-6',
    icon && variant !== 'text' && (size === 'lg' ? 'pl-6' : 'pl-4'),
    buttonStyles[variant],
    className,
  );
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={18} />}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" className={cls} {...rest}>
      {inner}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  variant = 'standard',
  selected,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string; variant?: 'standard' | 'filled' | 'tonal' | 'outlined'; selected?: boolean }) {
  const v = {
    standard: selected ? 'text-primary' : 'text-on-surface-variant',
    filled: 'bg-primary text-on-primary',
    tonal: 'bg-secondary-container text-on-secondary-container',
    outlined: 'border border-outline text-on-surface-variant',
  }[variant];
  return (
    <button type="button" aria-label={label} title={label} className={cx('state-layer grid size-10 place-items-center rounded-full disabled:opacity-38', v, className)} {...rest}>
      <Icon name={icon} filled={selected} />
    </button>
  );
}

export function Card({
  variant = 'filled',
  className,
  children,
  as: Tag = 'div',
}: {
  variant?: 'filled' | 'outlined' | 'elevated';
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
}) {
  const v = {
    filled: 'bg-surface-container-highest',
    outlined: 'bg-surface border border-outline-variant',
    elevated: 'bg-surface-container-low shadow-[0_1px_2px_rgba(0,0,0,.3),0_1px_3px_1px_rgba(0,0,0,.15)]',
  }[variant];
  return <Tag className={cx('rounded-m3-md', v, className)}>{children}</Tag>;
}

export function Chip({
  label,
  selected,
  onClick,
  icon,
  disabled,
  kind = 'filter',
}: {
  label: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
  kind?: 'filter' | 'assist' | 'suggestion';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={kind === 'filter' ? !!selected : undefined}
      className={cx(
        'state-layer inline-flex h-8 items-center gap-2 rounded-m3-sm label-large transition-colors duration-150 disabled:opacity-38',
        selected
          ? 'bg-secondary-container text-on-secondary-container pl-2 pr-4'
          : 'border border-outline-variant text-on-surface-variant px-4',
        !selected && icon && 'pl-2',
      )}
    >
      {selected && kind === 'filter' ? <Icon name="check" size={18} /> : icon ? <Icon name={icon} size={18} className="text-primary" /> : null}
      {label}
    </button>
  );
}

/** M3 Segmented button. 2~5개 옵션 단일 선택 */
export function SegmentedButton<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  dense,
}: {
  options: { value: T; label: ReactNode; icon?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  ariaLabel: string;
  dense?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex w-full overflow-hidden rounded-full border border-outline">
      {options.map((o, i) => {
        const sel = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => onChange(o.value)}
            className={cx(
              'state-layer flex min-w-0 flex-1 items-center justify-center gap-1.5 label-large transition-colors duration-150',
              dense ? 'h-10 px-1' : 'h-10 px-3',
              i > 0 && 'border-l border-outline',
              sel ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface',
            )}
          >
            {sel ? <Icon name="check" size={18} /> : o.icon ? <Icon name={o.icon} size={18} /> : null}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-8 w-[52px] shrink-0 rounded-full border-2 transition-colors duration-200',
        checked ? 'border-primary bg-primary' : 'border-outline bg-surface-container-highest',
      )}
    >
      <span
        className={cx(
          'absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full transition-all duration-200 ease-m3',
          checked ? 'left-[22px] size-6 bg-on-primary text-on-primary-container' : 'left-[6px] size-4 bg-outline',
        )}
      >
        {checked && <Icon name="check" size={16} className="text-primary" />}
      </span>
    </button>
  );
}

interface FieldProps {
  label: string;
  supporting?: ReactNode;
  error?: string;
  leadingIcon?: string;
  suffix?: ReactNode;
}

export function TextField({ label, supporting, error, leadingIcon, suffix, className, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <div
        className={cx(
          'group relative flex h-14 items-center rounded-m3-xs border bg-transparent transition-colors focus-within:border-2',
          error ? 'border-error' : 'border-outline focus-within:border-primary hover:border-on-surface',
        )}
      >
        {leadingIcon && <Icon name={leadingIcon} className="ml-3 text-on-surface-variant" />}
        <input
          id={id}
          placeholder=" "
          className="peer h-full w-full min-w-0 bg-transparent px-4 pt-1 body-large text-on-surface outline-none placeholder:text-transparent focus:placeholder:text-on-surface-variant/70"
          aria-invalid={!!error}
          {...rest}
        />
        {suffix && <span className="pr-4 body-large text-on-surface-variant">{suffix}</span>}
        <label
          htmlFor={id}
          className={cx(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 bg-surface px-1 body-large transition-all',
            leadingIcon ? 'left-11' : 'left-3',
            error ? 'text-error' : 'text-on-surface-variant group-focus-within:text-primary',
            'peer-focus:top-0 peer-focus:body-small peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:body-small',
          )}
        >
          {label}
        </label>
      </div>
      {(supporting || error) && (
        <p className={cx('mt-1 px-4 body-small', error ? 'text-error' : 'text-on-surface-variant')}>{error ?? supporting}</p>
      )}
    </div>
  );
}

export function TextArea({ label, supporting, className, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={className}>
      <div className="group relative rounded-m3-xs border border-outline transition-colors focus-within:border-2 focus-within:border-primary hover:border-on-surface">
        <textarea
          id={id}
          placeholder=" "
          className="peer block min-h-24 w-full resize-y bg-transparent px-4 pb-3 pt-4 body-large text-on-surface outline-none placeholder:text-transparent focus:placeholder:text-on-surface-variant/70"
          {...rest}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-3 top-7 -translate-y-1/2 bg-surface px-1 body-large text-on-surface-variant transition-all group-focus-within:text-primary peer-focus:top-0 peer-focus:body-small peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:body-small"
        >
          {label}
        </label>
      </div>
      {supporting && <p className="mt-1 px-4 body-small text-on-surface-variant">{supporting}</p>}
    </div>
  );
}

export function LinearProgress({ value, className }: { value?: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value === undefined ? undefined : Math.round(value * 100)}
      className={cx('relative h-1 w-full overflow-hidden rounded-full bg-secondary-container', className)}
    >
      {value === undefined ? (
        <div className="absolute inset-y-0 w-1/3 animate-[m3-indeterminate_1.4s_var(--md-sys-motion-standard)_infinite] rounded-full bg-primary" />
      ) : (
        <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-m3" style={{ width: `${value * 100}%` }} />
      )}
      <style>{`@keyframes m3-indeterminate{0%{left:-35%}100%{left:100%}}`}</style>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('border-0 border-t border-outline-variant', className)} />;
}

export function Dialog({
  open,
  onClose,
  icon,
  title,
  children,
  actions,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  icon?: string;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-scrim/32" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal
        tabIndex={-1}
        className={cx(
          'enter-scale relative flex max-h-[min(90dvh,760px)] w-full flex-col rounded-m3-xl bg-surface-container-high text-on-surface outline-none',
          wide ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        <div className={cx('px-6 pt-6', icon && 'text-center')}>
          {icon && <Icon name={icon} className="mb-4 text-secondary" />}
          <h2 className="headline-small">{title}</h2>
        </div>
        <div className="mt-4 overflow-y-auto px-6 body-medium text-on-surface-variant">{children}</div>
        <div className="flex justify-end gap-2 px-6 pb-6 pt-6">{actions ?? <Button variant="text" onClick={onClose}>닫기</Button>}</div>
      </div>
    </div>
  );
}

export function Snackbar({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div role="status" className="enter fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 md:bottom-24">
      <div className="min-h-12 max-w-xl rounded-m3-xs bg-inverse-surface px-4 py-3.5 body-medium text-inverse-on-surface shadow-lg">{message}</div>
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" className="flex border-b border-outline-variant">
      {tabs.map((t) => {
        const sel = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={sel}
            onClick={() => onChange(t.value)}
            className={cx('state-layer relative h-12 flex-1 px-4 title-small transition-colors', sel ? 'text-primary' : 'text-on-surface-variant')}
          >
            {t.label}
            {sel && <span className="absolute inset-x-[20%] bottom-0 h-[3px] rounded-t-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}

export function ListItem({
  leading,
  headline,
  supporting,
  trailing,
  onClick,
}: {
  leading?: ReactNode;
  headline: ReactNode;
  supporting?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className={cx('flex w-full items-center gap-4 px-4 py-3 text-left', onClick && 'state-layer')}>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="body-large text-on-surface">{headline}</div>
        {supporting && <div className="body-medium text-on-surface-variant">{supporting}</div>}
      </div>
      {trailing}
    </Comp>
  );
}

/** 닉네임 첫 글자 아바타 */
export function Monogram({ name, tone = 'primary', size = 40 }: { name: string; tone?: 'primary' | 'secondary' | 'tertiary'; size?: number }) {
  const cls = {
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary: 'bg-tertiary-container text-on-tertiary-container',
  }[tone];
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-full title-medium', cls)} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.slice(0, 1)}
    </span>
  );
}
