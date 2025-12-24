export function explainCardToUser(item) {
  if (!item) return "Bu kart hakkında bilgi bulunamadı.";

  return item.description
    ? item.description
    : "Bu ürün senin için avantajlı bir seçenek olarak değerlendirildi.";
}
const explanation = explainCardToUser(selectedCard);
return sendToChat(explanation); 
