/**
 * dsh-client-bili-watch — host loader entry.
 *
 * This is a browser-only plugin: the client half (`./client`) carries all
 * behavior. This entry exists so the package can be added to a DSH
 * composition as a loader row, which makes the client-modules scanner pick
 * up its `dsh.client` declaration and serve the client bundle.
 */
export function apply() {}
