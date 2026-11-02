/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { useEffect, useRef, useState } from "react";
import { Alert, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../format.js";
import { EvidenceChainPanels } from "./EvidenceChainPanels.js";
import { BusinessProvenance016 } from "./BusinessProvenance016.js";
import type { CurrentExplanation } from "./current-explanation.service.js";
import { usePlatformProvenanceAdapter } from "../adapter.js";
import styles from "./CurrentExplanationPanel.styles.js";

type ExplanationPanel = "timeline" | "evidence" | "execution";

export function CurrentExplanationPanel<TPanel extends ExplanationPanel = "timeline" | "evidence">({
  interactionId,
  panel,
  onPanelChange,
}: {
  interactionId: string;
  panel?: TPanel;
  onPanelChange?: (panel: TPanel) => void;
}) {
  const { t } = useTranslation();
  const {readExplanation:readCurrentExplanation,generateExplanation:generateCurrentExplanation} = usePlatformProvenanceAdapter();
  const abort = useRef<AbortController | undefined>(undefined);
  const [value, setValue] = useState<CurrentExplanation>();
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [readAttempt, setReadAttempt] = useState(0);
  const request = useRef<symbol | undefined>(undefined);
  useEffect(() => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const token = Symbol();
    request.current = token;
    setValue(undefined);
    setBusy(true);
    setFailed(false);
    void readCurrentExplanation(interactionId,controller.signal)
      .then((result) => {
        if (request.current === token) setValue(result);
      })
      .catch(() => {
        if (request.current === token) setFailed(true);
      })
      .finally(() => {
        if (request.current === token) setBusy(false);
      });
    return () => {
      request.current = undefined;
      abort.current?.abort();
    };
  }, [interactionId, readAttempt, readCurrentExplanation]);
  const generate = async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const token = Symbol();
    request.current = token;
    setBusy(true);
    setFailed(false);
    try {
      const result = await generateCurrentExplanation(interactionId,controller.signal);
      if (request.current === token) setValue(result);
    } catch {
      if (request.current === token) setFailed(true);
    } finally {
      if (request.current === token) setBusy(false);
    }
  };
  return (
    <section className={styles.shell}>
      <header className={styles.metaBar}>
        <div>
          <p>{t("bknTrace.evidenceChain.current.basis")}</p>
          {value?.generatedAt && (
            <small>
              {t("bknTrace.evidenceChain.current.generatedAt", {
                time: formatDateTime(value.generatedAt),
              })}
            </small>
          )}
        </div>
        <button
          type="button"
          className={styles.metaAction}
          disabled={busy}
          onClick={() =>
            failed && !value ? setReadAttempt((attempt) => attempt + 1) : void generate()
          }
        >
          {t(
            failed && !value
              ? "bknTrace.evidenceChain.current.retryRead"
              : value?.view
                ? "bknTrace.evidenceChain.current.refresh"
                : "bknTrace.evidenceChain.current.generate",
          )}
        </button>
      </header>
      {busy && <Spin />}
      {failed && (
        <Alert
          type="error"
          showIcon
          message={t(
            failed && !value
              ? "bknTrace.evidenceChain.current.readFailed"
              : "bknTrace.evidenceChain.current.failed",
          )}
        />
      )}
      {!busy && !failed && value?.status === "not_generated" && (
        <p>{t("bknTrace.evidenceChain.current.empty")}</p>
      )}
      {!!value?.view?.questionPairs?.length && !!value.view.notices?.length && (
        <div>
          <Alert type="warning" showIcon message={value.view.notices.find((notice) => notice.includes("原始调用记录仍有")) ?? value.view.notices[0]} />
          <details>
            <summary>{t("bknTrace.evidenceChain.current.recordScope")}</summary>
            {value.view.notices.map((notice, index) => <p key={index}>{notice}</p>)}
          </details>
        </div>
      )}
      {value?.view &&
        (value.view.questionPairs?.length ? (
          <BusinessProvenance016
            key={`${interactionId}:${value.generatedAt ?? ""}`}
            view={value.view}
            panel={panel === "timeline" ? "timeline" : "evidence"}
            evidenceOnly={panel === "evidence"}
            onPanelChange={
              panel === "timeline" && onPanelChange
                ? (next) => onPanelChange(next as TPanel)
                : undefined
            }
          />
        ) : (
          <EvidenceChainPanels
            key={`${interactionId}:${value.generatedAt ?? ""}`}
            view={value.view}
            initialPanel={panel === "execution" ? "execution" : "evidence"}
            panel={panel === "execution" ? "execution" : "evidence"}
            onPanelChange={(next) => onPanelChange?.(next as TPanel)}
          />
        ))}
    </section>
  );
}
