import { useEffect, useId, useRef, useState, type ClipboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@/ui';

// Keep editable text bounded; a complete backup remains available to the decoder.
const MAX_INLINE_IMPORT_LENGTH = 32_768;
interface PreparedBackup {
  readonly name: string;
  readonly text: string;
}
interface SaveImportDialogProps {
  readonly isOpen: boolean;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onImport: (text: string) => Promise<void>;
}

/** Prepare exact backup text without laying out a large JSON document in the UI. */
export function SaveImportDialog({ isOpen, busy, onClose, onImport }: SaveImportDialogProps) {
  const { t } = useTranslation(['settings', 'common']);
  const id = useId();
  const [text, setText] = useState('');
  const [prepared, setPrepared] = useState<PreparedBackup | null>(null);
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState(false);
  const readInProgress = useRef(false);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const working = busy || reading;
  useEffect(() => {
    if (!isOpen) {
      setText('');
      setPrepared(null);
      setFailed(false);
    }
  }, [isOpen]);
  useEffect(() => {
    // Disabling the submit button can blur it; return focus to visible feedback.
    if (failed) errorMessage.current?.focus();
  }, [failed]);

  const acceptText = (value: string): void => {
    setFailed(false);
    if (value.length > MAX_INLINE_IMPORT_LENGTH) {
      setPrepared({ name: t('importClipboard'), text: value });
      setText('');
    } else {
      setPrepared(null);
      setText(value);
    }
  };
  const paste = (event: ClipboardEvent<HTMLTextAreaElement>): void => {
    if (working) {
      event.preventDefault();
      return;
    }
    const input = event.currentTarget;
    const inserted =
      input.value.slice(0, input.selectionStart) +
      event.clipboardData.getData('text/plain') +
      input.value.slice(input.selectionEnd);
    if (inserted.length > MAX_INLINE_IMPORT_LENGTH) {
      // Cancel native insertion before the browser lays out thousands of JSON lines.
      event.preventDefault();
      acceptText(inserted);
    }
  };
  const readFile = async (file: File): Promise<void> => {
    if (busy || readInProgress.current) return;
    readInProgress.current = true;
    setReading(true);
    setFailed(false);
    setText('');
    setPrepared(null);
    try {
      setPrepared({ name: file.name, text: await file.text() });
    } catch {
      setFailed(true);
    } finally {
      readInProgress.current = false;
      setReading(false);
    }
  };
  const close = (): void => {
    if (!working) onClose();
  };
  const submit = async (): Promise<void> => {
    if (working) return;
    setFailed(false);
    try {
      await onImport(prepared?.text ?? text);
    } catch {
      setFailed(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={t('importSave')}>
      <div className="flex min-h-0 flex-1 flex-col gap-2" aria-busy={working}>
        <p id={`${id}-help`} className="text-sm text-d2-white/80">
          {t('importSourceHelp')}
        </p>
        <label htmlFor={id} className="block text-sm text-d2-white">
          {t('importFile')}
        </label>
        <input
          id={id}
          type="file"
          accept=".json,application/json"
          disabled={working}
          data-testid="import-save-file"
          aria-describedby={`${id}-help`}
          className="d2-field block min-h-[44px] w-full min-w-0 text-sm text-d2-white file:mr-2 file:min-h-[44px]
                     file:rounded file:border file:border-d2-border file:bg-d2-panel file:px-3 file:text-d2-gold
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-d2-gold"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) void readFile(file);
          }}
        />
        {reading && (
          <p role="status" className="text-sm text-d2-white">
            {t('importReading')}
          </p>
        )}
        {failed && (
          <p ref={errorMessage} role="alert" tabIndex={-1} className="text-sm text-d2-white">
            {t('importFailed')}
          </p>
        )}
        {prepared ? (
          <div className="d2-surface space-y-2 rounded border border-d2-border bg-d2-bg p-3">
            <p role="status" className="break-all text-sm text-d2-white">
              {t('importPrepared')} <span>{prepared.name}</span>
            </p>
            <Button
              variant="secondary"
              className="min-h-[44px]"
              disabled={working}
              onClick={() => {
                setPrepared(null);
                setText('');
                setFailed(false);
              }}
            >
              {t('importClear')}
            </Button>
          </div>
        ) : (
          <textarea
            value={text}
            disabled={working}
            onPaste={paste}
            onChange={(event) => {
              acceptText(event.target.value);
            }}
            rows={3}
            placeholder={t('importPlaceholder')}
            aria-label={t('importSave')}
            className="d2-field min-h-12 flex-1 resize-none w-full bg-d2-bg border border-d2-border rounded p-2 text-xs font-mono
                       focus:outline-none focus:border-d2-gold"
          />
        )}
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            className="flex-1 min-h-[44px]"
            disabled={working}
            onClick={close}
          >
            {t('common:cancel')}
          </Button>
          <Button
            variant="primary"
            className="flex-1 min-h-[44px]"
            disabled={working || !(prepared?.text ?? text).trim()}
            onClick={() => {
              void submit();
            }}
          >
            {t('importSave')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
