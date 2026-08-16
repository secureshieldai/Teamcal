import React from 'react';
import { Text, View } from 'react-native';
import MarkdownIt from 'markdown-it';

// Standard Markdown (headings, bold, italic, strikethrough, lists, quote,
// link, code block) is already fully supported by react-native-markdown-display
// out of the box. Underline, highlight, text color, and alignment aren't
// standard Markdown, so they're added here as small custom inline rules using
// markdown-it's documented paired-token pattern (the same mechanism its own
// `emphasis` rule uses internally) — verified against the installed package's
// source: `tokensToAST` groups any `xxx_open`/`xxx_close` pair (nesting ±1)
// into one AST node named `xxx`, and token attrs propagate into `node.attributes`.

const COLOR_OPEN_RE = /^\{color:(#[0-9a-fA-F]{3,8})\}/;
const COLOR_CLOSE = '{/color}';
const ALIGN_LINE_RE = /^\{align:(left|center|right)\}$/;
const ALIGN_CLOSE_LINE = '{/align}';

// Pushes inner content as a single plain-text token rather than recursively calling
// state.md.inline.parse() into the shared state.tokens array: that recursive call runs
// markdown-it's own emphasis postProcess mid-scan, which mutates state.tokens by index and
// corrupts the outer scan's state.delimiters bookkeeping whenever the surrounding text also
// contains **bold**/_em_ markers — verified by reproducing the exact crash standalone
// ("Cannot set properties of undefined (setting 'type')" in emphasis.js postProcess).
function pairedMarkerRule(md: MarkdownIt, name: string, marker: string, tag: string) {
  md.inline.ruler.before('emphasis', name, (state, silent) => {
    if (state.src.slice(state.pos, state.pos + marker.length) !== marker) return false;
    const start = state.pos + marker.length;
    const end = state.src.indexOf(marker, start);
    if (end === -1) return false;
    if (!silent) {
      state.push(`${name}_open`, tag, 1);
      const textTok = state.push('text', '', 0);
      textTok.content = state.src.slice(start, end);
      state.push(`${name}_close`, tag, -1);
    }
    state.pos = end + marker.length;
    return true;
  });
}

function attributedMarkerRule(md: MarkdownIt, name: string, openRe: RegExp, closeMarker: string, tag: string, attrName: string) {
  md.inline.ruler.before('emphasis', name, (state, silent) => {
    const match = openRe.exec(state.src.slice(state.pos));
    if (!match) return false;
    const start = state.pos + match[0].length;
    const end = state.src.indexOf(closeMarker, start);
    if (end === -1) return false;
    if (!silent) {
      const openTok = state.push(`${name}_open`, tag, 1);
      openTok.attrSet(attrName, match[1]);
      const textTok = state.push('text', '', 0);
      textTok.content = state.src.slice(start, end);
      state.push(`${name}_close`, tag, -1);
    }
    state.pos = end + closeMarker.length;
    return true;
  });
}

// Alignment needs to be a block container (its own lines, like blockquote) rather than an
// inline span: React Native's <Text> only honors textAlign as a block-level layout property,
// and a Text nested inside a paragraph's parent Text (as all inline nodes are) never gets that
// block treatment, so an inline alignment marker parses fine but never visually centers.
function blockAlignRule(md: MarkdownIt) {
  md.block.ruler.before('paragraph', 'textalign', (state, startLine, endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(pos, max);
    const match = ALIGN_LINE_RE.exec(line.trim());
    if (!match) return false;
    let nextLine = startLine + 1;
    let closeLine = -1;
    while (nextLine < endLine) {
      const p = state.bMarks[nextLine] + state.tShift[nextLine];
      const mx = state.eMarks[nextLine];
      if (state.src.slice(p, mx).trim() === ALIGN_CLOSE_LINE) {
        closeLine = nextLine;
        break;
      }
      nextLine++;
    }
    if (closeLine === -1) return false;
    if (silent) return true;

    const openTok = state.push('textalign_open', 'div', 1);
    openTok.attrSet('data-align', match[1]);
    openTok.map = [startLine, closeLine];

    const oldParentType = state.parentType;
    const oldLineMax = state.lineMax;
    state.parentType = 'textalign' as unknown as typeof state.parentType;
    state.lineMax = closeLine;
    state.md.block.tokenize(state, startLine + 1, closeLine);
    state.parentType = oldParentType;
    state.lineMax = oldLineMax;

    state.push('textalign_close', 'div', -1);
    state.line = closeLine + 1;
    return true;
  });
}

function articlePlugins(md: MarkdownIt) {
  pairedMarkerRule(md, 'u', '++', 'u');
  pairedMarkerRule(md, 'mark', '==', 'mark');
  attributedMarkerRule(md, 'textcolor', COLOR_OPEN_RE, COLOR_CLOSE, 'span', 'data-color');
  blockAlignRule(md);
}

export const articleMarkdownIt = new MarkdownIt({ breaks: true }).use(articlePlugins);

export const TEXT_COLOR_SWATCHES = ['#E0554F', '#3E7BFA', '#2ED47A', '#E8A33D', '#7C5CFC'];

export const articleMarkdownRules = {
  u: (node: any, children: React.ReactNode) => (
    <Text key={node.key} style={{ textDecorationLine: 'underline' }}>{children}</Text>
  ),
  mark: (node: any, children: React.ReactNode) => (
    <Text key={node.key} style={{ backgroundColor: '#FFF3A0' }}>{children}</Text>
  ),
  textcolor: (node: any, children: React.ReactNode) => (
    <Text key={node.key} style={{ color: node.attributes['data-color'] }}>{children}</Text>
  ),
  textalign: (node: any, children: React.ReactNode) => {
    const align = node.attributes['data-align'];
    const alignItems = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
    return (
      <View key={node.key} style={{ alignItems, width: '100%' }}>
        {children}
      </View>
    );
  },
};

// react-native-markdown-display's default `paragraph` style hardcodes width:'100%', which
// silently defeats any ancestor's alignItems (e.g. our textalign wrapper): the paragraph View
// stretches to fill it regardless of what the parent asked for. Merge this into whatever
// `style` prop is passed to <Markdown> (the library does a per-key shallow merge, so this
// only touches `width` and leaves the paragraph's other default spacing untouched).
export const articleMarkdownStyle = { paragraph: { width: 'auto' as const } };

export function insertUnderline(text: string) { return `++${text}++`; }
export function insertHighlight(text: string) { return `==${text}==`; }
export function insertTextColor(text: string, hex: string) { return `{color:${hex}}${text}{/color}`; }
export function insertAlign(text: string, align: 'left' | 'center' | 'right') { return `{align:${align}}\n${text}\n{/align}`; }
