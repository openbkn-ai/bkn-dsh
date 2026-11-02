/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

function writeTextWithSelectionFallback(text: string, ownedContainer?: HTMLElement | null): void {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    throw new Error("Clipboard API is unavailable");
  }

  if (!ownedContainer?.isConnected) throw new Error("Owned clipboard container is unavailable");

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  textarea.style.opacity = "0";

  const activeElement =
    typeof HTMLElement !== "undefined" && document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection();
  const selectedRanges =
    selection === null
      ? []
      : Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index));

  ownedContainer.appendChild(textarea);
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command was rejected");
    }
  } finally {
    textarea.remove();
    selection?.removeAllRanges();
    selectedRanges.forEach((range) => selection?.addRange(range));
    activeElement?.focus();
  }
}

export async function writePlatformTextToClipboard(text: string, ownedContainer?: HTMLElement | null): Promise<void> {
  if (typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // In a non-secure HTTP context the Clipboard API may exist but reject.
    }
  }

  writeTextWithSelectionFallback(text, ownedContainer);
}
