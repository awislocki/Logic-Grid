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
  <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-full border border-amber-200/50 shadow-sm ml-1.5">
    <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 shadow-inner flex items-center justify-center">
      <span className="text-[8px] font-bold text-amber-900">$</span>
    </div>
    <span className="font-bold">{amount}</span>
  </span>
);

export const GameControls: React.FC<GameControlsProps> = ({ 
  onNewGame, onCheck, onHint, loading, theme, setTheme, tokens, gameOver, revealedClues, totalClues
}) => {
  const canHint = tokens >= 1 && revealedClues < totalClues;

  return (
    <div className="bg-[#f4f1ea] rounded-sm shadow-[6px_6px_0_rgba(0,0,0,0.1)] border border-[#d4c5b0] p-5 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative z-20">
      
      {/* Input Section */}
      <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Wand2 className="h-5 w-5 text-[#8d99ae] group-focus-within:text-[#2b2d42] transition-colors" />
          </div>
          <input 
            type="text" 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Theme (e.g., 'Noir Detective')"
            className="
              block w-full pl-10 pr-4 py-3 
              bg-[#fffdf9] border-2 border-[#d4c5b0] rounded-sm
              text-[#2b2d42] placeholder-[#8d99ae] font-serif
              focus:outline-none focus:border-[#2b2d42] focus:ring-0
              transition-all duration-200
            "
          />
        </div>
        <button 
          onClick={onNewGame}
          disabled={loading}
          className="
            flex items-center gap-2 bg-[#2b2d42] hover:bg-[#1a1b26] disabled:bg-[#8d99ae]
            text-[#edf2f4] px-6 py-3 rounded-sm font-bold tracking-wide transition-all 
            shadow-[3px_3px_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_#000]
            whitespace-nowrap font-sans
          "
        >
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          NEW CASE
        </button>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-4 w-full lg:w-auto justify-end border-t border-[#d4c5b0] lg:border-t-0 pt-4 lg:pt-0">
        
        {/* Token Wallet */}
        <div className="flex items-center gap-3 bg-[#e0d6c5] border border-[#d4c5b0] px-4 py-2 rounded-sm mr-2 shadow-inner">
           <div className="bg-amber-400 w-8 h-8 rounded-full border-2 border-amber-600 shadow-sm flex items-center justify-center relative">
             <div className="absolute inset-1 border border-amber-200 rounded-full opacity-50"></div>
             <Coins className="w-4 h-4 text-amber-900 fill-amber-900" />
           </div>
           <div className="flex flex-col leading-none">
             <span className="text-[10px] text-[#5e6472] font-bold uppercase tracking-wider">Budget</span>
             <span className="text-xl font-black text-[#2b2d42] font-mono">{tokens}</span>
           </div>
        </div>

        <button 
          onClick={onHint}
          disabled={loading || gameOver || !canHint}
          className="
            flex-1 lg:flex-none flex items-center justify-center gap-2 
            bg-[#fffdf9] hover:bg-[#fff] disabled:bg-[#f4f1ea] disabled:opacity-60
            text-[#2b2d42] border-2 border-[#d4c5b0]
            px-5 py-2.5 rounded-sm font-bold transition-all 
            shadow-[3px_3px_0_#d4c5b0] active:translate-y-[2px] active:shadow-[1px_1px_0_#d4c5b0]
            font-sans
          "
        >
          <Lightbulb className="w-4 h-4" />
          HINT <TokenCost amount={1} />
        </button>

        <button 
          onClick={onCheck}
          disabled={loading || gameOver || tokens < 1}
          className="
            flex-1 lg:flex-none flex items-center justify-center gap-2 
            bg-[#4a7c59] hover:bg-[#3a6346] disabled:bg-[#8d99ae] disabled:cursor-not-allowed
            text-white border-2 border-[#2d4a3e]
            px-5 py-2.5 rounded-sm font-bold transition-all 
            shadow-[3px_3px_0_#2d4a3e] active:translate-y-[2px] active:shadow-[1px_1px_0_#2d4a3e]
            font-sans
          "
        >
          <CheckCircle2 className="w-4 h-4" />
          VERIFY <TokenCost amount={1} />
        </button>
      </div>
    </div>
  );
};