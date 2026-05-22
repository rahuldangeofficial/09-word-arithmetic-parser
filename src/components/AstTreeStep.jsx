import React, { useRef, useEffect, useState } from 'react';
import { ArithmeticParser } from '../parser/ArithmeticParser.js';

export default function AstTreeStep({ input, activeNodeId = null }) {
  const [treeData, setTreeData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 380 });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!input) {
      setTreeData({ nodes: [], links: [] });
      return;
    }

    try {
      const parser = new ArithmeticParser(input);
      const ast = parser.getAST();
      if (!ast) return;

      const nodes = [];
      const links = [];

      // Recursive layout builder
      function traverse(currentNode, depth = 0, x = 400, width = 160) {
        if (!currentNode) return;

        const currentX = x;
        const currentY = 50 + depth * 85;

        nodes.push({
          id: currentNode.id,
          type: currentNode.type,
          label:
            currentNode.type === 'NUMBER'
              ? String(currentNode.value)
              : currentNode.type === 'GROUPING'
              ? '( )'
              : currentNode.operator,
          x: currentX,
          y: currentY,
          evaluatedValue: currentNode.evaluatedValue,
          node: currentNode
        });

        const nextOffset = Math.max(width / 1.7, 45); // reduce spacing at deeper levels

        if (currentNode.type === 'BINARY_EXPR') {
          const leftX = currentX - width;
          const leftY = currentY + 85;
          links.push({
            id: `${currentNode.id}-${currentNode.left.id}`,
            fromX: currentX,
            fromY: currentY,
            toX: leftX,
            toY: leftY,
            parentId: currentNode.id,
            childId: currentNode.left.id
          });
          traverse(currentNode.left, depth + 1, leftX, nextOffset);

          const rightX = currentX + width;
          const rightY = currentY + 85;
          links.push({
            id: `${currentNode.id}-${currentNode.right.id}`,
            fromX: currentX,
            fromY: currentY,
            toX: rightX,
            toY: rightY,
            parentId: currentNode.id,
            childId: currentNode.right.id
          });
          traverse(currentNode.right, depth + 1, rightX, nextOffset);
        } else if (currentNode.type === 'GROUPING') {
          const childX = currentX;
          const childY = currentY + 85;
          links.push({
            id: `${currentNode.id}-${currentNode.expression.id}`,
            fromX: currentX,
            fromY: currentY,
            toX: childX,
            toY: childY,
            parentId: currentNode.id,
            childId: currentNode.expression.id
          });
          traverse(currentNode.expression, depth + 1, childX, nextOffset);
        }
      }

      // Calculate width offsets based on expression length
      const initialWidth = Math.min(220, Math.max(120, input.length * 6));
      traverse(ast, 0, 400, initialWidth);

      // Find bounds to auto-resize canvas if needed
      let minX = 400;
      let maxX = 400;
      let maxY = 150;

      nodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y > maxY) maxY = n.y;
      });

      const padding = 60;
      const totalWidth = maxX - minX + padding * 2;
      const totalHeight = maxY + padding;

      // Adjust coordinates to be centered inside computed canvas
      const xOffset = 400 - (minX + maxX) / 2;
      const adjustedNodes = nodes.map(n => ({
        ...n,
        x: n.x + xOffset
      }));
      const adjustedLinks = links.map(l => ({
        ...l,
        fromX: l.fromX + xOffset,
        toX: l.toX + xOffset
      }));

      setTreeData({ nodes: adjustedNodes, links: adjustedLinks });
      setDimensions({
        width: Math.max(800, totalWidth),
        height: Math.max(380, totalHeight)
      });
    } catch (e) {
      console.error('Error generating AST tree visualization:', e);
    }
  }, [input]);

  // Auto-scroll to center active nodes
  useEffect(() => {
    if (activeNodeId && canvasRef.current) {
      const activeNode = treeData.nodes.find(n => n.id === activeNodeId);
      if (activeNode) {
        const container = canvasRef.current;
        const scrollX = activeNode.x - container.clientWidth / 2;
        const scrollY = activeNode.y - container.clientHeight / 2;
        container.scrollTo({
          left: scrollX,
          top: scrollY,
          behavior: 'smooth'
        });
      }
    }
  }, [activeNodeId, treeData]);

  if (!input) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Enter a word arithmetic expression above to see its parsed tree structure.
      </div>
    );
  }

  return (
    <div className="ast-visualizer-container">
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className="preset-title" style={{ fontSize: '0.78rem', margin: 0 }}>
            Abstract Syntax Tree
          </p>
          <span className="scroll-hint-badge">Scroll to explore</span>
        </div>
        <div className="ast-canvas" ref={canvasRef}>
          <div
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              position: 'relative'
            }}
          >
            {/* SVG Link lines between nodes */}
            <svg className="ast-svg-overlay">
              {treeData.links.map(link => {
                const isActive = link.parentId === activeNodeId;
                const midY = (link.fromY + link.toY) / 2;
                return (
                  <path
                    key={link.id}
                    d={`M ${link.fromX} ${link.fromY} C ${link.fromX} ${midY}, ${link.toX} ${midY}, ${link.toX} ${link.toY}`}
                    className={`ast-svg-line ${isActive ? 'active' : ''}`}
                  />
                );
              })}
            </svg>

            {/* AST HTML Nodes */}
            <div className="ast-nodes-layer">
              {treeData.nodes.map(node => {
                const isActive = node.id === activeNodeId;
                let circleClass = 'ast-node-circle-number';
                if (node.type === 'BINARY_EXPR') circleClass = 'ast-node-circle-binary';
                if (node.type === 'GROUPING') circleClass = 'ast-node-circle-grouping';

                return (
                  <div
                    key={node.id}
                    className={`ast-node-circle ${circleClass} ${isActive ? 'active' : ''}`}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      color: isActive ? '#fff' : undefined,
                      borderColor: isActive ? 'var(--primary-start)' : undefined
                    }}
                  >
                    {node.label}
                    <div className="ast-node-tooltip">
                      Type: {node.type}
                      {node.evaluatedValue !== undefined && node.evaluatedValue !== null && (
                        <span> | Value: {node.evaluatedValue}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="ast-guide-box" style={{ width: '100%' }}>
        <div className="ast-guide-header">
          <span className="ast-guide-dot"></span>
          <span>Understanding the AST Structure</span>
        </div>
        <div className="ast-guide-content">
          <p>
            The recursive descent parser structures tokens into a hierarchy based on operator precedence (BODMAS rules).
          </p>
          <div className="ast-guide-grid">
            <div className="ast-guide-item">
              <span className="ast-guide-badge ast-badge-high">High Priority</span>
              <p>
                Operators like <code>multiply</code> and <code>divide</code>, as well as bracketed sub-expressions <code>( )</code>, sit deeper in the tree structure so they evaluate first.
              </p>
            </div>
            <div className="ast-guide-item">
              <span className="ast-guide-badge ast-badge-low">Low Priority</span>
              <p>
                Operators like <code>plus</code> and <code>minus</code> remain closer to the root of the tree, ensuring they resolve after their sub-expressions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
