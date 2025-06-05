import { fastifyCors } from "@fastify/cors";
import { fastify } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { orders } from "./broker/channels/orders.ts";
import { channels } from "./broker/index.ts";
import { dispatchOrderCreated } from "./broker/messages/order-created.ts";
import { db } from "./db/db.ts";
import { schema } from "./db/schema/index.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, {
  origin: "*",
});

app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body;

    console.log("[ORDERS] Received order with amount:", amount);

    const orderId = randomUUID();

    dispatchOrderCreated({
      amount,
      orderId,
      customer: {
        id: "6f11252c-4cc5-4f60-a988-f37f9f7b54f5",
      },
    });

    await db.insert(schema.ordersSchema).values({
      id: randomUUID(),
      customerId: "6f11252c-4cc5-4f60-a988-f37f9f7b54f5",
      amount,
    });

    return reply.status(200).send({
      message: "Order received successfully",
      orderPrice: amount,
    });
  }
);

app.get("/health", () => {
  return "OK";
});

app.listen({ host: "0.0.0.0", port: 8080 }).then(() => {
  console.log("[ORDERS] HTTP is running");
});
