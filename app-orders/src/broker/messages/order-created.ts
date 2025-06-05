import { channels } from "../index.ts";
import type { OrderCreatedMessage } from "./../../../../contracts/messages/order-created-message.ts";

export async function dispatchOrderCreated(data: OrderCreatedMessage) {
  channels.orders.sendToQueue("orders", Buffer.from(JSON.stringify(data)));
}
