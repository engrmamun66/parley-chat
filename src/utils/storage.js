/** localStorage wrapper that never throws (private mode, blocked storage, sandboxed iframes). */
export function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
export function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
export function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
