import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { generatePuzzle } from './services/gemini';
import { PuzzleData, GridState, CellState, Category } from './types';
import { PuzzleGrid } from './components/PuzzleGrid';
import { CluesList } from './components/CluesList';
import { GameControls } from './components/GameControls';
import { Brain, Sparkles, AlertCircle, CheckCircle, Info, Lock } from 'lucide-react';

const getKey = (c1: number, i1: number, c2: number, i2: number) => {
  const part1 = `c${c1}i${i1}`;
  const part2 = `c${c2}i${i2}`;
  return part1 < part2 ? `${part1}|${part2}` : `${part2}|${part1}`;
};

const parseKey = (key: string) => {
  const [p1, p2] = key.split('|');
  const c1 = parseInt(p1.charAt(1));
  const i1 = parseInt(p1.slice(3));
  const c2 = parseInt(p2.charAt(1));
  const i2 = parseInt(p2.slice(3));
  return { c1, i1, c2, i2 };
};

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [gridState, setGridState] = useState<GridState>({});
  const [themeInput, setThemeInput] = useState<string>("Cyberpunk Mystery");
  
  // Game Logic State
  const [tokens, setTokens] = useState<number>(3);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [win, setWin] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'info', message: string } | null>(null);
  
  // Clue Logic
  const [revealedClues, setRevealedClues] = useState<number>(4);

  const initGame = useCallback(async (theme: string) => {
    setLoading(true);
    setFeedback(null);
    setWin(false);
    setGameOver(false);
    setTokens(3); 
    setRevealedClues(4); 
    setGridState({}); 
    try {
      const data = await generatePuzzle(theme);
      setPuzzle(data);
    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to load puzzle. Please check your API key." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initGame("Classic Mystery");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const recalculateGrid = (currentGrid: GridState): GridState => {
    const nextGrid = { ...currentGrid };
    Object.keys(nextGrid).forEach(k => {
      if (nextGrid[k] === CellState.FALSE_AUTO) {
        delete nextGrid[k];
      }
    });

    Object.entries(nextGrid).forEach(([key, state]) => {
      if (state === CellState.TRUE) {
        const { c1, i1, c2, i2 } = parseKey(key);
        for (let x = 0; x < 4; x++) {
          if (x !== i2) {
            const rowKey = getKey(c1, i1, c2, x);
            if (!nextGrid[rowKey]) nextGrid[rowKey] = CellState.FALSE_AUTO;
          }
          if (x !== i1) {
            const colKey = getKey(c1, x, c2, i2);
            if (!nextGrid[colKey]) nextGrid[colKey] = CellState.FALSE_AUTO;
          }
        }
      }
    });
    return nextGrid;
  };

  const revealSolution = (currentPuzzle: PuzzleData, userGrid: GridState) => {
    const perfectGrid: GridState = {};
    const cats = currentPuzzle.categories;
    const pairs = [[0,1], [0,2], [1,2]]; 

    for (const [cIdxA, cIdxB] of pairs) {
      const itemsA = cats[cIdxA].items;
      for (let iA = 0; iA < itemsA.length; iA++) {
        const itemA = itemsA[iA];
        let matches = currentPuzzle.solution[itemA];
        if (!matches) {
             const keyMatch = Object.keys(currentPuzzle.solution).find(k => k.trim().toLowerCase() === itemA.trim().toLowerCase());
             if (keyMatch) matches = currentPuzzle.solution[keyMatch];
        }
        if (matches) {
          const catBItems = cats[cIdxB].items;
          const itemB = matches.find(m => catBItems.some(cb => cb.trim().toLowerCase() === m.trim().toLowerCase()));
          if (itemB) {
            const iB = cats[cIdxB].items.findIndex(x => x.trim().toLowerCase() === itemB.trim().toLowerCase());
            if (iB !== -1) {
              const key = getKey(cIdxA, iA, cIdxB, iB);
              perfectGrid[key] = CellState.TRUE;
            }
          }
        }
      }
    }

    const comparisonGrid: GridState = { ...userGrid };

    for (const [key, val] of Object.entries(userGrid)) {
        if (val === CellState.TRUE) {
            if (perfectGrid[key] === CellState.TRUE) {
                comparisonGrid[key] = CellState.TRUE_CORRECT;
            } else {
                comparisonGrid[key] = CellState.TRUE_INCORRECT;
            }
        }
    }

    for (const [key, val] of Object.entries(perfectGrid)) {
        if (val === CellState.TRUE) {
            if (userGrid[key] !== CellState.TRUE) {
                comparisonGrid[key] = CellState.MISSED;
            }
        }
    }

    setGridState(comparisonGrid);
  };

  const handleCellClick = (c1: number, i1: number, c2: number, i2: number, isRightClick?: boolean) => {
    if (win || gameOver) return;
    const key = getKey(c1, i1, c2, i2);
    const currentState = gridState[key] || CellState.EMPTY;
    
    let nextManualState = CellState.EMPTY;
    if (isRightClick) {
      nextManualState = (currentState === CellState.EMPTY || currentState === CellState.FALSE_AUTO || currentState === CellState.TRUE) 
        ? CellState.FALSE 
        : CellState.EMPTY;
    } else {
      if (currentState === CellState.EMPTY || currentState === CellState.FALSE_AUTO) {
        nextManualState = CellState.TRUE;
      } else if (currentState === CellState.TRUE) {
        nextManualState = CellState.FALSE;
      } else {
        nextManualState = CellState.EMPTY;
      }
    }
    const tempGrid = { ...gridState };
    if (nextManualState === CellState.EMPTY) {
      delete tempGrid[key];
    } else {
      tempGrid[key] = nextManualState;
    }
    const finalGrid = recalculateGrid(tempGrid);
    setGridState(finalGrid);
  };

  const checkSolution = () => {
    if (!puzzle || gameOver || win) return;

    if (tokens <= 0) {
      setFeedback({ type: 'error', message: "No tokens left!" });
      return;
    }
    
    const nextTokens = tokens - 1;
    setTokens(nextTokens);

    let isCorrect = true;
    let userTrueCount = 0;
    
    for (const [key, state] of Object.entries(gridState)) {
      if (state === CellState.TRUE) {
        userTrueCount++;
        const { c1, i1, c2, i2 } = parseKey(key);
        const item1Name = puzzle.categories[c1].items[i1];
        const item2Name = puzzle.categories[c2].items[i2];

        let matches: string[] | undefined;
        if (puzzle.solution[item1Name]) {
            matches = puzzle.solution[item1Name];
        } else {
            const keyMatch = Object.keys(puzzle.solution).find(k => k.trim().toLowerCase() === item1Name.trim().toLowerCase());
            if (keyMatch) matches = puzzle.solution[keyMatch];
        }
        
        const isMatch = matches?.some(m => m.trim().toLowerCase() === item2Name.trim().toLowerCase());
        if (!matches || !isMatch) isCorrect = false;
      }
    }

    const isComplete = userTrueCount === 12;

    if (isCorrect && isComplete) {
      setWin(true);
      setFeedback({ type: 'success', message: "Perfect! You solved the puzzle!" });
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      if (!isCorrect) {
        setFeedback({ type: 'error', message: "Incorrect. Some checks are wrong." });
      } else {
        setFeedback({ type: 'info', message: "Correct so far, but incomplete." });
      }

      if (nextTokens === 0) {
        setGameOver(true);
        setFeedback({ type: 'error', message: "Out of tokens! Solution revealed." });
        revealSolution(puzzle, gridState);
      }
    }
  };

  const giveHint = () => {
    if (!puzzle || win || gameOver) return;
    if (tokens <= 0) {
      setFeedback({ type: 'error', message: "No tokens left!" });
      return;
    }
    if (revealedClues >= puzzle.clues.length) {
       setFeedback({ type: 'info', message: "All clues are already revealed!" });
       return;
    }

    const nextTokens = tokens - 1;
    setTokens(nextTokens);
    setRevealedClues(prev => prev + 1);
    setFeedback({ type: 'success', message: "New clue revealed!" });
    
    if (nextTokens === 0) {
       setGameOver(true);
       setTimeout(() => {
           setFeedback({ type: 'error', message: "Out of tokens! Solution revealed." });
           revealSolution(puzzle, gridState);
       }, 1500); 
    }
  };

  // Construct Dynamic Styles
  const themeStyles = puzzle ? {
    '--puz-bg': puzzle.theme.colors.background,
    '--puz-surface': puzzle.theme.colors.surface,
    '--puz-border': puzzle.theme.colors.border,
    '--puz-text': puzzle.theme.colors.text,
    '--puz-accent': puzzle.theme.colors.accent,
    '--puz-primary': puzzle.theme.colors.primary,
    '--puz-font': puzzle.theme.font === 'serif' ? 'serif' : puzzle.theme.font === 'mono' ? 'monospace' : 'sans-serif',
  } as React.CSSProperties : {};

  // Construct Dynamic Emoji Pattern Background
  const emoji = puzzle?.theme.emoji || '✨';
  const bgPattern = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='30' text-anchor='middle' dominant-baseline='middle' fill-opacity='0.1' style='font-family: serif;'%3E${emoji}%3C/text%3E%3C/svg%3E")`;

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-6 transition-colors duration-700"
      style={{
        ...themeStyles,
        backgroundColor: 'var(--puz-bg)',
        fontFamily: 'var(--puz-font), sans-serif',
        color: 'var(--puz-text)'
      }}
    >
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0" style={{ backgroundImage: bgPattern }}></div>

      {/* Header */}
      <div className="w-full max-w-7xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--puz-primary)' }}>
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide" style={{ color: 'var(--puz-primary)' }}>LOGIC GRID <span style={{ color: 'var(--puz-accent)' }}>MYSTERY</span></h1>
            <p className="font-medium tracking-widest text-xs uppercase opacity-70">Generated Deductive Reasoning</p>
          </div>
        </div>
        
        {puzzle && (
           <div className="px-6 py-4 rounded-sm border shadow-sm max-w-2xl flex-1 md:text-right relative"
                style={{ backgroundColor: 'var(--puz-surface)', borderColor: 'var(--puz-border)' }}>
             <div className="absolute top-0 left-0 w-full h-1 opacity-20" style={{ backgroundColor: 'var(--puz-primary)' }}></div>
             <h2 className="text-xl font-bold" style={{ color: 'var(--puz-text)' }}>{puzzle.title}</h2>
             <p className="text-sm mt-1 italic leading-relaxed opacity-80">{puzzle.story}</p>
           </div>
        )}
      </div>

      <div className="w-full max-w-7xl relative z-10">
        <GameControls 
          onNewGame={() => initGame(themeInput)} 
          onCheck={checkSolution}
          onHint={giveHint}
          loading={loading}
          theme={themeInput}
          setTheme={setThemeInput}
          tokens={tokens}
          gameOver={gameOver || win}
          revealedClues={revealedClues}
          totalClues={puzzle ? puzzle.clues.length : 8}
        />

        {/* Feedback Banner */}
        {feedback && (
          <div className={`
            mb-6 border-l-4 px-6 py-4 rounded-r-md flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300
            ${feedback.type === 'error' ? 'bg-red-50 border-red-600 text-red-900' : ''}
            ${feedback.type === 'success' ? 'bg-green-50 border-green-600 text-green-900' : ''}
            ${feedback.type === 'info' ? 'bg-blue-50 border-blue-600 text-blue-900' : ''}
          `} style={{
            // Override with theme colors if possible, but keep accessible defaults for alerts
            borderColor: feedback.type === 'success' ? 'var(--puz-accent)' : undefined
          }}>
            {feedback.type === 'error' && <AlertCircle className="w-6 h-6 shrink-0" />}
            {feedback.type === 'success' && <CheckCircle className="w-6 h-6 shrink-0" />}
            {feedback.type === 'info' && <Info className="w-6 h-6 shrink-0" />}
            <span className="font-bold text-lg">{feedback.message}</span>
          </div>
        )}

        {/* Game Over Banner */}
        {gameOver && !win && (
          <div className="mb-6 text-white px-6 py-4 rounded-sm shadow-xl flex items-center gap-4 animate-in fade-in border-4"
               style={{ backgroundColor: 'var(--puz-primary)', borderColor: 'var(--puz-border)' }}>
             <Lock className="w-8 h-8" style={{ color: 'var(--puz-accent)' }} />
             <div>
               <p className="font-bold text-xl tracking-wide">CASE CLOSED</p>
               <p className="opacity-80 text-sm">You ran out of resources. The solution comparison is shown below.</p>
             </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
            <Sparkles className="w-16 h-16 mb-6 animate-spin-slow" style={{ color: 'var(--puz-primary)' }} />
            <p className="text-2xl font-bold">Constructing Mystery...</p>
            <p className="mt-2 italic opacity-60">Interviewing witnesses, gathering evidence...</p>
          </div>
        )}

        {!loading && puzzle && (
          <div className="flex flex-col xl:flex-row gap-12 items-start justify-center">
            
            {/* Left Column: Grid */}
            <div className="w-full xl:w-auto overflow-visible pb-8 flex flex-col items-center">
              <div className={`min-w-fit transition-all duration-700 ${gameOver ? 'opacity-100' : ''}`}>
                 <PuzzleGrid 
                  categories={puzzle.categories} 
                  gridState={gridState} 
                  onCellClick={handleCellClick}
                  disabled={gameOver || win}
                 />
                 {/* Legend for Game Over */}
                 {gameOver && !win && (
                    <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-sm"
                         style={{ backgroundColor: 'var(--puz-surface)', color: 'var(--puz-text)' }}>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: 'var(--puz-accent)' }}></div> Correct</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#e63946]"></div> Incorrect</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: 'var(--puz-primary)' }}></div> Missed</div>
                    </div>
                 )}
              </div>
            </div>

            {/* Right Column: Clues */}
            <div className="w-full xl:flex-1 h-[650px] xl:h-[750px]">
              <CluesList clues={puzzle.clues} revealedCount={revealedClues} />
            </div>

          </div>
        )}
      </div>
      
    </div>
  );
};

export default App;