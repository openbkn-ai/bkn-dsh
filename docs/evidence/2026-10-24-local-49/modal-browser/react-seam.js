export function useRef(value){ return { current:value===null?globalThis.probePanel:value } }
export function useEffect(effect){ const cleanup=effect(); if(cleanup)globalThis.probeCleanups.push(cleanup) }
export const useLayoutEffect=useEffect;
