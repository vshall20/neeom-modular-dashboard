import app from "../../firebase";
import { isClosedStatus } from "../../contexts/OrdersContext";

export const ACTIVE_COLLECTION = "orders";
export const CLOSED_COLLECTION = "ordersClosed";

export async function archiveOrder(docId, data) {
  const db = app.firestore();
  const batch = db.batch();
  batch.set(db.collection(CLOSED_COLLECTION).doc(docId), data);
  batch.delete(db.collection(ACTIVE_COLLECTION).doc(docId));
  await batch.commit();
}

export async function loadOrderFromEither(docId) {
  const db = app.firestore();
  const activeSnap = await db.collection(ACTIVE_COLLECTION).doc(docId).get();
  if (activeSnap.exists) {
    return { source: ACTIVE_COLLECTION, data: activeSnap.data() };
  }
  const closedSnap = await db.collection(CLOSED_COLLECTION).doc(docId).get();
  if (closedSnap.exists) {
    return { source: CLOSED_COLLECTION, data: closedSnap.data() };
  }
  return null;
}

export async function deleteFromCollection(collection, docId) {
  await app.firestore().collection(collection).doc(docId).delete();
}

export function shouldArchive(orderStatus) {
  return isClosedStatus(orderStatus);
}
