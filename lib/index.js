/**
 * dsh-client-bili-watch — host loader entry.
 *
 * This package is browser-only: the client half (`./client`) embeds the full
 * Bilibili site in an iframe and needs no host-side behavior. This entry
 * exists so the package can be added to a DSH composition as a loader row,
 * which makes the client-modules scanner pick up its `dsh.client`
 * declaration and serve the client bundle.
 */
export function apply() {}
