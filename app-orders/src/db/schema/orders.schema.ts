import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { customersSchema } from "./customers.schema.ts";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "completed",
  "cancelled",
]);
export const ordersSchema = pgTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customersSchema.id),
  amount: integer("amount").notNull(),
  status: orderStatusEnum("status").default("pending"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
