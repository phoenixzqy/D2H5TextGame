import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { importIntoStores, useMetaStore, usePlayerStore } from '@/stores';
import { SettingsScreen } from './SettingsScreen';

// Exercise the real screen/dialog; persistence has independent native atomicity coverage.
vi.mock('@/stores', async original => ({
  ...await original<typeof import('@/stores')>(), importIntoStores: vi.fn()
}));
const nativeImport = vi.mocked(importIntoStores);

function fileWithText(read: () => Promise<string>): File {
  const file = new File([], 'earned-backup.json', { type: 'application/json' });
  // jsdom's File lacks Blob.text; only the browser file-read transport is stubbed.
  Object.defineProperty(file, 'text', { value: read });
  return file;
}

function mountImport(label: string, withExportNotice = false) {
  render(<I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <SettingsScreen />
  </MemoryRouter></I18nextProvider>);
  if (withExportNotice) {
    fireEvent.click(screen.getByTestId('export-save-button'));
    expect(screen.getByRole('status')).toBeVisible();
  }
  fireEvent.click(screen.getByRole('button', { name: label }));
  return within(screen.getByRole('dialog'));
}

describe.each(['en', 'zh-CN'] as const)('save import input %s', locale => {
  const english = locale === 'en';
  const importLabel = english ? 'Import Save' : '导入存档';
  const fileLabel = english ? 'Choose backup file' : '选择备份文件';
  const clearLabel = english ? 'Use another backup' : '更换备份';
  beforeEach(async () => {
    nativeImport.mockReset().mockResolvedValue(undefined);
    useMetaStore.getState().reset(); usePlayerStore.getState().reset();
    useMetaStore.getState().setLocale(locale);
    await i18n.changeLanguage(locale);
  });

  it('keeps a previous export notice from covering the import dialog', () => {
    mountImport(importLabel, true);
    expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
  });

  it('keeps ordinary pasted/edited text and imports only after confirmation', async () => {
    const dialog = mountImport(importLabel);
    fireEvent.change(dialog.getByRole('textbox'), { target: { value: '{"version":32}' } });
    expect(nativeImport).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await screen.findByText(english ? 'Save imported' : '导入成功');
    expect(nativeImport).toHaveBeenCalledTimes(1);
    expect(nativeImport).toHaveBeenLastCalledWith('{"version":32}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('captures a large paste before DOM insertion, preserving exact selection replacement', async () => {
    const dialog = mountImport(importLabel);
    const textbox = dialog.getByRole<HTMLTextAreaElement>('textbox');
    const prefix = '{"inventory":', suffix = '}';
    fireEvent.change(textbox, { target: { value: prefix + 'old' + suffix } });
    textbox.setSelectionRange(prefix.length, prefix.length + 3);
    const clipboard = '"' + 'x'.repeat(65536) + '"';
    const defaultAllowed = fireEvent.paste(textbox, { clipboardData: { getData: () => clipboard } });
    expect(defaultAllowed).toBe(false);
    expect(dialog.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog').textContent.length).toBeLessThan(2000);
    expect(nativeImport).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await screen.findByText(english ? 'Save imported' : '导入成功');
    expect(nativeImport).toHaveBeenCalledTimes(1);
    expect(nativeImport).toHaveBeenLastCalledWith(prefix + clipboard + suffix);
  });

  it('reads the selected backup without rendering its JSON or importing early', async () => {
    const dialog = mountImport(importLabel), text = '{"items":"' + 'x'.repeat(65536) + '"}';
    fireEvent.change(dialog.getByLabelText(fileLabel), { target: { files: [fileWithText(() => Promise.resolve(text))] } });
    await dialog.findByText('earned-backup.json');
    expect(dialog.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog').textContent.length).toBeLessThan(2000);
    expect(nativeImport).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await screen.findByText(english ? 'Save imported' : '导入成功');
    expect(nativeImport).toHaveBeenCalledTimes(1);
    expect(nativeImport).toHaveBeenLastCalledWith(text);
  });

  it('shows a failed file read without calling import, then accepts the same file again', async () => {
    const dialog = mountImport(importLabel), read = vi.fn<[], Promise<string>>()
      .mockRejectedValueOnce(new Error('Read failed')).mockResolvedValueOnce('{"recovered":true}');
    const file = fileWithText(read), input = dialog.getByLabelText(fileLabel);
    fireEvent.change(input, { target: { files: [file] } });
    await dialog.findByRole('alert');
    expect(nativeImport).not.toHaveBeenCalled();
    expect(dialog.getByRole('button', { name: importLabel })).toBeDisabled();
    fireEvent.change(input, { target: { files: [file] } });
    await dialog.findByText('earned-backup.json');
    expect(dialog.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await screen.findByText(english ? 'Save imported' : '导入成功');
    expect(nativeImport).toHaveBeenCalledTimes(1);
    expect(nativeImport).toHaveBeenLastCalledWith('{"recovered":true}');
  });

  it('disables source/confirm/cancel while a file read is pending', async () => {
    const dialog = mountImport(importLabel);
    let finish!: (value: string) => void;
    const pending = new Promise<string>(resolve => { finish = resolve; });
    fireEvent.change(dialog.getByLabelText(fileLabel), { target: { files: [fileWithText(() => pending)] } });
    expect(dialog.getByLabelText(fileLabel)).toBeDisabled();
    expect(dialog.getByRole('button', { name: importLabel })).toBeDisabled();
    expect(dialog.getByRole('button', { name: english ? 'Cancel' : '取消' })).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => { finish('{"ready":true}'); await pending; });
    expect(dialog.getByRole('button', { name: importLabel })).toBeEnabled();
    expect(nativeImport).not.toHaveBeenCalled();
  });

  it('clears a prepared large backup without retaining a stale import target', () => {
    const dialog = mountImport(importLabel);
    fireEvent.paste(dialog.getByRole('textbox'), { clipboardData: { getData: () => 'x'.repeat(65536) } });
    fireEvent.click(dialog.getByRole('button', { name: clearLabel }));
    expect(dialog.getByRole('textbox')).toHaveValue('');
    expect(dialog.getByRole('button', { name: importLabel })).toBeDisabled();
    expect(nativeImport).not.toHaveBeenCalled();
  });

  it('retains the selected backup and visible error when native validation rejects it', async () => {
    nativeImport.mockRejectedValueOnce(new Error('Invalid save'));
    const dialog = mountImport(importLabel), text = 'invalid' + 'x'.repeat(65536);
    fireEvent.paste(dialog.getByRole('textbox'), { clipboardData: { getData: () => text } });
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    expect(await dialog.findByRole('alert')).toHaveTextContent(english
      ? 'Import failed. Current progress was kept. Check the backup format and available storage, then retry.'
      : '导入失败，当前进度已保留。请检查备份格式和可用存储空间后重试。');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(dialog.getByRole('alert')).toHaveFocus();
    expect(dialog.getByRole('button', { name: importLabel })).toBeEnabled();
    expect(nativeImport).toHaveBeenCalledTimes(1);
    expect(nativeImport).toHaveBeenLastCalledWith(text);
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await screen.findByText(english ? 'Save imported' : '导入成功');
    expect(nativeImport).toHaveBeenCalledTimes(2);
    expect(nativeImport).toHaveBeenLastCalledWith(text);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears failure feedback when replacing a backup or closing the dialog', async () => {
    nativeImport.mockRejectedValue(new Error('Invalid save'));
    const dialog = mountImport(importLabel);
    fireEvent.change(dialog.getByRole('textbox'), { target: { value: 'invalid' } });
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await dialog.findByRole('alert');
    expect(dialog.getByRole('textbox')).toHaveValue('invalid');
    fireEvent.change(dialog.getByRole('textbox'), { target: { value: 'replacement' } });
    expect(dialog.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await dialog.findByRole('alert');
    fireEvent.change(dialog.getByLabelText(fileLabel), {
      target: { files: [fileWithText(() => Promise.resolve('file replacement'))] }
    });
    await dialog.findByText('earned-backup.json');
    expect(dialog.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await dialog.findByRole('alert');
    fireEvent.click(dialog.getByRole('button', { name: clearLabel }));
    expect(dialog.queryByRole('alert')).not.toBeInTheDocument();
    expect(dialog.getByRole('textbox')).toHaveValue('');
    fireEvent.change(dialog.getByRole('textbox'), { target: { value: 'invalid again' } });
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await dialog.findByRole('alert');
    fireEvent.click(dialog.getByRole('button', { name: english ? 'Cancel' : '取消' }));
    fireEvent.click(screen.getByRole('button', { name: importLabel }));
    const reopened = within(screen.getByRole('dialog'));
    expect(reopened.queryByRole('alert')).not.toBeInTheDocument();
    expect(reopened.getByRole('textbox')).toHaveValue('');
    expect(reopened.getByRole('button', { name: importLabel })).toBeDisabled();
    expect(nativeImport.mock.calls.map(([text]) => text)).toEqual([
      'invalid', 'replacement', 'file replacement', 'invalid again'
    ]);
  });

  it('clears the previous error and disables controls until a retry settles', async () => {
    let finish!: () => void;
    const pending = new Promise<void>(resolve => { finish = resolve; });
    nativeImport.mockRejectedValueOnce(new Error('Storage unavailable'))
      .mockImplementationOnce(() => pending);
    const dialog = mountImport(importLabel), text = 'exact backup';
    fireEvent.change(dialog.getByRole('textbox'), { target: { value: text } });
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    await dialog.findByRole('alert');
    fireEvent.click(dialog.getByRole('button', { name: importLabel }));
    expect(dialog.queryByRole('alert')).not.toBeInTheDocument();
    expect(dialog.getByLabelText(fileLabel)).toBeDisabled();
    expect(dialog.getByRole('textbox')).toBeDisabled();
    expect(dialog.getByRole('button', { name: importLabel })).toBeDisabled();
    expect(dialog.getByRole('button', { name: english ? 'Cancel' : '取消' })).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => { finish(); await pending; });
    await screen.findByText(english ? 'Save imported' : '导入成功');
    expect(nativeImport.mock.calls.map(([submitted]) => submitted)).toEqual([text, text]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
