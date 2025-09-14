import { 
  users, 
  quizResults,
  payments,
  premiumReports,
  type User, 
  type InsertUser,
  type QuizResult,
  type InsertQuizResult,
  type Payment,
  type InsertPayment,
  type PremiumReport,
  type InsertPremiumReport
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// 확장된 Storage 인터페이스
export interface IStorage {
  // 사용자 관련
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // 퀴즈 결과 관련
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResult(id: string): Promise<QuizResult | undefined>;
  getQuizResultById(id: string): Promise<QuizResult | undefined>;
  getQuizResultsByUser(userId: string): Promise<QuizResult[]>;
  
  // 결제 관련
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentById(id: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: string, transactionId?: string, completedAt?: Date): Promise<Payment | undefined>;
  
  // 프리미엄 리포트 관련
  createPremiumReport(report: InsertPremiumReport): Promise<PremiumReport>;
  getPremiumReport(userId: string, quizResultId: string): Promise<PremiumReport | undefined>;
  getUserPremiumReports(userId: string): Promise<PremiumReport[]>;
}

export class DatabaseStorage implements IStorage {
  // 사용자 관련
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // 퀴즈 결과 관련
  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    const [result] = await db
      .insert(quizResults)
      .values(insertResult)
      .returning();
    return result;
  }

  async getQuizResult(id: string): Promise<QuizResult | undefined> {
    const [result] = await db.select().from(quizResults).where(eq(quizResults.id, id));
    return result || undefined;
  }

  async getQuizResultById(id: string): Promise<QuizResult | undefined> {
    const [result] = await db.select().from(quizResults).where(eq(quizResults.id, id));
    return result || undefined;
  }

  async getQuizResultsByUser(userId: string): Promise<QuizResult[]> {
    return await db.select().from(quizResults).where(eq(quizResults.userId, userId));
  }

  // 결제 관련
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async updatePaymentStatus(id: string, status: string, transactionId?: string, completedAt?: Date): Promise<Payment | undefined> {
    const updateData: Partial<Payment> = { paymentStatus: status };
    if (transactionId) updateData.transactionId = transactionId;
    if (completedAt) updateData.completedAt = completedAt;

    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  // 프리미엄 리포트 관련
  async createPremiumReport(insertReport: InsertPremiumReport): Promise<PremiumReport> {
    const [report] = await db
      .insert(premiumReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getPremiumReport(userId: string, quizResultId: string): Promise<PremiumReport | undefined> {
    const [report] = await db
      .select()
      .from(premiumReports)
      .where(
        and(
          eq(premiumReports.userId, userId),
          eq(premiumReports.quizResultId, quizResultId),
          eq(premiumReports.isActive, true)
        )
      );
    return report || undefined;
  }

  async getUserPremiumReports(userId: string): Promise<PremiumReport[]> {
    return await db
      .select()
      .from(premiumReports)
      .where(
        and(
          eq(premiumReports.userId, userId),
          eq(premiumReports.isActive, true)
        )
      );
  }
}

export const storage = new DatabaseStorage();
