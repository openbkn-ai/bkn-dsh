import type { Context } from '@deepseek-ai/cordis'

/** Browser-side Cordis identity. */
export const name = 'openbkn-business-context-client'

/**
 * Reserves an additive browser entry without taking ownership of any DSH
 * shell, conversation, composer, or scrolling surface.
 */
export function apply(_ctx: Context): void {}
