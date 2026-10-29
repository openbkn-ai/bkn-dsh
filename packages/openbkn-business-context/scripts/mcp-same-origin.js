// Frozen #105 same-origin policy; upstream DeepSeek Harness (MIT).
const REDIRECT_STATUSES = /* @__PURE__ */ new Set([
	301,
	302,
	303,
	307,
	308
]);
const MAX_REDIRECTS = 5;
/** Whether `to` has the scheme, host and port of `from`, or is its https form with both on the default port. */
function isWithinOrigin(from, to) {
	if (from.protocol === to.protocol && from.host === to.host) return true;
	return from.protocol === "http:" && to.protocol === "https:" && from.hostname === to.hostname && !from.port && !to.port;
}
/** The URL that a redirect `response` to a request for `url` points at, if it names one. */
function redirectTarget(url, response) {
	const location = REDIRECT_STATUSES.has(response.status) ? response.headers?.get("location") : void 0;
	if (!location) return void 0;
	try {
		return new URL(location, url);
	} catch {
		return;
	}
}
/** Wraps `baseFetch` to follow a redirect only when it keeps the method and stays within the origin of the request. */
function fetchWithinOrigin(baseFetch) {
	return async (url, init) => {
		if (init?.redirect === "error" || init?.redirect === "manual") return baseFetch(url, init);
		const method = (init?.method ?? "GET").toUpperCase();
		let current = url;
		for (let followed = 0;; followed++) {
			const response = await baseFetch(current, {
				...init,
				redirect: "manual"
			});
			const target = redirectTarget(current, response);
			if (!target || followed === MAX_REDIRECTS) return response;
			const from = new URL(current);
			const keepsMethod = method === "GET" || response.status === 307 || response.status === 308;
			const keepsUserinfo = !(target.username || target.password) || target.username === from.username && target.password === from.password;
			if (!keepsMethod || !keepsUserinfo || !isWithinOrigin(from, target)) return response;
			await response.text?.().catch(() => {});
			current = target;
		}
	};
}
