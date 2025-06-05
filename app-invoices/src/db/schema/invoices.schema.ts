import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";


export const invoicesSchema = pgTable("invoices", {
  id: text("id").primaryKey(),
  orderId: text("customer_id").notNull(),
  amount: integer("amount").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
