// ============================================================================
//  SONO ENGINE — lightweight helpers for explaining cards to the user
//  NOTE: Keep this file side-effect free (no top-level returns/calls).
// ============================================================================

/**
 * Returns a short, user-friendly explanation for a given card/item.
 * @param {any} item
 * @returns {string}
 */
export function explainCardToUser(item) {
  if (!item) return "Bu kart hakkında bilgi bulunamadı.";

  const desc = typeof item?.description === "string" ? item.description.trim() : "";
  if (desc) return desc;

  return "Bu ürün senin için avantajlı bir seçenek olarak değerlendirildi.";
}

/**
 * Convenience helper: explains the card and sends it to an injected chat sender.
 * Keeps the module deterministic and avoids any implicit global dependencies.
 *
 * @param {any} selectedCard
 * @param {(msg: string) => any} sendToChat
 */
export function sendCardExplanationToChat(selectedCard, sendToChat) {
  const explanation = explainCardToUser(selectedCard);
  if (typeof sendToChat === "function") return sendToChat(explanation);
  return explanation;
}
