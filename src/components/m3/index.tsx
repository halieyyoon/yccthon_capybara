'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 기본 컴포넌트 — Google Classroom 기반 Material Design 3, stt.gyuhyeok.com(E:UM) 규칙을 따른다.
// 주요 버튼 = 연한 파랑 바탕 + 진한 파랑 글자(화면마다 1개) · 보조 = 연한 회색 면 · 텍스트 = 파랑 글자
// 카드 12 / 패널 16 / 버튼·칩 알약 · 세그먼트·탭 = 연한 알약 안 흰 칩 · 대화상자 22 · 그림자는 떠 있는 것에만

import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
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

type ButtonVariant = 'prominent' | 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';

const buttonStyles: Record<ButtonVariant, string> = {
  prominent: 'bg-primary text-on-primary hover:brightness-95',
  // 주요: 연한 파랑 + 진한 파랑 글자 (화면마다 하나)
  filled: 'bg-primary-container text-on-primary-container hover:bg-[#a8d7fa] dark:hover:bg-[#0b5a8f]',
  // 보조 강조: 연한 파랑 면
  tonal: 'bg-secondary-container text-on-secondary-container hover:brightness-95',
  // 보조: 테두리 없이 연한 회색 면
  outlined: 'bg-surface-container text-on-surface hover:bg-surface-container-highest',
  // 텍스트: 파랑 글자
  text: 'text-secondary hover:bg-secondary-container px-3',
  elevated: 'bg-surface text-on-surface shadow-[0_1px_3px_rgba(32,33,36,.14)] hover:bg-surface-container',
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
    'inline-flex items-center justify-center gap-1.5 rounded-full label-large whitespace-nowrap select-none',
    'transition-[background-color,border-color,color,transform] duration-200 ease-m3 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100',
    size === 'lg' ? 'min-h-12 px-7 text-[15px]' : 'min-h-10 px-5',
    buttonStyles[variant],
    className,
  );
  const inner = (
    <>
      {icon && <Icon name={icon} size={18} />}
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
    standard: cx('hover:bg-surface-container', selected ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'),
    filled: 'bg-primary-container text-on-primary-container',
    tonal: 'bg-surface-container text-on-surface',
    outlined: 'bg-surface-container text-on-surface-variant',
  }[variant];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx('grid size-10 place-items-center rounded-full transition-colors duration-200 disabled:opacity-40 pointer-coarse:size-11', v, className)}
      {...rest}
    >
      <Icon name={icon} filled={selected} size={22} />
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
    // 테두리 지양: 흰 본문 위에서는 연한 면으로 구분
    filled: 'bg-surface-container-low',
    outlined: 'bg-surface-container-low',
    elevated: 'bg-surface shadow-[0_1px_3px_rgba(32,33,36,.12),0_4px_16px_rgba(32,33,36,.06)]',
  }[variant];
  return <Tag className={cx('rounded-m3-md', v, className)}>{children}</Tag>;
}

/** Classroom 수업 카드처럼 색조 머리띠가 있는 카드 */
export function BandCard({
  band,
  head,
  children,
  className,
  selected,
}: {
  band: 'fun' | 'balanced' | 'serious';
  head: ReactNode;
  children?: ReactNode;
  className?: string;
  selected?: boolean;
}) {
  return (
    <div
      className={cx('overflow-hidden rounded-m3-md bg-surface-container-low transition-shadow duration-200', className)}
      style={selected ? { boxShadow: `0 0 0 2px var(--band-${band}-fg)` } : undefined}
    >
      <div className="px-5 pb-4 pt-5" style={{ background: `var(--band-${band})`, color: `var(--band-${band}-fg)` }}>
        {head}
      </div>
      {children && <div className="px-5 py-4">{children}</div>}
    </div>
  );
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
        'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 label-large transition-colors duration-200 disabled:opacity-40 pointer-coarse:min-h-11',
        selected ? 'bg-secondary-container font-semibold text-on-secondary-container' : 'bg-surface-container text-on-surface hover:bg-surface-container-highest',
        (selected || icon) && 'pl-3',
      )}
    >
      {selected && kind === 'filter' ? <Icon name="check" size={18} /> : icon ? <Icon name={icon} size={18} className="text-secondary" /> : null}
      {label}
    </button>
  );
}

/** 알약 묶음 버튼(E:UM segmented): 연한 바탕 안에서 고른 것만 흰 칩 */
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
    <div role="radiogroup" aria-label={ariaLabel} className="flex w-full gap-1 rounded-full bg-surface-container p-1">
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-full label-large transition-[background-color,color,box-shadow] duration-200 pointer-coarse:min-h-11',
              dense ? 'px-1' : 'px-3',
              sel ? 'bg-surface font-semibold text-secondary shadow-[0_1px_2px_rgba(32,33,36,.14)]' : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {o.icon && <Icon name={o.icon} size={18} />}
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
        checked ? 'border-primary bg-primary' : 'border-transparent bg-surface-container-highest',
      )}
    >
      <span
        className={cx(
          'absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full transition-all duration-200 ease-m3',
          checked ? 'left-[22px] size-6 bg-on-primary' : 'left-[6px] size-4 bg-outline',
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

// 입력란: 테두리 없이 연한 면(M3 filled 계열) + 포커스 때만 파랑 링
const fieldBox =
  'w-full rounded-m3-sm bg-surface-container text-[15px] text-on-surface outline-none transition-[background-color,box-shadow] duration-200 placeholder:text-on-surface-variant/60 hover:bg-surface-container-highest focus:bg-surface focus:shadow-[0_0_0_2px_var(--md-sys-color-primary)] disabled:opacity-60';

/** 입력란: 이름표 위 + 테두리 상자(stt) */
export function TextField({ label, supporting, error, leadingIcon, suffix, className, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={cx('grid gap-1.5', className)}>
      <label htmlFor={id} className="label-medium text-on-surface-variant">
        {label}
      </label>
      <div className="relative flex items-center">
        {leadingIcon && <Icon name={leadingIcon} size={20} className="pointer-events-none absolute left-3 text-on-surface-variant" />}
        <input
          id={id}
          aria-invalid={!!error}
          className={cx(fieldBox, 'min-h-11 py-2.5', leadingIcon ? 'pl-10' : 'pl-3.5', suffix ? 'pr-32' : 'pr-3.5', error && 'shadow-[0_0_0_2px_var(--md-sys-color-error)]')}
          {...rest}
        />
        {suffix && <span className="pointer-events-none absolute right-3.5 text-[15px] text-on-surface-variant">{suffix}</span>}
      </div>
      {(supporting || error) && <p className={cx('body-small', error ? 'text-error' : 'text-on-surface-variant')}>{error ?? supporting}</p>}
    </div>
  );
}

export function TextArea({ label, supporting, className, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={cx('grid gap-1.5', className)}>
      <label htmlFor={id} className="label-medium text-on-surface-variant">
        {label}
      </label>
      <textarea id={id} className={cx(fieldBox, 'block min-h-24 resize-y px-3.5 py-2.5 leading-relaxed')} {...rest} />
      {supporting && <p className="body-small text-on-surface-variant">{supporting}</p>}
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
      className={cx('relative h-1.5 w-full overflow-hidden rounded-full bg-secondary-container', className)}
    >
      {value === undefined ? (
        <div className="absolute inset-y-0 w-1/3 animate-[m3-indeterminate_1.4s_var(--md-sys-motion-standard)_infinite] rounded-full bg-primary" />
      ) : (
        <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-m3" style={{ width: `${value * 100}%` }} />
      )}
      <style>{`@keyframes m3-indeterminate{0%{left:-35%}100%{left:100%}}`}</style>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('border-0 border-t border-[#e8eaed] dark:border-[#333537]', className)} />;
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
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-scrim/50" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal
        tabIndex={-1}
        className={cx(
          'dialog-enter relative flex max-h-[calc(100dvh-48px)] w-full flex-col rounded-m3-xl bg-surface text-on-surface shadow-[0_12px_45px_rgba(32,33,36,.27)] outline-none',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        <div className="flex items-center gap-3 pb-2 pl-6 pr-4 pt-5">
          {icon && <Icon name={icon} className="text-secondary" />}
          <h2 className="flex-1 headline-small">{title}</h2>
          <IconButton icon="close" label="닫기" onClick={onClose} />
        </div>
        <div className="overflow-y-auto overscroll-contain px-6 pb-2 pt-2 body-medium text-on-surface-variant">{children}</div>
        {actions && <div className="flex justify-end gap-2 px-6 pb-6 pt-4">{actions}</div>}
        {!actions && <div className="h-4" />}
      </div>
    </div>,
    document.body,
  );
}

export function Snackbar({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div role="status" className="enter fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 md:bottom-8">
      <div className="max-w-xl rounded-m3-sm bg-inverse-surface px-5 py-3 body-medium text-inverse-on-surface shadow-[0_4px_16px_rgba(32,33,36,.12)]">{message}</div>
    </div>
  );
}

/** 모드 전환 탭(E:UM mode-switch): 알약 안에서 강조가 미끄러지듯 옮겨 간다 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const index = Math.max(0, tabs.findIndex((t) => t.value === value));
  return (
    <div role="tablist" className="relative inline-grid w-full grid-flow-col auto-cols-fr rounded-full bg-surface-container p-1 sm:w-auto">
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 rounded-full bg-surface shadow-[0_1px_2px_rgba(32,33,36,.14)] transition-transform duration-[360ms] ease-m3-decel"
        style={{ width: `calc((100% - 8px) / ${tabs.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {tabs.map((t) => {
        const sel = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={sel}
            onClick={() => onChange(t.value)}
            className={cx('relative z-10 min-h-10 whitespace-nowrap rounded-full px-5 label-large transition-colors duration-200', sel ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface')}
          >
            {t.label}
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
    <Comp onClick={onClick} className={cx('flex w-full items-center gap-4 px-4 py-3 text-left', onClick && 'transition-colors hover:bg-surface-container')}>
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
    <span className={cx('grid shrink-0 place-items-center rounded-full font-semibold', cls)} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.slice(0, 1)}
    </span>
  );
}

/**
 * (i) 정보 버튼 — 꼭 필요한 설명만 여기에 넣습니다.
 * 데스크톱은 마우스를 올리면, 모바일은 탭하면 열립니다. 바깥 클릭·Esc로 닫힘.
 */
export function InfoTip({ children, label = '설명 보기', align = 'center', className }: { children: ReactNode; label?: string; align?: 'start' | 'center' | 'end'; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || tipRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 말풍선은 body에 portal로 그려서 overflow:hidden 카드 안에서도 잘리지 않게 하고,
  // 버튼 위치 기준으로 좌우는 화면 안쪽(여백 8px)에 맞추고, 아래 공간이 부족하면 위로 띄움
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const btn = ref.current?.getBoundingClientRect();
      const tip = tipRef.current?.getBoundingClientRect();
      if (!btn) return;
      const w = tip?.width ?? 0;
      const h = tip?.height ?? 0;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const pad = 8;
      let left = align === 'start' ? btn.left : align === 'end' ? btn.right - w : btn.left + btn.width / 2 - w / 2;
      left = Math.min(Math.max(left, pad), vw - pad - w);
      let top = btn.bottom + 4;
      if (top + h > vh - pad && btn.top - 4 - h > pad) top = btn.top - 4 - h;
      setPos({ top, left });
    };
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, align]);

  return (
    <span
      ref={ref}
      className={cx('relative inline-flex align-middle', className)}
      onMouseEnter={() => window.matchMedia('(hover: hover)').matches && setOpen(true)}
      onMouseLeave={() => window.matchMedia('(hover: hover)').matches && setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className="grid size-6 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
      >
        <Icon name="info" size={16} />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            ref={tipRef}
            id={id}
            role="tooltip"
            className="fixed z-[60] w-max max-w-[min(280px,calc(100vw-16px))] rounded-m3-sm bg-inverse-surface px-3 py-2 text-left body-small font-normal normal-case tracking-normal text-inverse-on-surface shadow-[0_4px_16px_rgba(32,33,36,.12)]"
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  );
}
