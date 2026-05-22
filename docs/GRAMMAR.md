# Formal Grammar Specification

> Grammar specification for the Word Arithmetic Parser: a recursive descent parser for arithmetic expressions written with English operator words.

## Overview

The Word Arithmetic Parser accepts arithmetic expressions where operators are written as English words. The grammar is designed to enforce **BODMAS** (Bracket, Order, Division, Multiplication, Addition, Subtraction) operator precedence through its hierarchical structure.

## EBNF Grammar

```ebnf
Expression  ::= Term ( ( 'plus' | 'minus' ) Term )*
Term        ::= Factor ( ( 'multiply' | 'divide' ) Factor )*
Factor      ::= Number | '(' Expression ')'
Number      ::= Digit+ ( '.' Digit+ )?
Digit       ::= '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
```

### Notation

| Symbol | Meaning |
|--------|---------|
| `::=` | Is defined as |
| `\|` | Alternative (or) |
| `( ... )*` | Zero or more repetitions |
| `( ... )?` | Optional (zero or one) |
| `'...'` | Terminal (literal string) |

## Operator Precedence

Precedence is enforced through the grammar hierarchy. Higher-precedence operators are parsed deeper in the recursion tree.

| Priority | Operators | English Word | Associativity | Grammar Rule |
|----------|-----------|--------------|---------------|-------------|
| 1 (highest) | `( )` | brackets | N/A | `Factor` |
| 2 | `×` `÷` | multiply, divide | Left-to-right | `Term` |
| 3 (lowest) | `+` `-` | plus, minus | Left-to-right | `Expression` |

### Why This Works

- `Expression` handles `plus` and `minus` (lowest precedence)
- `Expression` calls `Term` for its operands
- `Term` handles `multiply` and `divide` (higher precedence)
- `Term` calls `Factor` for its operands
- `Factor` handles numbers and parenthesized sub-expressions (highest precedence)

This means multiplication and division are **always evaluated before** addition and subtraction, because they are resolved deeper in the call stack.

## Token Definitions

The tokenizer processes the input character stream and converts it into structured tokens (case-insensitive for operator words):

| Operator Word | Standard Symbol | Token Type | Operation |
|---------------|-----------------|------------|-----------|
| plus | `+` | `OPERATOR` | Addition |
| minus | `-` | `OPERATOR` | Subtraction |
| multiply | `×` | `OPERATOR` | Multiplication |
| divide | `÷` | `OPERATOR` | Division |
| `(` | `(` | `LPAREN` | Open parenthesis |
| `)` | `)` | `RPAREN` | Close parenthesis |
| numbers, `.` | numbers, `.` | `NUMBER` | Numeric literal |

Whitespace is consumed and skipped during the tokenization scan.

## Parse Tree Example

### Input: `10 plus 2 multiply 3`

**Step 1: Tokenization**

```
"10 plus 2 multiply 3"
  → tokens → [NUMBER(10), OPERATOR(plus), NUMBER(2), OPERATOR(multiply), NUMBER(3)]
```

**Step 2: Parse Tree**

```
         Expression
             │
       ┌─────┼─────┐
       │     │     │
     Term  'plus' Term
       │           │
    Factor    ┌────┼────┐
       │      │    │    │
     Number Factor 'multiply' Factor
       │      │                  │
      10    Number             Number
              │                  │
              2                  3
```

**Step 3: Evaluation (bottom-up)**

```
1. Factor → Number → 10
2. Factor → Number → 2
3. Factor → Number → 3
4. Term: 2 multiply 3 = 2 × 3 = 6       ← multiplication first (higher precedence)
5. Term: 10 (just a single Factor)
6. Expression: 10 plus 6 = 10 + 6 = 16  ← addition second (lower precedence)
```

**Result: `16`**

## Edge Cases

| Input | Behavior |
|-------|----------|
| `42` | Single number → returns `42` |
| `(10 plus 5)` | Parenthesized expression → returns `15` |
| `10.5 plus 2.5` | Decimal numbers → returns `13` |
| `10plus5` | No whitespace → returns `15` (whitespace is optional) |
| `10 PLUS 5` | Case insensitivity → returns `15` |
| `` (empty) | Throws SyntaxError |

## Relation to Standard Arithmetic

| Standard | English Word Equivalent |
|----------|-------------------|
| `10 + 2 * 3 - 4 / 2` | `10 plus 2 multiply 3 minus 4 divide 2` |
| `10.5 + 2 * (3 - 4) / 2.5` | `10.5 plus 2 multiply (3 minus 4) divide 2.5` |
| `16 - (8 + 14) / 2` | `16 minus (8 plus 14) divide 2` |
