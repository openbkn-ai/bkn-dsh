import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client'

interface DesktopDirectoryPicker {
  pick(): Promise<string | null>
}

/** Use the same origin-scoped Desktop picker as the native workspace flow. */
export function pickWorkspaceDirectory(
  workspace: Pick<UiWorkspace, 'pickDirectory'>,
  desktop: unknown = (globalThis as typeof globalThis & { __DSH_DIRECTORY_PICKER__?: unknown }).__DSH_DIRECTORY_PICKER__,
): Promise<string | null> {
  if (desktop !== null && typeof desktop === 'object'
    && typeof (desktop as Partial<DesktopDirectoryPicker>).pick === 'function') {
    // Cancellation and failure belong to this one chooser. Do not launch a
    // second Host OS dialog after a native cancel or rejected selection.
    return (desktop as DesktopDirectoryPicker).pick()
  }
  return workspace.pickDirectory()
}
