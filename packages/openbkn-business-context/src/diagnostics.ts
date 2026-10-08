/**
 * Standalone Host entry for OpenBKN diagnostics.
 *
 * This module is the cordis row `openbkn-business-context-diagnostics`
 * (see `cordis.patch.yml`). It must never import `./index.js` or any
 * business module: the whole point of the second row is that the business
 * entry's config-validation, module-resolution, or startup failure leaves
 * this entry running. It declares no required config of its own.
 * @module diagnostics
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { OpenBknDiagnosticsService } from './diagnostics-service.js'
import { OpenBknConfigurationService } from './configuration-service.js'

export { OpenBknDiagnosticsService }

/** Cordis identity used by the bundle's diagnostics row. */
export const name = 'openbkn-business-context-diagnostics'

/** Only the loader service; no agents, tools, storage, or business service. */
export const inject = ['loader']

/** No required fields: a broken configuration must not disable diagnostics. */
export const Config = Schema.object({})

/** Register the passive diagnostics service. */
export async function apply(ctx: Context): Promise<void> {
  await ctx.plugin(OpenBknDiagnosticsService)
  await ctx.plugin(OpenBknConfigurationService)
}
