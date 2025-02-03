'use client';

import Script from 'next/script'

export default function GoogleAnalytics() {
  const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost');

if (isLocalhost) {
  return null;
}
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-HJH1CJ84WG"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-HJH1CJ84WG');
        `}
      </Script>
    </>
  )
}