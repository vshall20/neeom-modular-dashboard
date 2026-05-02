import app from "../../firebase";

const cache = {
  orderTypes: null,
  areas: null,
  statusType: null,
};

export async function getOrderTypes() {
  if (cache.orderTypes) return cache.orderTypes;
  const snap = await app.firestore().collection("orderType").get();
  const types = snap.docs.map((d) => d.data().value);
  cache.orderTypes = types;
  return types;
}

export async function getAreas() {
  if (cache.areas) return cache.areas;
  const snap = await app.firestore().collection("areas").get();
  const areas = snap.docs.map((d) => d.data())[0].areas;
  cache.areas = areas;
  return areas;
}

export async function getStatusType() {
  if (cache.statusType) return cache.statusType;
  const snap = await app.firestore().collection("statusType").get();
  const status = snap.docs.map((d) => d.data())[0];
  cache.statusType = status;
  return status;
}

export function invalidateConfigCache() {
  cache.orderTypes = null;
  cache.areas = null;
  cache.statusType = null;
}
