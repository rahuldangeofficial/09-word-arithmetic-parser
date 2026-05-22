import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

export default function TokenizerStep({ input }) {
  const [steps, setSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!input) {
      setSteps([]);
      setCurrentStepIdx(0);
      return;
    }

    const generatedSteps = [];
    const tokens = [];
    let idx = 0;

    // Initial State
    generatedSteps.push({
      charIndex: -1,
      matchRange: [0, 0],
      log: 'Scanner ready. Starting at position 0.',
      accumulatedTokens: [],
    });

    while (idx < input.length) {
      const char = input[idx];

      // 1. Whitespace
      if (/\s/.test(char)) {
        let wsStart = idx;
        while (idx < input.length && /\s/.test(input[idx])) idx++;
        generatedSteps.push({
          charIndex: wsStart,
          matchRange: [wsStart, idx],
          log: `Whitespace at pos ${wsStart}; skipped.`,
          accumulatedTokens: [...tokens],
        });
        continue;
      }

      // 2. Parentheses
      if (char === '(' || char === ')') {
        const type = char === '(' ? 'LPAREN' : 'RPAREN';
        tokens.push({ type, value: char, position: idx });
        idx++;
        generatedSteps.push({
          charIndex: idx - 1,
          matchRange: [idx - 1, idx],
          log: `Matched '${char}' → ${type}`,
          accumulatedTokens: [...tokens],
        });
        continue;
      }

      // 3. Number literal
      if (/[0-9]/.test(char)) {
        let numStart = idx;
        let hasDecimal = false;
        while (idx < input.length && (/[0-9]/.test(input[idx]) || input[idx] === '.')) {
          if (input[idx] === '.') {
            if (hasDecimal) break;
            hasDecimal = true;
          }
          idx++;
        }
        const numStr = input.substring(numStart, idx);
        const value = parseFloat(numStr);
        tokens.push({ type: 'NUMBER', value, position: numStart });
        generatedSteps.push({
          charIndex: numStart,
          matchRange: [numStart, idx],
          log: `Number "${numStr}" → NUMBER`,
          accumulatedTokens: [...tokens],
        });
        continue;
      }

      // 4. Operator words
      const remaining = input.slice(idx).toLowerCase();
      const keywords = ['multiply', 'divide', 'minus', 'plus'];
      let opMatched = false;
      for (const keyword of keywords) {
        if (remaining.startsWith(keyword)) {
          const matchedText = input.substring(idx, idx + keyword.length);
          tokens.push({ type: 'OPERATOR', value: keyword, position: idx });
          const start = idx;
          idx += keyword.length;
          generatedSteps.push({
            charIndex: start,
            matchRange: [start, idx],
            log: `Keyword "${matchedText}" → OPERATOR (${keyword})`,
            accumulatedTokens: [...tokens],
          });
          opMatched = true;
          break;
        }
      }
      if (opMatched) continue;

      // 5. Unknown character
      idx++;
      generatedSteps.push({
        charIndex: idx - 1,
        matchRange: [idx - 1, idx],
        log: `Unexpected "${char}" at pos ${idx - 1}`,
        accumulatedTokens: [...tokens],
        isError: true,
      });
      break;
    }

    if (idx >= input.length && !generatedSteps[generatedSteps.length - 1].isError) {
      generatedSteps.push({
        charIndex: input.length,
        matchRange: [input.length, input.length],
        log: 'Scan complete. All tokens identified.',
        accumulatedTokens: [...tokens],
        isDone: true,
      });
    }

    setSteps(generatedSteps);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [input]);

  // Stepping timer
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps]);

  if (!input) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Enter an expression above to visualize tokenization.
      </div>
    );
  }

  const currentStep = steps[currentStepIdx] || {
    charIndex: -1,
    matchRange: [0, 0],
    log: '',
    accumulatedTokens: [],
  };

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) setCurrentStepIdx(currentStepIdx + 1);
  };
  const handlePrev = () => {
    if (currentStepIdx > 0) setCurrentStepIdx(currentStepIdx - 1);
  };
  const handleReset = () => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const progressPct = steps.length > 1 ? ((currentStepIdx) / (steps.length - 1)) * 100 : 0;

  return (
    <div className="tokenizer-visualizer">
      {/* macOS style Terminal Window */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <span className="terminal-title">tokenizer_scanner.sh</span>
        </div>
        <div className="scanner-screen">
          <div className="char-stream">
            {input.split('').map((char, index) => {
              const [start, end] = currentStep.matchRange;
              const isActive = index >= start && index < end;
              const isScanned = index < start;

              return (
                <span
                  key={index}
                  className={`char-cell ${isActive ? 'active' : ''} ${isScanned ? 'scanned' : ''}`}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>
          {/* Progress bar along bottom */}
          <div className="scanner-progress">
            <div className="scanner-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Controls + Log in one row */}
      <div className="tokenizer-toolbar">
        <div className="tokenizer-controls-row">
          <button className="control-btn-sm" onClick={handlePrev} disabled={currentStepIdx === 0} title="Previous step">
            <ChevronLeft size={14} />
          </button>
          <button className="control-btn-sm" onClick={() => setIsPlaying(!isPlaying)} disabled={steps.length <= 1} title={isPlaying ? 'Pause' : 'Auto-play'}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="control-btn-sm" onClick={handleNext} disabled={currentStepIdx === steps.length - 1} title="Next step">
            <ChevronRight size={14} />
          </button>
          <button className="control-btn-sm" onClick={handleReset} title="Reset">
            <RotateCcw size={12} />
          </button>
          <span className="step-counter">
            {currentStepIdx + 1}/{steps.length}
          </span>
        </div>
        <div
          className={`scanner-log ${currentStep.isError ? 'error' : ''} ${currentStep.isDone ? 'done' : ''}`}
          style={{ fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}
        >
          <span style={{ color: 'var(--text-muted)', marginRight: '8px', fontSize: '0.75rem', userSelect: 'none' }}>
            [{String(currentStepIdx + 1).padStart(2, '0')}]
          </span>
          <span style={{
            color: currentStep.isError ? 'var(--error)' : currentStep.isDone ? 'var(--secondary-light)' : 'var(--primary-start)',
            marginRight: '8px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            userSelect: 'none'
          }}>
            {currentStep.isError ? 'ERR' : currentStep.isDone ? 'OK ' : 'RUN'}
          </span>
          <span style={{ fontSize: '0.82rem' }}>{currentStep.log}</span>
        </div>
      </div>

      {/* Token stream output */}
      <div className="token-output">
        {currentStep.accumulatedTokens.length === 0 ? (
          <div className="token-empty">No tokens yet</div>
        ) : (
          currentStep.accumulatedTokens.map((t, idx) => {
            let badgeClass = 'token-badge-number';
            if (t.type === 'OPERATOR') badgeClass = 'token-badge-operator';
            if (t.type === 'LPAREN' || t.type === 'RPAREN') badgeClass = 'token-badge-paren';

            return (
              <div key={idx} className={`token-pill token-fly-in ${badgeClass}`}>
                <span className="token-pill-value">{t.value}</span>
                <span className="token-pill-type">{t.type}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
