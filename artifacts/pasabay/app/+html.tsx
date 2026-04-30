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
            background: #1a1a1a;
            height: 100%;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          #phone-frame {
            width: 100%;
            max-width: 420px;
            min-height: 100vh;
            background: #ffffff;
            border-radius: 44px;
            box-shadow: 0 8px 48px rgba(0,0,0,0.35);
            overflow: hidden;
            position: relative;
          }
          @media (max-width: 420px) {
            #phone-frame {
              border-radius: 0;
              box-shadow: none;
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
        <div id="phone-frame">{children}</div>
      </body>
    </html>
  );
}
