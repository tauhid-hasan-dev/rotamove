/**
 * Shared constants for the last-call strip.
 *
 * Kept in their own module because the blocking script in the layout and the
 * banner component both need them, and those two getting out of step would
 * mean a dismissed banner quietly coming back.
 */

/** `localStorage` key set when the visitor dismisses the strip. */
export const LAST_CALL_DISMISSED = "rotamove.lastcall.dismissed";

/** `dataset` key on <html>; becomes the `data-lastcall` attribute. */
export const LAST_CALL_FLAG = "lastcall";

/**
 * Runs before first paint, so a returning visitor never sees the strip flash.
 * Stringified into the document — keep it tiny and dependency-free.
 */
export const LAST_CALL_SCRIPT = `try{if(localStorage.getItem('${LAST_CALL_DISMISSED}'))document.documentElement.dataset.${LAST_CALL_FLAG}='off'}catch(e){}`;
