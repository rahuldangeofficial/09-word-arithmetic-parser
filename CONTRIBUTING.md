# Contributing to Word Arithmetic Parser

Thank you for your interest in contributing! Whether you're fixing a bug, adding a feature, or improving documentation, every contribution is appreciated.

## Getting Started

To get set up locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/rahuldangeofficial/09-word-arithmetic-parser.git
   cd 09-word-arithmetic-parser
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Start the dev server:
   ```bash
   yarn dev
   ```
This will automatically launch the Vite dev server and open the app in your default browser at `http://localhost:8765`.

## Code Style

Please follow these conventions to keep the codebase consistent:

- **ES Modules & React**: use JSX, hooks, and clean components.
- **2-space indentation**: configured via `.editorconfig`.
- **Descriptive names**: prefer `operatorToken` over `op`.
- **No `eval()`**: the parser is intentionally built without it.
- **Prop types or clear JSDocs**: describe component states and helpers.

## Running Tests

To run the console-based tests using Node.js:
```bash
yarn test
```

### Adding Tests

When adding new parser features or operator mappings, please add corresponding test cases to `examples/examples.js`:
1. Find the `TEST_CASES` array definition in `examples/examples.js`.
2. Add your test case array: `['expression', expectedResult, 'Description of test case']`.
3. Verify that all existing and new tests pass.

## Pull Request Process

1. **Fork** the repository
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** with clear, atomic commits
4. **Run the test suite**: all tests must pass
5. **Submit a Pull Request** with:
   - A clear title describing the change
   - A description of what was changed and why
   - Screenshots/GIFs if the change is visual

## Reporting Bugs

Found a bug? Please [open a GitHub issue](https://github.com/rahuldangeofficial/09-word-arithmetic-parser/issues/new) with:

- A clear, descriptive title
- Steps to reproduce the bug
- The expected behavior vs. actual behavior
- The input expression that caused the issue
- Your browser and OS version
