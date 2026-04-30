import { useEffect, useRef } from 'react';

interface DemoAuthMessage {
  type: 'demo:auth';
  token: string;
  role: 'driver' | 'passenger';
  userData: { id: string; name: string; email: string; role: string };
}

interface DemoStageMessage {
  type: 'demo:stage';
  stage: number;   // 1-8
  role: 'driver' | 'passenger';
  data?: Record<string, unknown>;
}

interface DemoResetMessage {
  type: 'demo:reset';
}

type DemoMessage = DemoAuthMessage | DemoStageMessage | DemoResetMessage;

interface UseDemoListenerCallbacks {
  onAuth: (token: string, role: 'driver' | 'passenger', userData: DemoAuthMessage['userData']) => void;
  onStage: (stage: number, role: 'driver' | 'passenger', data?: Record<string, unknown>) => void;
  onReset: () => void;
}

export function useDemoListener({ onAuth, onStage, onReset }: UseDemoListenerCallbacks) {
  const roleRef = useRef<'driver' | 'passenger' | ''>('');

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Security: In production, validate event.origin. For hackathon demo, accept all.
      const data = event.data as DemoMessage;
      if (!data || typeof data.type !== 'string' || !data.type.startsWith('demo:')) return;

      switch (data.type) {
        case 'demo:auth': {
          roleRef.current = data.role;
          onAuth(data.token, data.role, data.userData);
          // Notify parent that this iframe is ready
          window.parent.postMessage({ type: 'demo:ready', role: data.role }, '*');
          break;
        }
        case 'demo:stage': {
          // Only respond to stages meant for this iframe's role
          if (data.role === roleRef.current) {
            onStage(data.stage, data.role, data.data);
          }
          break;
        }
        case 'demo:reset': {
          roleRef.current = '';
          onReset();
          break;
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onAuth, onStage, onReset]);
}
