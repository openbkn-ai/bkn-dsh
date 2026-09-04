import type { Context } from '@deepseek-ai/cordis'
import { Config as ConfigSchema, type Config as PluginConfig } from './config.js'

export { ConfigSchema as Config }
export type { PluginConfig }
export { AuthCoordinator, OpenBknCliError } from './auth.js'
export type { AuthSnapshot, CliResult, OpenBknCli } from './auth.js'

/** Cordis identity used by the bundle's Host row. */
export const name = 'openbkn-business-context'

/**
 * The first release slice establishes the load contract only. Auth, network
 * binding, tools, and UI contributions are added as independently tested
 * effects rather than hidden startup work.
 */
export function apply(_ctx: Context, _config: PluginConfig): void {}
