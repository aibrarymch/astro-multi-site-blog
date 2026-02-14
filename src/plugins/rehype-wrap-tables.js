import { visit } from 'unist-util-visit';

export default function rehypeWrapTables() {
  return function transformer(tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (node.tagName !== 'table') return;

      const className = parent.properties?.className;
      const alreadyWrapped = Array.isArray(className) && className.includes('table-wrapper');
      if (alreadyWrapped) return;

      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-wrapper']
        },
        children: [node]
      };

      parent.children[index] = wrapper;
    });
  };
}
