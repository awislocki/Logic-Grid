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
    <div 
      className="rounded-sm shadow-[4px_4px_0_rgba(0,0,0,0.1)] border p-6 h-full flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: 'var(--puz-surface)',
        borderColor: 'var(--puz-border)',
        color: 'var(--puz-text)'
      }}
    >
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='currentColor' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10 border-b-2 pb-2" style={{ borderColor: 'var(--puz-border)' }}>
        <h3 className="text-xl font-bold tracking-wide">INVESTIGATION NOTES</h3>
        <span className="text-sm font-mono font-bold px-2 py-1 rounded opacity-70" style={{ backgroundColor: 'var(--puz-border)', color: 'var(--puz-primary)' }}>
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
              className={`group relative p-3 transition-all duration-200 cursor-pointer rounded-sm ${isDone ? 'opacity-50' : 'hover:brightness-95'}`}
              style={{ backgroundColor: isDone ? 'transparent' : 'rgba(0,0,0,0.02)' }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 min-w-5 h-5 border-2 flex items-center justify-center transition-colors rounded-sm`}
                     style={{ 
                       borderColor: isDone ? 'var(--puz-border)' : 'var(--puz-primary)', 
                       backgroundColor: isDone ? 'var(--puz-border)' : 'var(--puz-surface)' 
                     }}>
                   {isDone && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                </div>
                <p className={`text-sm sm:text-base leading-relaxed ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--puz-border)' : 'var(--puz-text)' }}>
                  {clue}
                </p>
              </div>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div className="border-t-2 border-dashed pt-4 mt-4" style={{ borderColor: 'var(--puz-border)' }}>
             <div className="flex items-center gap-2 italic opacity-60">
                <Lock className="w-4 h-4" />
                <span>{hiddenCount} clues hidden... Use a Hint to reveal.</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};