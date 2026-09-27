import { useCallback, useEffect, useRef, useState } from 'react';

export const IDLE_LIMIT_MS = 60 * 60 * 1000;
export const IDLE_WARNING_MS = 5 * 60 * 1000;

const TICK_MS = 1000;

// mousemove fires at pointer-report frequency; throttle to one write per
// second so a stationary-but-jittery mouse can't cause a render storm.
const ACTIVITY_THROTTLE_MS = 1000;

// A time throttle alone is not enough: a jittering trackpad or a mouse on an
// unsteady surface emits continuous movement events and would hold the session
// open forever. Pointer movement therefore only counts once it has travelled
// a real distance from where we last recorded it, which still registers
// deliberate dragging (the layout builder depends on it) but ignores noise.
const POINTER_DISTANCE_PX = 24;

// Only genuine user input counts as activity. Deliberately excludes API
// polling, WebSocket frames and the token-refresh path: background pollers
// run every few seconds and would otherwise make the idle timer unreachable.
const POINTER_EVENTS = ['mousemove', 'mousedown'] as const;
const DISCRETE_EVENTS = ['keydown', 'touchstart', 'wheel', 'scroll'] as const;

export interface UseIdleLogoutOptions {
  onIdle: () => void | Promise<void>;
  enabled?: boolean;
  idleLimitMs?: number;
  warningMs?: number;
}

export interface UseIdleLogoutResult {
  warningOpen: boolean;
  secondsUntilLogout: number;
  staySignedIn: () => void;
  logOutNow: () => void;
}

export const useIdleLogout = ({
  onIdle,
  enabled = true,
  idleLimitMs = IDLE_LIMIT_MS,
  warningMs = IDLE_WARNING_MS,
}: UseIdleLogoutOptions): UseIdleLogoutResult => {
  // Initialised to 0 and set for real in the effect below, which also runs
  // before the interval starts. Reading the clock during render is impure.
  const lastActivityRef = useRef<number>(0);
  const lastWriteRef = useRef<number>(0);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const warningOpenRef = useRef<boolean>(false);
  const firedRef = useRef<boolean>(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsUntilLogout, setSecondsUntilLogout] = useState<number>(
    Math.ceil(warningMs / 1000),
  );

  const closeWarning = useCallback(() => {
    warningOpenRef.current = false;
    setWarningOpen(false);
  }, []);

  // Keep the callback in a ref so the interval never needs re-binding and
  // can't fire a stale closure.
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const staySignedIn = useCallback(() => {
    lastActivityRef.current = Date.now();
    firedRef.current = false;
    closeWarning();
  }, [closeWarning]);

  const logOutNow = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    closeWarning();
    void onIdleRef.current();
  }, [closeWarning]);

  useEffect(() => {
    if (!enabled) return;

    // Re-arm from the moment tracking starts, so re-enabling after a logout
    // grants a fresh hour rather than resuming a stale countdown.
    lastActivityRef.current = Date.now();
    lastWriteRef.current = 0;
    lastPointerRef.current = null;
    firedRef.current = false;

    const subscriptions: [string, EventListener][] = [];

    const record = (now: number) => {
      lastWriteRef.current = now;
      lastActivityRef.current = now;
    };

    const handlePointer = (event: Event) => {
      if (warningOpenRef.current) return;

      const { clientX, clientY } = event as MouseEvent;
      const last = lastPointerRef.current;
      const moved =
        !last || Math.hypot(clientX - last.x, clientY - last.y) >= POINTER_DISTANCE_PX;

      if (!moved) return;
      lastPointerRef.current = { x: clientX, y: clientY };

      const now = Date.now();
      if (now - lastWriteRef.current < ACTIVITY_THROTTLE_MS) return;
      record(now);
    };

    // Key presses, taps, scrolling and wheel are deliberate by nature, so a
    // plain time throttle is enough for them.
    const handleDiscrete = () => {
      if (warningOpenRef.current) return;
      const now = Date.now();
      if (now - lastWriteRef.current < ACTIVITY_THROTTLE_MS) return;
      record(now);
    };

    POINTER_EVENTS.forEach((event) => {
      window.addEventListener(event, handlePointer, { passive: true });
      subscriptions.push([event, handlePointer]);
    });
    DISCRETE_EVENTS.forEach((event) => {
      window.addEventListener(event, handleDiscrete, { passive: true });
      subscriptions.push([event, handleDiscrete]);
    });

    const tick = () => {
      const remaining = idleLimitMs - (Date.now() - lastActivityRef.current);

      // Out of the warning window. This is also where a warning left over from
      // a previous enabled period gets retired.
      if (remaining > warningMs) {
        if (warningOpenRef.current) {
          warningOpenRef.current = false;
          setWarningOpen(false);
          setSecondsUntilLogout(Math.ceil(warningMs / 1000));
        }
        return;
      }

      if (remaining <= 0) {
        setSecondsUntilLogout(0);
        logOutNow();
        return;
      }

      if (!warningOpenRef.current) {
        warningOpenRef.current = true;
        setWarningOpen(true);
      }
      setSecondsUntilLogout(Math.ceil(remaining / 1000));
    };

    const interval = window.setInterval(tick, TICK_MS);

    return () => {
      window.clearInterval(interval);
      subscriptions.forEach(([event, handler]) =>
        window.removeEventListener(event, handler),
      );
    };
  }, [enabled, idleLimitMs, warningMs, logOutNow]);

  // Gate on `enabled` so a warning raised just before logout can't linger on
  // the login screen.
  return { warningOpen: enabled && warningOpen, secondsUntilLogout, staySignedIn, logOutNow };
};
