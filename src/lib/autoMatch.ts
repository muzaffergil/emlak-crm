import { clientStore, propertyStore, matchStore, type Client } from "./storage";
import { computeMatches } from "./claude";

export async function runMatchForProperty(propertyId: number): Promise<{ count: number; clients: Client[] }> {
  const [allClients, allProperties] = await Promise.all([clientStore.getAll(), propertyStore.getAll()]);
  const property = allProperties.find(p => p.id === propertyId);
  if (!property) return { count: 0, clients: [] };

  const activeClients = allClients.filter(c => ["aliyor", "kiraciyor"].includes(c.intent));
  const matched: Client[] = [];

  for (const client of activeClients) {
    const results = computeMatches(client, [property]);
    if (results.length > 0) {
      matched.push(client);
      await matchStore.deleteByClient(client.id);
      const all = computeMatches(client, allProperties.filter(p => p.status === "musait"));
      await matchStore.insertMany(all.map(r => ({ client_id: client.id, property_id: r.property_id, score: r.score, reasons: r.reasons })));
    }
  }
  return { count: matched.length, clients: matched };
}

export async function runMatchForClient(clientId: number): Promise<number> {
  const [client, allProperties] = await Promise.all([
    clientStore.getAll().then(list => list.find(c => c.id === clientId)),
    propertyStore.getAll(),
  ]);
  if (!client || !["aliyor", "kiraciyor"].includes(client.intent)) return 0;

  await matchStore.deleteByClient(clientId);
  const available = allProperties.filter(p => p.status === "musait");
  const results = computeMatches(client, available);
  if (results.length > 0) {
    await matchStore.insertMany(results.map(r => ({ client_id: clientId, property_id: r.property_id, score: r.score, reasons: r.reasons })));
  }
  return results.length;
}
