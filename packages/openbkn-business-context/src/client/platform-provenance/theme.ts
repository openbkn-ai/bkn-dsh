/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Adapted from OpenBKN Studio release/0.2.0 (90d3b92a).
 * See ../../../licenses/openbkn-studio.txt and README.md.
 */
import type { ThemeConfig } from "antd";
export const platformTheme: ThemeConfig = {
    token: {
      colorPrimary: "#1e3a8a",
      borderRadius: 0,
      colorBgLayout: "#f6f8fb",
      colorBgContainer: "#ffffff",
      colorBorder: "#e5eaf2",
      colorInfo: "#2563eb",
      colorLink: "#2563eb",
      colorSuccess: "#15803d",
      colorText: "#111827",
      colorTextSecondary: "#475569",
      colorTextTertiary: "#94a3b8",
      // Keyboard focus ring. AntD's default 4px ring and light derived border blur into a gray
      // box on square controls; use a 2px solid primary color to preserve accessibility without
      // looking like an accidental selection state.
      lineWidthFocus: 2,
      colorPrimaryBorder: "#2563eb",
    },
    components: {
      Button: {
        primaryColor: "#ffffff",
        colorPrimary: "#1e3a8a",
        colorPrimaryHover: "#17306f",
        colorPrimaryActive: "#0f2a4a",
      },
      Input: {
        activeBorderColor: "#2563eb",
        activeShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)",
        hoverBorderColor: "#cbd5e1",
      },
      Select: {
        activeBorderColor: "#2563eb",
        activeOutlineColor: "rgba(37, 99, 235, 0.12)",
        hoverBorderColor: "#cbd5e1",
      },
      Tabs: {
        inkBarColor: "#2563eb",
        itemActiveColor: "#1e3a8a",
        itemHoverColor: "#2563eb",
        itemSelectedColor: "#1e3a8a",
      },
      Table: {
        // Keep selectable rows easy to scan: hover gives a quiet cue, selection
        // remains legible, and selected-hover adds only a small amount of emphasis.
        rowHoverBg: "#f8fafc",
        rowSelectedBg: "#eff6ff",
        rowSelectedHoverBg: "#dbeafe",
      },
    },
};
