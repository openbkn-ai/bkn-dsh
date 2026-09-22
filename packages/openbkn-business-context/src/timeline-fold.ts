import type { ProvenanceTimelineNode } from './types.js'

/** Consecutive tool calls rendered as one row; presentation folds, data does not. */
export interface TimelineFoldGroup {
  readonly nodes: readonly ProvenanceTimelineNode[]
}

/**
 * Fold consecutive same-tool, same-outcome calls into one display group. Nodes
 * carrying `platform` facts never fold — a folded row cannot stand in for
 * several operation ids — and a fold group renders the first node's
 * timestamps. Pure presentation grouping on a client-safe leaf module: the
 * timeline data stays exhaustive.
 */
export function foldTimeline(nodes: readonly ProvenanceTimelineNode[]): readonly TimelineFoldGroup[] {
  const groups: TimelineFoldGroup[] = []
  for (const node of nodes) {
    const last = groups[groups.length - 1]
    const foldable = node.tool !== undefined && node.platform === undefined
    if (foldable && last !== undefined) {
      const candidate = last.nodes[last.nodes.length - 1]!
      if (candidate.tool === node.tool && candidate.outcome === node.outcome && candidate.platform === undefined) {
        groups[groups.length - 1] = { nodes: [...last.nodes, node] }
        continue
      }
    }
    groups.push({ nodes: [node] })
  }
  return groups
}
