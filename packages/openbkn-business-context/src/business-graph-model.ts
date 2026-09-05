import type {
  ProvenanceBusinessElement,
  ProvenanceBusinessOperation,
  ProvenanceContextRelation,
} from './types.js'

export interface BusinessGraphNode {
  readonly key: string
  readonly element: ProvenanceBusinessElement
  readonly operation: ProvenanceBusinessOperation
  readonly x: number
  readonly y: number
}

export interface BusinessGraphEdge {
  readonly id: string
  readonly name: string
  readonly sourceKey: string
  readonly targetKey: string
  readonly source: BusinessGraphNode
  readonly target: BusinessGraphNode
}

export interface BusinessGraphModel {
  readonly nodes: readonly BusinessGraphNode[]
  readonly edges: readonly BusinessGraphEdge[]
  /** Formal relations whose endpoints were not disclosed as resolved objects. */
  readonly unresolvedRelations: readonly ProvenanceContextRelation[]
  readonly width: number
  readonly height: number
}

const COLUMNS = 3
const NODE_WIDTH = 180
const NODE_HEIGHT = 86
const COLUMN_GAP = 80
const ROW_GAP = 48
const PADDING_X = 40
const PADDING_Y = 48

/**
 * Builds a deterministic display model from the Enterprise projection only.
 * Missing relation endpoints stay unresolved; the client never invents nodes.
 */
export function buildBusinessGraphModel(
  operations: readonly ProvenanceBusinessOperation[],
  relations: readonly ProvenanceContextRelation[],
): BusinessGraphModel {
  const seen = new Set<string>()
  const nodes: BusinessGraphNode[] = []
  for (const operation of operations) {
    for (const element of operation.elements) {
      const key = `${element.kind}:${element.id}`
      if (seen.has(key)) continue
      seen.add(key)
      const index = nodes.length
      nodes.push({
        key,
        element,
        operation,
        x: PADDING_X + (index % COLUMNS) * (NODE_WIDTH + COLUMN_GAP),
        y: PADDING_Y + Math.floor(index / COLUMNS) * (NODE_HEIGHT + ROW_GAP),
      })
    }
  }

  const objectNodes = new Map(nodes.filter(node => node.element.kind === 'object').map(node => [node.element.id, node]))
  const edges: BusinessGraphEdge[] = []
  const unresolvedRelations: ProvenanceContextRelation[] = []
  for (const relation of relations) {
    const source = objectNodes.get(relation.sourceObjectId)
    const target = objectNodes.get(relation.targetObjectId)
    if (source === undefined || target === undefined) {
      unresolvedRelations.push(relation)
      continue
    }
    edges.push({ id: relation.id, name: relation.name, sourceKey: source.key, targetKey: target.key, source, target })
  }

  const rows = Math.max(1, Math.ceil(nodes.length / COLUMNS))
  return {
    nodes,
    edges,
    unresolvedRelations,
    width: PADDING_X * 2 + COLUMNS * NODE_WIDTH + (COLUMNS - 1) * COLUMN_GAP,
    height: PADDING_Y * 2 + rows * NODE_HEIGHT + (rows - 1) * ROW_GAP,
  }
}

export const businessGraphGeometry = { nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT } as const
