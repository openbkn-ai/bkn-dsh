/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Adapted from OpenBKN Studio release/0.2.0 (90d3b92a).
 * See ../../../licenses/openbkn-studio.txt and README.md.
 */
import type { TimeRailItem } from "../evidence-chain/evidence-chain.types.js";
export class BusinessProvenanceAnalysisError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "BusinessProvenanceAnalysisError";
  }
}

export type RecordIntegrity = {
  status: "complete" | "missing";
  checked_at: string;
  scope: "registered_call_records";
  missing: Array<{
    operation_id: string;
    attempt: number;
    tool_name?: string;
    reason: "call_outcome_missing" | "record_content_missing" | "business_target_missing";
    field: string;
  }>;
};

export type BusinessProvenanceQuery = {
  recordIntegrity?: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  agentOrApp?: string;
  knowledgeNetwork?: string;
  evidenceCompleteness?: string;
  conversationId?: string;
};

export type BusinessProvenanceConversation = {
  currentRecordIntegrity?: RecordIntegrity;
  recordIntegrityCheckFailed?: boolean;
  conversationId: string;
  agentName?: string;
  questionPreview?: string;
  /** The list query did not finish reading all preview evidence. */
  previewUnavailable?: boolean;
  resultPreview?: string;
  startedAt?: string;
  status?: string;
  interactionCount?: number;
  durationMs?: number;
  evidenceCompleteness?: string;
};

export type BusinessProvenanceInteractionListItem = {
  currentRecordIntegrity?: RecordIntegrity;
  recordIntegrityCheckFailed?: boolean;
  interactionId: string;
  conversationId?: string;
  /** Chronological position within the conversation; the API list is newest first. */
  roundNumber?: number;
  questionPreview?: string;
  /** The list query did not finish reading all preview evidence. */
  previewUnavailable?: boolean;
  resultPreview?: string;
  startedAt?: string;
  status?: string;
  durationMs?: number;
};

export type BusinessProvenancePage<T> = {
  partial?: boolean;
  truncated?: boolean;
  partialReasons?: string[];
  entries: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

export type BusinessProvenanceAnalysisHistory = {
  analysisId: string;
  interactionId: string;
  agentId: string;
  status: "running" | "completed" | "failed";
  result?: Record<string, unknown>;
  failureCode?: string;
  failureMessage?: string;
  startedAt: string;
  finishedAt?: string;
};

export type OperationResolution = {
  operationId: string;
  attempt?: number;
  toolName?: string;
  knowledgeNetworkId?: string;
  status?: "resolved" | "ambiguous" | "unresolved" | "not_evaluable";
  callStatus?: string;
  protocol?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  error?: unknown;
  query?: {
    sql?: string;
    resourceIds?: string[];
    resources?: Array<{ id: string; name?: string; objectId?: string; objectName?: string }>;
    conditions?: unknown;
    resultCount?: number;
  };
  objects?: Array<{ id: string; name?: string }>;
  elements: Array<{ kind: string; id: string; name?: string; parentId?: string; field?: string }>;
  missingFacts: string[];
};

export type BusinessProvenanceDerivedFact = {
  rule: string;
  sourceOperationId: string;
  operationId: string;
  elementId: string;
};

export type BusinessProvenanceInteraction = {
  currentRecordIntegrity?: RecordIntegrity;
  recordIntegrityCheckFailed?: boolean;
  timeRail?: TimeRailItem[];
  interactionId: string;
  interactionQuestion?: string;
  interactionResult?: string;
  operations: OperationResolution[];
  conversationContext: Array<{
    knowledgeNetworkId: string;
    sourceInteractionId: string;
    sourceOperationId: string;
  }>;
  derivedFacts: BusinessProvenanceDerivedFact[];
  contextRelations: Array<{
    knowledgeNetworkId: string;
    id: string;
    name?: string;
    sourceObjectId: string;
    targetObjectId: string;
  }>;
};
