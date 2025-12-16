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

  const cat1 = categories[0]; // Col Group 1
  const cat2 = categories[1]; // Row Group 1
  const cat3 = categories[2]; // Row Group 2 (Bottom) AND Col Group 2 (Top Right)

  const cellSizeClass = "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12";

  // Helper to generate key
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

  /*
    NEW LAYOUT PLAN:
    Columns: [Cat 1 Items] [Spacer] [Cat 3 Items]
    Rows:
       Group 1 (Cat 2 Items):
          - Grid Left: Cat 2 vs Cat 1
          - Grid Right: Cat 2 vs Cat 3
       Group 2 (Cat 3 Items):
          - Grid Left: Cat 3 vs Cat 1
          - Grid Right: EMPTY
  */

  return (
    <div className="perspective-[1200px] mb-12">
      <div className={`
        inline-block p-6 bg-[#f4f1ea]
        rounded-sm
        /* 3D Board Game Slab Effect with Rotation */
        shadow-[20px_20px_0_rgba(43,45,66,0.2),30px_30px_40px_rgba(0,0,0,0.1)] 
        border-[6px] border-[#c0b090]
        max-w-full
        transform transition-transform duration-500
        rotate-x-[15deg] rotate-z-[-2deg]
        hover:rotate-x-[10deg] hover:rotate-z-[0deg] hover:translate-y-[-10px]
      `}>
        {/* Wood texture background for the board */}
        <div className="absolute inset-0 bg-[#d4c5b0] opacity-20 pointer-events-none" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #b0a080 10px, #b0a080 12px)'}}></div>

        <div className={`relative grid gap-1 transition-opacity ${disabled ? 'pointer-events-none' : ''}`} style={{ 
            gridTemplateColumns: `auto repeat(${cat1.items.length}, min-content) 32px repeat(${cat3.items.length}, min-content)` 
          }}>
          
          {/* --- Header Row --- */}
          <div className="col-start-1 row-start-1"></div>

          {/* Cat 1 Headers (Top Left) */}
          {cat1.items.map((item, i) => (
            <div key={`head1-${i}`} 
              className={`
                col-start-[calc(2+var(--i))] row-start-1 
                ${cellSizeClass} !h-auto min-h-[140px] pb-3
                flex flex-col justify-end items-center group
              `} 
              style={{'--i': i} as any}
            >
              <div className="writing-mode-vertical transform rotate-180 text-xs sm:text-sm font-bold font-serif text-[#5e6472] uppercase tracking-widest text-center group-hover:text-[#2b2d42] transition-colors">
                {item}
              </div>
              <div className="h-4 w-0.5 bg-[#d4c5b0] mt-2 group-hover:bg-[#2b2d42] transition-colors"></div>
            </div>
          ))}
          
          {/* Spacer Column Header */}
          <div className="w-8"></div>

          {/* Cat 3 Headers (Top Right) */}
          {cat3.items.map((item, i) => (
             <div key={`head3-${i}`} 
              className={`
                col-start-[calc(2+4+1+var(--i))] row-start-1 
                ${cellSizeClass} !h-auto min-h-[140px] pb-3
                flex flex-col justify-end items-center group
              `}
              style={{'--i': i} as any}
            >
               <div className="writing-mode-vertical transform rotate-180 text-xs sm:text-sm font-bold font-serif text-[#5e6472] uppercase tracking-widest text-center group-hover:text-[#2b2d42] transition-colors">
                {item}
              </div>
               <div className="h-4 w-0.5 bg-[#d4c5b0] mt-2 group-hover:bg-[#2b2d42] transition-colors"></div>
            </div>
          ))}


          {/* --- Row Group 1: Cat 2 Items --- */}
          {cat2.items.map((rowItem, rIdx) => (
            <React.Fragment key={`row-cat2-${rIdx}`}>
              {/* Row Label */}
              <div className={`
                  col-start-1 flex items-center justify-end pr-4 
                  ${cellSizeClass} !w-auto
                  font-bold font-serif text-[#5e6472] text-xs sm:text-sm uppercase tracking-widest group
                `}>
                <span className="group-hover:text-[#2b2d42] transition-colors">{rowItem}</span>
                <div className="w-4 h-0.5 bg-[#d4c5b0] ml-3 group-hover:bg-[#2b2d42] transition-colors"></div>
              </div>

              {/* Grid 1 Cells: Cat 2 (Rows) vs Cat 1 (Cols) */}
              {cat1.items.map((colItem, cIdx) => (
                <div key={`cell-2-1-${rIdx}-${cIdx}`} className="flex items-center justify-center">
                  <GridCell 
                    state={getCellState(1, rIdx, 0, cIdx)} // Cat 2 is Index 1, Cat 1 is Index 0
                    onClick={() => handleInteraction(undefined, 1, rIdx, 0, cIdx)}
                    onRightClick={(e) => handleInteraction(e, 1, rIdx, 0, cIdx)}
                    className={cellSizeClass}
                    disabled={disabled}
                  />
                </div>
              ))}

              {/* Spacer Cell */}
              <div></div>

              {/* Grid 2 Cells: Cat 2 (Rows) vs Cat 3 (Cols) */}
              {cat3.items.map((colItem, cIdx) => (
                <div key={`cell-2-3-${rIdx}-${cIdx}`} className="flex items-center justify-center">
                   <GridCell 
                    state={getCellState(1, rIdx, 2, cIdx)} // Cat 2 is Index 1, Cat 3 is Index 2
                    onClick={() => handleInteraction(undefined, 1, rIdx, 2, cIdx)}
                    onRightClick={(e) => handleInteraction(e, 1, rIdx, 2, cIdx)}
                    className={cellSizeClass}
                    disabled={disabled}
                  />
                </div>
              ))}

            </React.Fragment>
          ))}


          {/* --- Middle Horizontal Divider --- */}
          <div className="col-span-full h-8 flex items-center px-4">
               <div className="w-full h-0.5 bg-[#d4c5b0] rounded-full opacity-50"></div>
          </div>


          {/* --- Row Group 2: Cat 3 Items --- */}
          {cat3.items.map((rowItem, rIdx) => (
            <React.Fragment key={`row-cat3-${rIdx}`}>
              {/* Row Label */}
               <div className={`
                  col-start-1 flex items-center justify-end pr-4 
                  ${cellSizeClass} !w-auto
                  font-bold font-serif text-[#5e6472] text-xs sm:text-sm uppercase tracking-widest group
                `}>
                <span className="group-hover:text-[#2b2d42] transition-colors">{rowItem}</span>
                <div className="w-4 h-0.5 bg-[#d4c5b0] ml-3 group-hover:bg-[#2b2d42] transition-colors"></div>
              </div>

              {/* Grid 3 Cells: Cat 3 (Rows) vs Cat 1 (Cols) */}
              {cat1.items.map((colItem, cIdx) => (
                <div key={`cell-3-1-${rIdx}-${cIdx}`} className="flex items-center justify-center">
                   <GridCell 
                    state={getCellState(2, rIdx, 0, cIdx)} // Cat 3 is Index 2, Cat 1 is Index 0
                    onClick={() => handleInteraction(undefined, 2, rIdx, 0, cIdx)}
                    onRightClick={(e) => handleInteraction(e, 2, rIdx, 0, cIdx)}
                    className={cellSizeClass}
                    disabled={disabled}
                  />
                </div>
              ))}

              {/* Empty Space to the right (Cat 3 vs Cat 3) */}
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