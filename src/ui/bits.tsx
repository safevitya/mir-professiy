import { useDraggable, useDroppable, type UniqueIdentifier } from '@dnd-kit/core';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { playSfx, type SfxKind } from '../sfx';
import { useStore } from '../store';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function useSfx(): (kind: SfxKind) => void {
  const { settings } = useStore();
  return (kind) => {
    if (settings.muted || settings.sfxVolume <= 0) return;
    playSfx(kind, settings.sfxVolume);
  };
}

export function Button({
  tone = 'default',
  icon,
  children,
  className,
  sound = true,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'default' | 'primary' | 'quiet' | 'ghost';
  icon?: ReactNode;
  sound?: boolean;
}) {
  const sfx = useSfx();
  return (
    <button
      type="button"
      className={cx('btn', `btn-${tone}`, className)}
      {...props}
      onClick={(event) => {
        if (sound && !props.disabled) sfx('click');
        props.onClick?.(event);
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconSpeaker() {
  return (
    <svg viewBox="0 0 24 24" className="ico" aria-hidden>
      <path d="M4 9 H8 L14 5 V19 L8 15 H4 Z" fill="currentColor" />
      <path d="M16 9 C18 10 18 14 16 15" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function IconBack() {
  return (
    <svg viewBox="0 0 24 24" className="ico" aria-hidden>
      <path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${count} из ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <svg key={index} viewBox="0 0 24 24" className={cx('star', index < count && 'star-on')} aria-hidden>
          <path d="M12 3 L14.6 9.2 L21 10 L16.2 14.4 L17.6 21 L12 17.6 L6.4 21 L7.8 14.4 L3 10 L9.4 9.2 Z" />
        </svg>
      ))}
    </span>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="modal-back" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function DragItem({
  id,
  label,
  className,
  selected,
  onSelect,
  children,
  disabled,
}: {
  id: string;
  label: string;
  className?: string;
  selected?: boolean;
  onSelect?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
    data: { label },
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      className={cx('drag-item', className, selected && 'selected', isDragging && 'dragging')}
      onClick={onSelect}
      aria-pressed={selected}
      disabled={disabled}
      {...listeners}
      {...attributes}
    >
      {children}
    </button>
  );
}

export function DropZone({
  id,
  className,
  label,
  onPress,
  children,
}: {
  id: string;
  className?: string;
  label?: string;
  onPress?: () => void;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cx('drop-zone', className, isOver && 'over')}
      onClick={onPress}
      onKeyDown={(event) => {
        if (!onPress) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPress();
        }
      }}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function dragLabel(id: UniqueIdentifier | undefined, fallback = ''): string {
  return String(id ?? fallback);
}
