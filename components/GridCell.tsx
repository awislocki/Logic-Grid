import React from 'react';
import { CellState } from '../types';
import { X, Check } from 'lucide-react';

interface GridCellProps {
  state: CellState;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  highlight?: boolean;
  className?: string; 
}

export const GridCell: React.FC<GridCellProps> = ({ state, onClick, onRightClick, disabled, highlight, className }) => {
  const isTrue = state === CellState.TRUE;
  const isFalse = state === CellState.FALSE;
  const isAutoFalse = state === CellState.FALSE_AUTO;
  const isAnyFalse = isFalse || isAutoFalse;

  // Comparison States
  const isCorrect = state === CellState.TRUE_CORRECT;
  const isIncorrect = state === CellState.TRUE_INCORRECT;
  const isMissed = state === CellState.MISSED;

  // Render Bead
  const renderBead = () => {
    let bgStyle = { };
    let shadowClass = "shadow-[2px_3px_5px_rgba(0,0,0,0.3)]";
    
    if (isTrue || isCorrect) {
      bgStyle = { background: 'var(--puz-accent)' };
    } else if (isIncorrect) {
      bgStyle = { background: '#e63946' }; 
    } else if (isMissed) {
      bgStyle = { background: 'var(--puz-primary)' };
    } else {
      return null;
    }

    return (
      <div className={`
        absolute inset-2 rounded-full 
        flex items-center justify-center 
        transition-all duration-300 ease-out scale-100 opacity-100 translate-y-0
        ${shadowClass}
      `} style={bgStyle}>
         <div className="absolute top-1 left-1.5 w-2 h-1.5 bg-white/40 rounded-full blur-[1px]"></div>
         <div className="absolute bottom-1 right-2 w-1.5 h-1.5 bg-black/10 rounded-full blur-[1px]"></div>
         
         {isCorrect && <Check className="w-5 h-5 text-white/90 drop-shadow-md" strokeWidth={3} />}
         {isIncorrect && <X className="w-5 h-5 text-white/90 drop-shadow-md" strokeWidth={3} />}
         {isMissed && <span className="text-white/90 font-bold text-xs drop-shadow-md">?</span>}
      </div>
    );
  };

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onContextMenu={!disabled ? onRightClick : undefined}
      className={`
        relative rounded-md transition-all duration-150
        flex items-center justify-center cursor-pointer select-none
        ${className || "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"}
        ${disabled ? 'cursor-default' : 'hover:brightness-95 active:scale-[0.98]'}
        ${highlight ? 'ring-2 ring-offset-1 z-10' : ''}
        shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-1px_-1px_2px_rgba(255,255,255,0.4)]
      `}
      style={{
        backgroundColor: 'var(--puz-surface)',
        borderColor: 'var(--puz-border)',
        borderWidth: '1px',
        color: 'var(--puz-text)'
      }}
    >
      {(isTrue || isCorrect || isIncorrect || isMissed) && renderBead()}

      <div className={`
        absolute inset-0 flex items-center justify-center transition-all duration-200 pointer-events-none
        ${isAnyFalse ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
      `}>
        <X 
          className={`w-3/4 h-3/4 transition-colors duration-200`} 
          style={{ 
            color: isAutoFalse ? 'var(--puz-border)' : 'var(--puz-primary)',
            filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.5))' 
          }}
          strokeWidth={isAutoFalse ? 2 : 3}
        />
      </div>
      
    </div>
  );
};