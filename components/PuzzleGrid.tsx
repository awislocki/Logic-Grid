import React from 'react';
import { Category, GridState, CellState } from '../types';
import { GridCell } from './GridCell';

interface PuzzleGridProps {
  categories: Category[];
  gridState: GridState;
  onCellClick: (catRow: number, itemRow: number, catCol: number, itemCol: number, isRightClick?: boolean) => void;
  disabled?: boolean;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({ categories, gridState, onCellClick, disabled }) => {
  if (categories.length !== 3) return <div>Only 3-category puzzles are supported in this view.</div>;

  const cat1 = categories[0];
  const cat2 = categories[1];
  const cat3 = categories[2];

  const cellSizeClass = "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12";

  const getKey = (c1Idx: number, i1Idx: number, c2Idx: number, i2Idx: number) => {
    const part1 = `c${c1Idx}i${i1Idx}`;
    const part2 = `c${c2Idx}i${i2Idx}`;
    return part1 < part2 ? `${part1}|${part2}` : `${part2}|${part1}`;
  };

  const getCellState = (c1Idx: number, i1Idx: number, c2Idx: number, i2Idx: number) => {
    return gridState[getKey(c1Idx, i1Idx, c2Idx, i2Idx)] || CellState.EMPTY;
  };

  const handleInteraction = (e: React.MouseEvent | undefined, c1Idx: number, i1Idx: number, c2Idx: number, i2Idx: number) => {
    if (disabled) return;
    if (e) e.preventDefault(); 
    const isRight = e?.type === 'contextmenu';
    onCellClick(c1Idx, i1Idx, c2Idx, i2Idx, isRight);
  };

  return (
    <div className="perspective-[1200px] mb-12">
      <div 
        className={`
          inline-block p-6 rounded-sm
          shadow-[20px_20px_0_rgba(0,0,0,0.2),30px_30px_40px_rgba(0,0,0,0.1)] 
          border-[6px] max-w-full
          transform transition-transform duration-500
          rotate-x-[15deg] rotate-z-[-2deg]
          hover:rotate-x-[10deg] hover:rotate-z-[0deg] hover:translate-y-[-10px]
        `}
        style={{
          backgroundColor: 'var(--puz-surface)',
          borderColor: 'var(--puz-border)',
        }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, var(--puz-border) 10px, var(--puz-border) 12px)'}}>
        </div>

        <div className={`relative grid gap-1 transition-opacity ${disabled ? 'pointer-events-none' : ''}`} style={{ 
            gridTemplateColumns: `auto repeat(${cat1.items.length}, min-content) 32px repeat(${cat3.items.length}, min-content)` 
          }}>
          
          <div className="col-start-1 row-start-1"></div>

          {/* Cat 1 Headers */}
          {cat1.items.map((item, i) => (
            <div key={`head1-${i}`} 
              className={`col-start-[calc(2+var(--i))] row-start-1 ${cellSizeClass} !h-auto min-h-[140px] pb-3 flex flex-col justify-end items-center group`} 
              style={{'--i': i} as any}
            >
              <div className="writing-mode-vertical transform rotate-180 text-xs sm:text-sm font-bold uppercase tracking-widest text-center transition-colors" 
                   style={{ color: 'var(--puz-text)' }}>
                {item}
              </div>
              <div className="h-4 w-0.5 mt-2 transition-colors" style={{ backgroundColor: 'var(--puz-border)' }}></div>
            </div>
          ))}
          
          <div className="w-8"></div>

          {/* Cat 3 Headers */}
          {cat3.items.map((item, i) => (
             <div key={`head3-${i}`} 
              className={`col-start-[calc(2+4+1+var(--i))] row-start-1 ${cellSizeClass} !h-auto min-h-[140px] pb-3 flex flex-col justify-end items-center group`}
              style={{'--i': i} as any}
            >
               <div className="writing-mode-vertical transform rotate-180 text-xs sm:text-sm font-bold uppercase tracking-widest text-center transition-colors"
                    style={{ color: 'var(--puz-text)' }}>
                {item}
              </div>
               <div className="h-4 w-0.5 mt-2 transition-colors" style={{ backgroundColor: 'var(--puz-border)' }}></div>
            </div>
          ))}

          {/* Row Group 1: Cat 2 Items */}
          {cat2.items.map((rowItem, rIdx) => (
            <React.Fragment key={`row-cat2-${rIdx}`}>
              <div className={`col-start-1 flex items-center justify-end pr-4 ${cellSizeClass} !w-auto font-bold text-xs sm:text-sm uppercase tracking-widest group`}>
                <span className="transition-colors" style={{ color: 'var(--puz-text)' }}>{rowItem}</span>
                <div className="w-4 h-0.5 ml-3 transition-colors" style={{ backgroundColor: 'var(--puz-border)' }}></div>
              </div>

              {cat1.items.map((colItem, cIdx) => (
                <div key={`cell-2-1-${rIdx}-${cIdx}`} className="flex items-center justify-center">
                  <GridCell 
                    state={getCellState(1, rIdx, 0, cIdx)}
                    onClick={() => handleInteraction(undefined, 1, rIdx, 0, cIdx)}
                    onRightClick={(e) => handleInteraction(e, 1, rIdx, 0, cIdx)}
                    className={cellSizeClass}
                    disabled={disabled}
                  />
                </div>
              ))}
              <div></div>
              {cat3.items.map((colItem, cIdx) => (
                <div key={`cell-2-3-${rIdx}-${cIdx}`} className="flex items-center justify-center">
                   <GridCell 
                    state={getCellState(1, rIdx, 2, cIdx)}
                    onClick={() => handleInteraction(undefined, 1, rIdx, 2, cIdx)}
                    onRightClick={(e) => handleInteraction(e, 1, rIdx, 2, cIdx)}
                    className={cellSizeClass}
                    disabled={disabled}
                  />
                </div>
              ))}
            </React.Fragment>
          ))}

          <div className="col-span-full h-8 flex items-center px-4">
               <div className="w-full h-0.5 rounded-full opacity-50" style={{ backgroundColor: 'var(--puz-border)' }}></div>
          </div>

          {/* Row Group 2: Cat 3 Items */}
          {cat3.items.map((rowItem, rIdx) => (
            <React.Fragment key={`row-cat3-${rIdx}`}>
               <div className={`col-start-1 flex items-center justify-end pr-4 ${cellSizeClass} !w-auto font-bold text-xs sm:text-sm uppercase tracking-widest group`}>
                <span className="transition-colors" style={{ color: 'var(--puz-text)' }}>{rowItem}</span>
                <div className="w-4 h-0.5 ml-3 transition-colors" style={{ backgroundColor: 'var(--puz-border)' }}></div>
              </div>

              {cat1.items.map((colItem, cIdx) => (
                <div key={`cell-3-1-${rIdx}-${cIdx}`} className="flex items-center justify-center">
                   <GridCell 
                    state={getCellState(2, rIdx, 0, cIdx)}
                    onClick={() => handleInteraction(undefined, 2, rIdx, 0, cIdx)}
                    onRightClick={(e) => handleInteraction(e, 2, rIdx, 0, cIdx)}
                    className={cellSizeClass}
                    disabled={disabled}
                  />
                </div>
              ))}
              <div className="col-span-6"></div>
            </React.Fragment>
          ))}
        </div>

        <style>{`
          .writing-mode-vertical {
            writing-mode: vertical-rl;
            text-orientation: mixed;
          }
        `}</style>
      </div>
    </div>
  );
};