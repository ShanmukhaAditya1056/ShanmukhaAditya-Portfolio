import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { u } from '../lib/u.js';

async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for non-secure contexts (e.g. LAN IP during development).
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(el);
  if (!ok) throw new Error('Copy failed');
}

export default function CopyButton({ value, label, scaled = false }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const onCopy = async () => {
    try {
      await writeClipboard(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Could not copy — please copy it manually.');
    }
  };

  const size = scaled ? { width: u(36), height: u(36) } : { width: 36, height: 36 };
  const icon = scaled ? { width: u(16), height: u(16) } : { width: 16, height: 16 };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className="grid shrink-0 place-items-center rounded-full border border-white/35 text-white transition hover:border-cream hover:text-cream"
      style={size}
    >
      {copied ? <Check style={icon} aria-hidden="true" /> : <Copy style={icon} aria-hidden="true" />}
    </button>
  );
}
