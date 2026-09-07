import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = 'cloudflare-turnstile-script';

export function Turnstile({ action, resetKey, onToken }: { action: 'submit' | 'report'; resetKey: number; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !container.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        action,
        theme: 'light',
        size: 'flexible',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', mount, { once: true });
      document.head.appendChild(script);
    } else if (window.turnstile) mount();
    else script.addEventListener('load', mount, { once: true });
    return () => {
      cancelled = true;
      script?.removeEventListener('load', mount);
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = undefined;
    };
  }, [action, siteKey, onToken]);

  useEffect(() => {
    onToken('');
    if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
  }, [resetKey, onToken]);

  if (!siteKey) return <p className="captcha-missing" role="alert">ระบบยืนยันการส่งยังไม่พร้อม</p>;
  return <div className="turnstile"><div ref={container} /><p>ขั้นตอนนี้ช่วยป้องกันข้อความอัตโนมัติ</p></div>;
}
