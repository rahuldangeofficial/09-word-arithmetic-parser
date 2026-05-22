/**
 * @fileoverview English Word Arithmetic Parser - AST Generator & Recursive Descent Evaluator
 *
 * This parser parses arithmetic expressions written with English operator words
 * into an Abstract Syntax Tree (AST) and then evaluates the AST, recording intermediate steps.
 *
 * @module ArithmeticParser
 */

import { Tokenizer } from './tokenizer.js';
import { OPERATORS, TOKEN_TYPES } from './grammar.js';

/**
 * @typedef {Object} EvaluationStep
 * @property {string} nodeId    - Unique ID of the AST node where the step happened.
 * @property {string} operation - String representation of the math operation (e.g. '10 + 2').
 * @property {number} result    - The intermediate evaluated result.
 */

/**
 * A parser that generates an AST and evaluates it to support step-by-step
 * BODMAS visualization.
 */
export class ArithmeticParser {
  /**
   * Creates a new parser instance for the given expression.
   * @param {string} input - An arithmetic expression string.
   * @throws {TypeError} If input is not a string.
   */
  constructor(input) {
    if (typeof input !== 'string') {
      throw new TypeError(
        `ArithmeticParser expected a string, received ${typeof input}.`
      );
    }

    this.input = input;
    this._tokens = null;
    this._pos = 0;
    this._steps = [];
    this._result = null;
    this._ast = null;
    this._nodeIdCounter = 0;
  }

  /**
   * Parses the expression, constructs the AST, and returns the numeric result.
   * @returns {number} The evaluated result.
   */
  parse() {
    if (this._result !== null) {
      return this._result;
    }

    this._ensureTokenized();
    this._pos = 0;
    this._steps = [];
    this._nodeIdCounter = 0;

    if (this._tokens.length === 0) {
      throw new SyntaxError('Empty expression; nothing to evaluate.');
    }

    // Parse into AST
    this._ast = this._expr();

    if (this._pos < this._tokens.length) {
      const leftover = this._tokens[this._pos];
      throw new SyntaxError(
        `Unexpected token '${leftover.value}' at position ${leftover.position}: expected end of expression.`
      );
    }

    // Evaluate the AST and record steps
    this._result = this._evaluateAST(this._ast);
    return this._result;
  }

  /**
   * Returns the token array.
   * @returns {import('./tokenizer.js').Token[]} The token list.
   */
  getTokens() {
    this._ensureTokenized();
    return [...this._tokens];
  }

  /**
   * Returns the evaluation steps.
   * @returns {EvaluationStep[]}
   */
  getSteps() {
    if (this._result === null) {
      this.parse();
    }
    return [...this._steps];
  }

  /**
   * Returns the parsed Abstract Syntax Tree (AST).
   * @returns {Object|null} The root node of the AST.
   */
  getAST() {
    if (this._ast === null) {
      this.parse();
    }
    return this._ast;
  }

  // ───────────────────────────────────────────────────────────
  //  Recursive Descent Parser Rules (AST Building)
  // ───────────────────────────────────────────────────────────

  /**
   * expr → term ( (plus | minus) term )*
   * @private
   */
  _expr() {
    let left = this._term();

    while (this._pos < this._tokens.length) {
      const token = this._tokens[this._pos];

      if (
        token.type !== TOKEN_TYPES.OPERATOR ||
        OPERATORS[token.value].precedence !== 1
      ) {
        break;
      }

      const operator = token.value;
      this._pos++; // consume operator

      const right = this._term();
      left = {
        id: `node-${this._nodeIdCounter++}`,
        type: 'BINARY_EXPR',
        operator,
        left,
        right,
        evaluatedValue: null
      };
    }

    return left;
  }

  /**
   * term → factor ( (multiply | divide) factor )*
   * @private
   */
  _term() {
    let left = this._factor();

    while (this._pos < this._tokens.length) {
      const token = this._tokens[this._pos];

      if (
        token.type !== TOKEN_TYPES.OPERATOR ||
        OPERATORS[token.value].precedence !== 2
      ) {
        break;
      }

      const operator = token.value;
      this._pos++; // consume operator

      const right = this._factor();
      left = {
        id: `node-${this._nodeIdCounter++}`,
        type: 'BINARY_EXPR',
        operator,
        left,
        right,
        evaluatedValue: null
      };
    }

    return left;
  }

  /**
   * factor → NUMBER | '(' expr ')'
   * @private
   */
  _factor() {
    if (this._pos >= this._tokens.length) {
      throw new SyntaxError(
        'Unexpected end of expression: expected a number or "(".'
      );
    }

    const token = this._tokens[this._pos];

    if (token.type === TOKEN_TYPES.LPAREN) {
      this._pos++; // consume '('
      const exprNode = this._expr();

      if (
        this._pos >= this._tokens.length ||
        this._tokens[this._pos].type !== TOKEN_TYPES.RPAREN
      ) {
        throw new SyntaxError(
          `Mismatched parenthesis: expected ')' to match '(' at position ${token.position}.`
        );
      }

      this._pos++; // consume ')'
      return {
        id: `node-${this._nodeIdCounter++}`,
        type: 'GROUPING',
        expression: exprNode,
        evaluatedValue: null
      };
    }

    if (token.type === TOKEN_TYPES.NUMBER) {
      this._pos++; // consume number
      return {
        id: `node-${this._nodeIdCounter++}`,
        type: 'NUMBER',
        value: token.value,
        evaluatedValue: token.value
      };
    }

    throw new SyntaxError(
      `Unexpected token '${token.value}' (${token.type}) at position ${token.position}: expected a number or '('.`
    );
  }

  // ───────────────────────────────────────────────────────────
  //  AST Evaluator (with stepping trace)
  // ───────────────────────────────────────────────────────────

  /**
   * Evaluates the AST recursively and populates the evaluation steps.
   * @param {Object} node - The AST Node to evaluate.
   * @returns {number} The numeric result.
   * @private
   */
  _evaluateAST(node) {
    if (!node) return 0;

    if (node.type === 'NUMBER') {
      node.evaluatedValue = node.value;
      return node.value;
    }

    if (node.type === 'GROUPING') {
      const val = this._evaluateAST(node.expression);
      node.evaluatedValue = val;
      return val;
    }

    if (node.type === 'BINARY_EXPR') {
      const leftVal = this._evaluateAST(node.left);
      const rightVal = this._evaluateAST(node.right);
      const operatorMeta = OPERATORS[node.operator];

      if (operatorMeta.type === 'DIVISION' && rightVal === 0) {
        throw new RangeError(
          `Division by zero: ${leftVal} ${operatorMeta.symbol} 0.`
        );
      }

      const result = operatorMeta.evaluate(leftVal, rightVal);
      node.evaluatedValue = result;

      this._steps.push({
        nodeId: node.id,
        operation: `${leftVal} ${operatorMeta.symbol} ${rightVal}`,
        result: result
      });

      return result;
    }

    return 0;
  }

  /**
   * Ensures the input has been tokenized.
   * @private
   */
  _ensureTokenized() {
    if (this._tokens === null) {
      const tokenizer = new Tokenizer(this.input);
      this._tokens = tokenizer.tokenize();
    }
  }
}
