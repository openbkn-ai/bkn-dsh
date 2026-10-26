const path = require('node:path');
const { createRequire } = require('node:module');
const fs = require('node:fs');
const [directory, output] = process.argv.slice(2);
const anchor = createRequire(path.join(directory, 'DeepSeek Harness.app/Contents/Resources/app.asar/dsh/package.json'));
const { Context, Service } = anchor('@deepseek-ai/cordis');
async function probe(explicitOwner) {
  const rootCtx = new Context(), live = new Set();
  class Owner extends Service {
    constructor(ctx) { super(ctx, 'r34LifetimeProbe'); this.ownerCtx = ctx; }
    async mount() {
      const selected = explicitOwner ? this.ownerCtx : this.ctx;
      const selectedIsRootFiber = selected.fiber === rootCtx.fiber;
      await selected.plugin({ apply(child) {
        child.effect(() => { const id = {}; live.add(id); return () => live.delete(id); });
      } });
      return { selectedIsRootFiber, serviceCallerIsRootFiber: this.ctx.fiber === rootCtx.fiber };
    }
  }
  const owner = await rootCtx.plugin(Owner);
  const call = await rootCtx.get('r34LifetimeProbe').mount();
  const mountedBefore = live.size;
  await owner.dispose();
  const mountedAfterOwnerDispose = live.size;
  await rootCtx.fiber.dispose();
  return { explicitOwner, ...call, mountedBefore, mountedAfterOwnerDispose, afterRootDispose: live.size };
}
(async () => {
  const result = { node: process.version, cordis: anchor('@deepseek-ai/cordis/package.json').version,
    callerContext: await probe(false), constructorContext: await probe(true) };
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
})().catch(error => { console.error(error); process.exitCode = 1; });
