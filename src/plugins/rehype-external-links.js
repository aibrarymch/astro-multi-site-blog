import { visit } from 'unist-util-visit';

const DEFAULT_MARK = ' ⧉';

export default function rehypeExternalLinks(options = {}) {
  const { site, mark = DEFAULT_MARK } = options;
  const siteOrigin = getOrigin(site);

  return function transformer(tree) {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;

      const href = node.properties?.href;
      if (typeof href !== 'string' || href.length === 0) return;
      if (!isExternalLink(href, siteOrigin)) return;

      node.properties = { ...node.properties };
      node.properties.target = '_blank';
      node.properties.rel = buildRel(node.properties.rel);

      if (mark) {
        appendMark(node, mark);
      }
    });
  };
}

function getOrigin(site) {
  if (!site) return null;
  try {
    return new URL(site).origin;
  } catch (error) {
    return null;
  }
}

function isExternalLink(href, siteOrigin) {
  if (href.startsWith('#')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) return false;
  if (!/^[a-zA-Z][a-zA-Z+.-]*:/.test(href) && !href.startsWith('//')) {
    return false;
  }

  try {
    const base = siteOrigin ?? 'http://localhost';
    const url = new URL(href, base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    if (siteOrigin && url.origin === siteOrigin) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

function buildRel(rel) {
  const values = new Set(['noopener', 'noreferrer']);

  if (Array.isArray(rel)) {
    for (const value of rel) {
      if (typeof value === 'string' && value.trim()) {
        values.add(value);
      }
    }
  } else if (typeof rel === 'string') {
    for (const value of rel.split(/\s+/)) {
      if (value) values.add(value);
    }
  }

  return Array.from(values);
}

function appendMark(node, mark) {
  const markText = typeof mark === 'string' ? mark.trim() : DEFAULT_MARK.trim();
  if (!markText) return;

  const children = node.children || (node.children = []);

  const hasMark = children.some(
    (child) =>
      child.type === 'element' &&
      child.tagName === 'span' &&
      child.properties?.className?.includes('external-link-mark')
  );
  if (hasMark) return;

  children.push({
    type: 'element',
    tagName: 'span',
    properties: { className: ['external-link-mark'], ariaHidden: 'true' },
    children: [{ type: 'text', value: '\u2009' + markText }],
  });
}
