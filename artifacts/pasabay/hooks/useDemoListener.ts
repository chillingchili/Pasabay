import { useCallback, useEffect, useRef } from 'react';

type Role = 'driver' | 'passenger';

interface DemoAuthMessage {
  type: 'demo:auth';
  token: string;
  role: Role;
  userData: { id: string; name: string; email: string; role: string };
}

interface DemoStageMessage {
  type: 'demo:stage';
  stage: number;   // 1-8
  role: Role;
  data?: Record<string, unknown>;
}

interface DemoResetMessage {
  type: 'demo:reset';
}

type DemoMessage = DemoAuthMessage | DemoStageMessage | DemoResetMessage;

interface UseDemoListenerCallbacks {
  onAuth: (token: string, role: Role, userData: DemoAuthMessage['userData']) => void;
  onStage: (stage: number, role: Role, data?: Record<string, unknown>) => void;
  onReset: () => void;
}

export function useDemoListener(cbs: UseDemoListenerCallbacks) {
  const roleRef = useRef<Role | ''>('');
  const cbsRef = useRef(cbs);
  cbsRef.current = cbs;

  const stableOnReset = useCallback(() => {
    roleRef.current = '';
    cbsRef.current.onReset();
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data as DemoMessage;
      if (!data || typeof data.type !== 'string' || !data.type.startsWith('demo:')) return;

      switch (data.type) {
        case 'demo:auth': {
          roleRef.current = data.role;
          cbsRef.current.onAuth(data.token, data.role, data.userData);
          window.parent.postMessage({ type: 'demo:ready', role: data.role }, '*');
          break;
        }
        case 'demo:stage': {
          if (data.role === roleRef.current) {
            cbsRef.current.onStage(data.stage, data.role, data.data);
          }
          break;
        }
        case 'demo:reset': {
          stableOnReset();
          break;
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [stableOnReset]);
}
