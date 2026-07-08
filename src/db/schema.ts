import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  onboardingComplete: integer("onboarding_complete", { mode: "boolean" })
    .notNull()
    .default(false),
  timeWindow: text("time_window").notNull().default("today"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const userIntents = sqliteTable(
  "user_intents",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    intentId: text("intent_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.intentId] })],
);

export const areas = sqliteTable("areas", {
  id: text("id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  defaultHours: real("default_hours").notNull(),
  defaultSelected: integer("default_selected", { mode: "boolean" })
    .notNull()
    .default(true),
  defaultProtected: integer("default_protected", { mode: "boolean" })
    .notNull()
    .default(false),
  daysPattern: text("days_pattern").notNull().default("everyday"),
  blocksJson: text("blocks_json").notNull().default("[]"),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  isSelected: integer("is_selected", { mode: "boolean" }).notNull().default(true),
  isProtected: integer("is_protected", { mode: "boolean" })
    .notNull()
    .default(false),
  weightHours: real("weight_hours").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [primaryKey({ columns: [table.id, table.userId] })]);

export const usualWeekBlocks = sqliteTable("usual_week_blocks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  areaId: text("area_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  start: text("start").notNull(),
  end: text("end").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  areaId: text("area_id").notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  estimateMinutes: integer("estimate_minutes").notNull(),
  status: text("status").notNull().default("open"),
  scheduledDate: text("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  dueDate: text("due_date"),
  recurrence: text("recurrence").notNull().default("none"),
  reminder: text("reminder").notNull().default("none"),
});

export const taskCompletedDates = sqliteTable(
  "task_completed_dates",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    dateKey: text("date_key").notNull(),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.dateKey] })],
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  areaId: text("area_id").notNull(),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp_ms" }),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const reminderDeliveries = sqliteTable(
  "reminder_deliveries",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dedupeKey: text("dedupe_key").notNull(),
    deliveredAt: integer("delivered_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.dedupeKey] })],
);
