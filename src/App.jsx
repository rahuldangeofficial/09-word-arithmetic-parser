import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import TokenizerStep from './components/TokenizerStep.jsx';
import AstTreeStep from './components/AstTreeStep.jsx';
import EvaluationStep from './components/EvaluationStep.jsx';
import { ArithmeticParser } from './parser/ArithmeticParser.js';
import { Clipboard, Check, RotateCcw, AlertTriangle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

export default function App() {
  const [expression, setExpression] = useState('10 plus 2 multiply 3 minus 4 divide 2');
  const [inputValue, setInputValue] = useState('10 plus 2 multiply 3 minus 4 divide 2');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState(null);

  // Collapsible section state - all expanded by default
  const [collapsed, setCollapsed] = useState({
    tokenizer: false,
    ast: false,
    evaluator: false,
  });

  const toggleSection = useCallback((key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Examples list
  const examples = [
    '10 plus 2 multiply 3 minus 4 divide 2',
    '10.5 plus 2 multiply (3 minus 4) divide 2.5',
    '16 minus (8 plus 14) divide 2',
    '1plus2plus3'
  ];

  // Parse function
  const handleParse = (exprToParse) => {
    const trimmed = exprToParse.trim();
    if (!trimmed) {
      setResult(null);
      setError('Please enter a word arithmetic expression to evaluate.');
      return;
    }

    try {
      const parser = new ArithmeticParser(trimmed);
      const res = parser.parse();
      setResult(res);
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e.message);
    }
  };

  // Real-time parsing with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      handleParse(expression);
    }, 450);
    return () => clearTimeout(timer);
  }, [expression]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setExpression(e.target.value);
  };

  const handleLoadExpression = (expr) => {
    setInputValue(expr);
    setExpression(expr);
    handleParse(expr);
  };

  const handleClear = () => {
    setInputValue('');
    setExpression('');
    setResult(null);
    setError(null);
  };

  const handleCopyToClipboard = () => {
    if (result !== null) {
      navigator.clipboard.writeText(String(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Scroll-triggered fade-in via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const sections = document.querySelectorAll('.fade-in-section');
    sections.forEach(s => observer.observe(s));

    return () => {
      sections.forEach(s => observer.unobserve(s));
    };
  }, []);

  // Pipeline section data - 3 stages (no test suite)
  const pipelineStages = [
    {
      key: 'tokenizer',
      num: '01',
      title: 'Tokenizer',
      content: <TokenizerStep input={expression} />,
    },
    {
      key: 'ast',
      num: '02',
      title: 'Syntax Tree',
      content: <AstTreeStep input={expression} activeNodeId={activeNodeId} />,
    },
    {
      key: 'evaluator',
      num: '03',
      title: 'BODMAS Evaluator',
      content: <EvaluationStep input={expression} onActiveNodeChange={setActiveNodeId} />,
    },
  ];

  return (
    <>
      {/* Background Orbs */}
      <div className="bg-gradient-mesh" aria-hidden="true">
        <div className="bg-orb bg-orb-saffron" />
        <div className="bg-orb bg-orb-green" />
        <div className="bg-orb bg-orb-purple" />
      </div>

      <Header />

      <main className="app-container">
        {/* Page Title Header */}
        <div className="page-header fade-in-section">
          <span className="page-badge-pill"><span className="online-indicator"></span>Compiler Engine</span>
          <h1 className="page-title-text">Word Arithmetic Parser</h1>
          <p className="page-subtitle-text">
            Analyze, tokenize, and evaluate mathematical expressions written in English words in real-time.
          </p>
        </div>

        {/* Input & Form Area */}
        <div className="parser-section fade-in-section" style={{ marginBottom: '2rem' }}>
          <div className="glass-card">
            <label htmlFor="parser-input" className="input-label">
              Expression
              <span className="input-sub-label"> (numbers as digits, operators as words: plus, minus, multiply, divide)</span>
            </label>
            <div className="input-wrapper" style={{ marginTop: '0.5rem' }}>
              <div className="input-prefix-icon">
                <ChevronRight size={18} />
              </div>
              <input
                id="parser-input"
                type="text"
                className={`input-field ${error ? 'has-error' : ''}`}
                value={inputValue}
                onChange={handleInputChange}
                placeholder="e.g. 10 plus 2 multiply 3 minus 4 divide 2"
                autoComplete="off"
              />
              {inputValue && (
                <button className="clear-btn" onClick={handleClear} title="Clear Input">
                  <RotateCcw size={16} />
                </button>
              )}
            </div>

            {/* Examples chips */}
            <div className="preset-section">
              <div className="chips-container">
                {examples.map((ex, idx) => (
                  <button
                    key={idx}
                    className={`chip ${expression === ex ? 'active' : ''}`}
                    onClick={() => handleLoadExpression(ex)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Result / Error */}
            <div style={{ marginTop: '1rem' }}>
              {error ? (
                <div className="error-card">
                  <AlertTriangle className="error-icon" size={16} />
                  <span className="error-text">{error}</span>
                </div>
              ) : (
                result !== null && (
                  <div className="result-card">
                    <div className="result-info">
                      <span className="result-label">Result</span>
                      <span className="result-val">{Math.round(result * 10000) / 10000}</span>
                    </div>
                    <button
                      className="action-icon-btn"
                      onClick={handleCopyToClipboard}
                      title="Copy result"
                    >
                      {copied ? <Check size={18} style={{ color: 'var(--success)' }} /> : <Clipboard size={18} />}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="pipeline-flow">
          {pipelineStages.map((stage, idx) => (
            <React.Fragment key={stage.key}>
              {idx > 0 && (
                <div className="pipeline-connector" aria-hidden="true">
                  <div className="pipeline-connector-line" />
                  <div className="pipeline-connector-arrow" />
                </div>
              )}

              <section
                className="pipeline-section fade-in-section"
                style={{ animationDelay: `${idx * 0.1}s` }}
                id={`stage-${stage.key}`}
              >
                <button
                  className="pipeline-header"
                  onClick={() => toggleSection(stage.key)}
                  aria-expanded={!collapsed[stage.key]}
                  aria-controls={`pipeline-content-${stage.key}`}
                >
                  <div className="pipeline-header-left">
                    <span className="pipeline-badge">{stage.num}</span>
                    <h3 className="pipeline-title">
                      {stage.title}
                    </h3>
                  </div>
                  <span className="pipeline-collapse-icon">
                    {collapsed[stage.key] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </span>
                </button>

                <div
                  className={`pipeline-content ${collapsed[stage.key] ? 'collapsed' : ''}`}
                  id={`pipeline-content-${stage.key}`}
                >
                  <div className="glass-card">
                    {stage.content}
                  </div>
                </div>
              </section>
            </React.Fragment>
          ))}
        </div>
      </main>

      <footer className="footer">
        <div className="app-container">
          <p>
            Open-source educational parser by{' '}
            <a
              href="https://github.com/rahuldangeofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Rahul Dange
            </a>{' '}
            · MIT License
          </p>
        </div>
      </footer>
    </>
  );
}
