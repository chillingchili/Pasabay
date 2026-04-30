import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0D9E75" />
        <meta
          name="description"
          content="USC Campus Rideshare — share rides, split costs"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pasabay" />
        <link rel="manifest" href="/manifest.json" />
        <style>{`
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
          }
          html {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            background: #f5f5f5;
          }
          body {
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          body > div:first-of-type {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          @media (min-width: 480px) {
            body {
              position: relative;
              width: 360px;
              margin: 24px 0;
              border-radius: 44px;
              transform: translateZ(0);
              overflow: hidden;
              box-shadow:
                inset 0 0 0 6px #1f1f1f,
                0 16px 48px rgba(0,0,0,0.15);
            }
          }
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
