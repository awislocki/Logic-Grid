import React, { useState } from 'react';
import { CheckCheck, Lock } from 'lucide-react';

interface CluesListProps {
  clues: string[];
  revealedCount: number;
}

export const CluesList: React.FC<CluesListProps> = ({ clues, revealedCount }) => {
  const [completedClues, setCompletedClues] = useState<number[]>([]);

  const toggleClue = (index: number) => {
    setCompletedClues(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const visibleClues = clues.slice(0, revealedCount);
  const hiddenCount = Math.max(0, clues.length - revealedCount);

  return (
    <div className="bg-[#f4f1ea] rounded-sm shadow-[4px_4px_0_rgba(0,0,0,0.1)] border border-[#d4c5b0] p-6 h-full flex flex-col relative overflow-hidden">
      {/* Paper texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

      <div className="flex items-center justify-between mb-6 relative z-10 border-b-2 border-[#d4c5b0] pb-2">
        <h3 className="text-xl font-serif font-bold text-[#2b2d42] tracking-wide">INVESTIGATION NOTES</h3>
        <span className="text-sm font-mono font-bold text-[#8d99ae] bg-[#edf2f4] px-2 py-1 rounded">
          {completedClues.length} / {revealedCount}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar relative z-10">
        {visibleClues.map((clue, idx) => {
          const isDone = completedClues.includes(idx);
          return (
            <div 
              key={idx}
              onClick={() => toggleClue(idx)}
              className={`
                group relative p-3 transition-all duration-200 cursor-pointer
                ${isDone 
                  ? 'opacity-50' 
                  : 'hover:bg-[#e8e4da]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                    mt-1 min-w-5 h-5 border-2 flex items-center justify-center transition-colors rounded-sm
                    ${isDone ? 'border-[#8d99ae] bg-[#8d99ae]' : 'border-[#2b2d42] bg-white'}
                `}>
                   {isDone && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                </div>
                <p className={`
                    font-serif text-sm sm:text-base leading-relaxed 
                    ${isDone ? 'line-through text-[#8d99ae]' : 'text-[#2b2d42]'}
                `}>
                  {clue}
                </p>
              </div>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div className="border-t-2 border-dashed border-[#d4c5b0] pt-4 mt-4">
             <div className="flex items-center gap-2 text-[#8d99ae] italic font-serif">
                <Lock className="w-4 h-4" />
                <span>{hiddenCount} clues hidden... Use a Hint to reveal.</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};