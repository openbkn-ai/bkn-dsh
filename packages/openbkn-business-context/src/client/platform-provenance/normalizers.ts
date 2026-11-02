/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Adapted from OpenBKN Studio release/0.2.0 (90d3b92a).
 * See ../../../licenses/openbkn-studio.txt and README.md.
 */
/* Field mapping copied from platform business-provenance.service.ts. */
export function normalizeConversations(data: any, interactionId = ""): any {
  return {
    entries: (data.entries ?? []).map((entry: any) => ({
      conversationId: entry.conversation_id ?? "",
      agentName: entry.agent_name,
      questionPreview: entry.question_preview,
      previewUnavailable: data.partial === true || data.truncated === true,
      resultPreview: entry.result_preview,
      startedAt: entry.started_at,
      status: entry.status,
      interactionCount: entry.interaction_count,
      durationMs: entry.duration_ms,
      evidenceCompleteness: entry.evidence_completeness,
      currentRecordIntegrity: entry.current_record_integrity,
      recordIntegrityCheckFailed: entry.record_integrity_check_failed,
    })),
    total: data.total ?? 0,
    page: data.page,
    pageSize: data.page_size,
    partial: data.partial,
    truncated: data.truncated,
    partialReasons: data.partial_reasons ?? [],
  };
}

export function normalizeInteractions(data: any, interactionId = ""): any {
  return {
    entries: (data.entries ?? []).map((entry: any) => ({
      interactionId: entry.interaction_id ?? "",
      currentRecordIntegrity: entry.current_record_integrity,
      recordIntegrityCheckFailed: entry.record_integrity_check_failed,
      conversationId: entry.conversation_id,
      roundNumber: entry.round_number,
      questionPreview: entry.question_preview,
      previewUnavailable: data.partial === true || data.truncated === true,
      resultPreview: entry.result_preview,
      startedAt: entry.started_at,
      status: entry.status,
      durationMs: entry.duration_ms,
    })),
    total: data.total ?? 0,
    page: data.page,
    pageSize: data.page_size,
    partial: data.partial,
    truncated: data.truncated,
    partialReasons: data.partial_reasons ?? [],
  };
}

export function normalizeInteraction(data: any, interactionId = ""): any {
return {
    timeRail: data.time_rail,
    currentRecordIntegrity: data.current_record_integrity,
    recordIntegrityCheckFailed: data.record_integrity_check_failed,
    interactionId: data.interaction_id ?? interactionId,
    interactionQuestion: data.interaction_question,
    interactionResult: data.interaction_result,
    conversationContext: (data.conversation_context ?? []).map((context: any) => ({
      knowledgeNetworkId: context.knowledge_network_id ?? "",
      sourceInteractionId: context.source_interaction_id ?? "",
      sourceOperationId: context.source_operation_id ?? "",
    })),
    derivedFacts: (data.derived_facts ?? []).map((fact: any) => ({
      rule: fact.rule ?? "",
      sourceOperationId: fact.source_operation_id ?? "",
      operationId: fact.operation_id ?? "",
      elementId: fact.element_id ?? "",
    })),
    contextRelations: (data.context_relations ?? []).map((relation: any) => ({
      knowledgeNetworkId: relation.knowledge_network_id ?? "",
      id: relation.id ?? "",
      name: relation.name,
      sourceObjectId: relation.source_object_id ?? "",
      targetObjectId: relation.target_object_id ?? "",
    })),
    operations: (data.operations ?? []).map((operation: any) => ({
      operationId: operation.operation_id ?? "",
      attempt: operation.attempt,
      toolName: operation.tool_name,
      knowledgeNetworkId: operation.knowledge_network_id,
      status: operation.status,
      callStatus: operation.call_status,
      protocol: operation.protocol,
      startedAt: operation.started_at,
      finishedAt: operation.finished_at,
      durationMs: operation.duration_ms,
      input: operation.input,
      output: operation.output,
      error: operation.error,
      query: operation.query
        ? {
            sql: operation.query.sql,
            resourceIds: operation.query.resource_ids,
            resources: operation.query.resources?.map((resource: any) => ({
              id: resource.id ?? "",
              name: resource.name,
              objectId: resource.object_id,
              objectName: resource.object_name,
            })),
            conditions: operation.query.conditions,
            resultCount: operation.query.result_count,
          }
        : undefined,
      objects: (operation.objects ?? []).map((object: any) => ({
        id: object.id ?? "",
        name: object.name,
      })),
      elements: (operation.elements ?? []).map((element: any) => ({
        kind: element.kind ?? "",
        id: element.id ?? "",
        name: element.name,
        parentId: element.parent_id,
        field: element.field,
      })),
      missingFacts: operation.missing_facts ?? [],
    })),
  };
}

export function normalizeHistory(data: any, interactionId = ""): any {
  return (data.entries ?? []).map((entry: any) => ({
    analysisId: entry.analysis_id ?? "",
    interactionId: entry.interaction_id ?? interactionId,
    agentId: entry.agent_id ?? "",
    status: entry.status === "completed" || entry.status === "failed" ? entry.status : "running",
    result: entry.result,
    failureCode: entry.failure_code,
    failureMessage: entry.failure_message,
    startedAt: entry.started_at ?? "",
    finishedAt: entry.finished_at,
  }));
}
