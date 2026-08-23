import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DropZoneProps {
  label: string;
  hint?: string | undefined;
  accept?: string | undefined;
  multiple?: boolean | undefined;
  onFiles: (files: File[]) => void;
  /** Names what was taken, so the control confirms it did what it said. */
  status?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/**
 * A real file input carries the picker and the keyboard behaviour; the drop zone is a label over
 * it. That means Enter and Space open the picker for free, and drag and drop is an addition rather
 * than the only way in.
 */
export function DropZone({
  label,
  hint,
  accept,
  multiple = false,
  onFiles,
  status,
  disabled = false,
  className,
}: DropZoneProps): ReactNode {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (list: FileList | null): void => {
    if (!list || list.length === 0) return;
    onFiles([...list]);
  };

  return (
    <div className={cn('fg-drop-wrap', className)}>
      <div
        className={cn('fg-drop', over && 'fg-drop--over', disabled && 'fg-drop--disabled')}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => {
          setOver(false);
        }}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
      >
        <input
          ref={input}
          id={id}
          type="file"
          className="fg-drop__input fg-visually-hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={hint !== undefined ? `${id}-hint` : undefined}
          onChange={(e) => {
            take(e.currentTarget.files);
            e.currentTarget.value = '';
          }}
        />
        <label className="fg-drop__label" htmlFor={id}>
          {label}
        </label>
        {hint !== undefined && (
          <p className="fg-drop__hint" id={`${id}-hint`}>
            {hint}
          </p>
        )}
      </div>
      <p className="fg-drop__status" role="status">
        {status ?? ''}
      </p>
    </div>
  );
}
