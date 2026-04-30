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
          #app-root {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          @media (min-width: 480px) {
            body {
              width: 360px;
              margin: 24px 0;
            }
            #app-root {
              position: relative;
              border-radius: 44px;
              box-shadow: 0 16px 48px rgba(0,0,0,0.15);
              transform: translateZ(0);
              overflow: hidden;
            }
            #app-root::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              border: 6px solid #1f1f1f;
              border-radius: 44px;
              pointer-events: none;
              z-index: 99999;
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
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
