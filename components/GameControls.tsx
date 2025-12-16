import React from 'react';
import { RefreshCw, Wand2, Lightbulb, CheckCircle2, Coins } from 'lucide-react';

interface GameControlsProps {
  onNewGame: () => void;
  onCheck: () => void;
  onHint: () => void;
  loading: boolean;
  theme: string;
  setTheme: (t: string) => void;
  tokens: number;
  gameOver: boolean;
  revealedClues: number;
  totalClues: number;
}

const TokenCost = ({ amount }: { amount: number }) => (
  <span className="flex items-center gap-1 bg-white/20 text-current text-xs px-1.5 py-0.5 rounded-full border border-current/20 shadow-sm ml-1.5">
    <div className="w-3 h-3 rounded-full border border-current shadow-inner flex items-center justify-center bg-yellow-400 text-yellow-900">
      <span className="text-[8px] font-bold">$</span>
    </div>
    <span className="font-bold">{amount}</span>
  </span>
);

export const GameControls: React.FC<GameControlsProps> = ({ 
  onNewGame, onCheck, onHint, loading, theme, setTheme, tokens, gameOver, revealedClues, totalClues
}) => {
  const canHint = tokens >= 1 && revealedClues < totalClues;

  return (
    <div 
      className="rounded-sm shadow-[6px_6px_0_rgba(0,0,0,0.1)] border p-5 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative z-20 transition-colors duration-500"
      style={{
        backgroundColor: 'var(--puz-surface)',
        borderColor: 'var(--puz-border)',
      }}
    >
      
      {/* Input Section */}
      <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Wand2 className="h-5 w-5 opacity-50 transition-colors" style={{ color: 'var(--puz-text)' }} />
          </div>
          <input 
            type="text" 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Theme (e.g., 'Noir', 'Sci-Fi', 'Fantasy')"
            className="block w-full pl-10 pr-4 py-3 border-2 rounded-sm focus:outline-none focus:ring-0 transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
              borderColor: 'var(--puz-border)',
              color: 'var(--puz-text)',
            }}
          />
        </div>
        <button 
          onClick={onNewGame}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-sm font-bold tracking-wide transition-all shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[1px_1px_0_rgba(0,0,0,0.2)] whitespace-nowrap"
          style={{
            backgroundColor: 'var(--puz-primary)',
            color: 'var(--puz-surface)',
          }}
        >
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          NEW CASE
        </button>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-4 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0" style={{ borderColor: 'var(--puz-border)' }}>
        
        {/* Token Wallet */}
        <div className="flex items-center gap-3 border px-4 py-2 rounded-sm mr-2 shadow-inner" 
             style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'var(--puz-border)' }}>
           <div className="w-8 h-8 rounded-full border-2 border-yellow-600 shadow-sm flex items-center justify-center relative bg-yellow-400">
             <Coins className="w-4 h-4 text-yellow-900 fill-yellow-900" />
           </div>
           <div className="flex flex-col leading-none">
             <span className="text-[10px] font-bold uppercase tracking-wider opacity-70" style={{ color: 'var(--puz-text)' }}>Budget</span>
             <span className="text-xl font-black font-mono" style={{ color: 'var(--puz-primary)' }}>{tokens}</span>
           </div>
        </div>

        <button 
          onClick={onHint}
          disabled={loading || gameOver || !canHint}
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 border-2 px-5 py-2.5 rounded-sm font-bold transition-all shadow-[3px_3px_0_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-[1px_1px_0_rgba(0,0,0,0.1)] disabled:opacity-50"
          style={{
             backgroundColor: 'var(--puz-surface)',
             color: 'var(--puz-text)',
             borderColor: 'var(--puz-border)'
          }}
        >
          <Lightbulb className="w-4 h-4" />
          HINT <TokenCost amount={1} />
        </button>

        <button 
          onClick={onCheck}
          disabled={loading || gameOver || tokens < 1}
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 border-2 px-5 py-2.5 rounded-sm font-bold transition-all shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[1px_1px_0_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
             backgroundColor: 'var(--puz-accent)',
             borderColor: 'var(--puz-accent)',
             color: '#fff'
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          VERIFY <TokenCost amount={1} />
        </button>
      </div>
    </div>
  );
};