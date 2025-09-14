import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// 사용자 테이블
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  nickname: text("nickname"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 퀴즈 결과 테이블
export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  quizType: text("quiz_type").notNull(), // MBTI, Teto Egen, KLoopi, etc.
  resultType: text("result_type").notNull(), // INTJ, ENFP, etc.
  persona: text("persona").notNull(), // "통찰력 있는 전략가"
  meme: text("meme"), // "큰 그림 그리고..."
  detailedResults: jsonb("detailed_results"), // 상세 결과 데이터
  completedAt: timestamp("completed_at").defaultNow(),
});

// 결제 정보 테이블  
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  quizResultId: varchar("quiz_result_id").references(() => quizResults.id),
  paymentMethod: text("payment_method").notNull(), // kakao, naver
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("KRW"),
  paymentStatus: text("payment_status").notNull(), // pending, completed, failed, refunded
  transactionId: text("transaction_id"), // 외부 결제 시스템의 거래 ID
  paymentData: jsonb("payment_data"), // 결제사별 추가 데이터
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// 유료 리포트 구매 정보 테이블
export const premiumReports = pgTable("premium_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  quizResultId: varchar("quiz_result_id").references(() => quizResults.id),
  paymentId: varchar("payment_id").references(() => payments.id),
  reportType: text("report_type").notNull(), // detailed, career, relationship, etc.
  isActive: boolean("is_active").default(true),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Relations 정의
export const usersRelations = relations(users, ({ many }) => ({
  quizResults: many(quizResults),
  payments: many(payments),
  premiumReports: many(premiumReports),
}));

export const quizResultsRelations = relations(quizResults, ({ one, many }) => ({
  user: one(users, {
    fields: [quizResults.userId],
    references: [users.id],
  }),
  payments: many(payments),
  premiumReports: many(premiumReports),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  quizResult: one(quizResults, {
    fields: [payments.quizResultId],
    references: [quizResults.id],
  }),
}));

export const premiumReportsRelations = relations(premiumReports, ({ one }) => ({
  user: one(users, {
    fields: [premiumReports.userId],
    references: [users.id],
  }),
  quizResult: one(quizResults, {
    fields: [premiumReports.quizResultId],
    references: [quizResults.id],
  }),
  payment: one(payments, {
    fields: [premiumReports.paymentId],
    references: [payments.id],
  }),
}));

// Insert 및 Select 스키마
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertQuizResultSchema = createInsertSchema(quizResults).omit({ id: true, completedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, completedAt: true });
export const insertPremiumReportSchema = createInsertSchema(premiumReports).omit({ id: true, purchasedAt: true });

export const selectUserSchema = createSelectSchema(users);
export const selectQuizResultSchema = createSelectSchema(quizResults);
export const selectPaymentSchema = createSelectSchema(payments);
export const selectPremiumReportSchema = createSelectSchema(premiumReports);

// TypeScript 타입 생성
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertPremiumReport = z.infer<typeof insertPremiumReportSchema>;

export type User = typeof users.$inferSelect;
export type QuizResult = typeof quizResults.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PremiumReport = typeof premiumReports.$inferSelect;
