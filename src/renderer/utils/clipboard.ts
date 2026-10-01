import { api } from './apiBridge';

/**
 * Copies text to the system clipboard using the best available method:
 * 1. Native Electron IPC (highest priority, direct OS clipboard access, bypasses browser sandbox)
 * 2. Navigator Clipboard API (standard browser clipboard API)
 * 3. Fallback textarea + document.execCommand('copy')
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. First priority: Native Electron API
  try {
    if (api?.copyToClipboard) {
      const res = await api.copyToClipboard(text);
      if (res) return true;
    }
  } catch (err) {
    console.warn('Native Electron clipboard copy failed, trying web fallback:', err);
  }

  // 2. Second priority: Modern Web Navigator Clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard writeText failed, trying execCommand fallback:', err);
  }

  // 3. Third priority: Hidden textarea fallback with execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return !!successful;
  } catch (err) {
    console.error('All copy fallbacks failed:', err);
    return false;
  }
}
