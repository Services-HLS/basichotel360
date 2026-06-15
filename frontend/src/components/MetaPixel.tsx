// src/components/MetaPixel.tsx
import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq?: any;
  }
}

const MetaPixel = () => {
  useEffect(() => {
    // Check if already initialized
    if (window.fbq) {
      window.fbq('track', 'PageView');
      return;
    }

    // Initialize Facebook Pixel - Fixed TypeScript issue
    (function (f: Window, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', '1645971706568857');
    window.fbq('track', 'PageView');
  }, []);

  // Noscript fallback (will be rendered in body)
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src="https://www.facebook.com/tr?id=1645971706568857&ev=PageView&noscript=1"
        alt=""
      />
    </noscript>
  );
};

export default MetaPixel;