import { Clock, LogOut } from 'lucide-react';

interface Props {
  secondsRemaining: number;
  onStay: () => void;
  onLogout: () => void;
}

const formatCountdown = (totalSeconds: number): string => {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const SessionTimeoutModal = ({ secondsRemaining, onStay, onLogout }: Props) => {
  const urgent = secondsRemaining <= 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[440px] p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-[#fef3c7] flex items-center justify-center mb-4">
          <Clock size={28} className="text-[#b45309]" />
        </div>

        <h3 className="text-[18px] font-bold text-[#0b1c30] mb-1">Still working?</h3>
        <p className="text-[14px] text-[#64748b] mb-6 max-w-[340px]">
          You&apos;ve been inactive for a while. To keep your session secure you&apos;ll be
          signed out automatically.
        </p>

        <div
          className={`text-[32px] font-bold tabular-nums mb-6 ${
            urgent ? 'text-[#dc2626]' : 'text-[#004ac6]'
          }`}
          role="timer"
          aria-live="polite"
        >
          {formatCountdown(secondsRemaining)}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onStay}
            className="flex-1 px-6 py-2.5 rounded-lg bg-[#004ac6] text-white text-[14px] font-semibold hover:bg-[#003da6] transition-colors"
          >
            Stay signed in
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-6 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-[#0b1c30] text-[14px] font-semibold hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
