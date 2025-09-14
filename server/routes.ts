import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // 카카오페이 결제 준비 API
  app.post("/api/payment/kakao/ready", async (req, res) => {
    try {
      const { quizResultId, amount, reportType } = req.body;
      
      // 입력 검증
      if (!quizResultId || !amount || !reportType) {
        return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
      }

      // 퀴즈 결과 확인
      const quizResult = await storage.getQuizResultById(quizResultId);
      if (!quizResult) {
        return res.status(404).json({ error: "퀴즈 결과를 찾을 수 없습니다." });
      }

      // 결제 정보 저장 (준비 단계)
      const paymentData = {
        userId: quizResult.userId,
        quizResultId,
        amount,
        paymentMethod: 'kakao',
        paymentStatus: 'pending' as const,
        paymentData: {
          reportType,
          partner_order_id: `ORDER_${Date.now()}`,
          partner_user_id: quizResult.userId,
          item_name: reportType,
          quantity: 1,
          total_amount: amount,
          tax_free_amount: 0,
          vat_amount: Math.floor(amount / 11)
        }
      };

      const payment = await storage.createPayment(paymentData);

      // TODO: 실제 카카오페이 API 호출
      // const kakaoResponse = await callKakaoPayReady({
      //   cid: process.env.KAKAO_PAY_CID,
      //   partner_order_id: paymentData.paymentDetails.partner_order_id,
      //   partner_user_id: paymentData.paymentDetails.partner_user_id,
      //   item_name: paymentData.paymentDetails.item_name,
      //   quantity: paymentData.paymentDetails.quantity,
      //   total_amount: paymentData.paymentDetails.total_amount,
      //   tax_free_amount: paymentData.paymentDetails.tax_free_amount,
      //   approval_url: `${req.protocol}://${req.get('host')}/api/payment/kakao/approve?payment_id=${payment.id}`,
      //   cancel_url: `${req.protocol}://${req.get('host')}/payment/cancel`,
      //   fail_url: `${req.protocol}://${req.get('host')}/payment/fail`
      // });

      // 데모용 Mock 응답
      const mockResponse = {
        tid: `T${Date.now()}`,
        next_redirect_app_url: "",
        next_redirect_mobile_url: `https://online-pay.kakao.com/mockpay/${payment.id}`,
        next_redirect_pc_url: `https://online-pay.kakao.com/mockpay/${payment.id}`,
        android_app_scheme: "kakaotalk://mockpay",
        ios_app_scheme: "kakaotalk://mockpay",
        created_at: new Date().toISOString()
      };

      // 결제 정보에 TID 저장
      await storage.updatePayment(payment.id, {
        transactionId: mockResponse.tid,
        paymentData: {
          ...paymentData.paymentData,
          tid: mockResponse.tid
        }
      });

      res.json({
        success: true,
        paymentId: payment.id,
        redirectUrl: mockResponse.next_redirect_pc_url,
        ...mockResponse
      });

    } catch (error) {
      console.error("카카오페이 결제 준비 오류:", error);
      res.status(500).json({ error: "결제 준비 중 오류가 발생했습니다." });
    }
  });

  // 카카오페이 결제 승인 API
  app.get("/api/payment/kakao/approve", async (req, res) => {
    try {
      const { payment_id, pg_token } = req.query;

      if (!payment_id || !pg_token) {
        return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
      }

      // 결제 정보 조회
      const payment = await storage.getPaymentById(payment_id as string);
      if (!payment) {
        return res.status(404).json({ error: "결제 정보를 찾을 수 없습니다." });
      }

      // TODO: 실제 카카오페이 승인 API 호출
      // const approveResponse = await callKakaoPayApprove({
      //   cid: process.env.KAKAO_PAY_CID,
      //   tid: payment.transactionId,
      //   partner_order_id: payment.paymentDetails.partner_order_id,
      //   partner_user_id: payment.paymentDetails.partner_user_id,
      //   pg_token: pg_token as string
      // });

      // 데모용 Mock 응답
      const mockApproveResponse = {
        aid: `A${Date.now()}`,
        tid: payment.transactionId,
        cid: "TC0ONETIME",
        sid: null,
        partner_order_id: (payment.paymentData as any)?.partner_order_id,
        partner_user_id: (payment.paymentData as any)?.partner_user_id,
        payment_method_type: "MONEY",
        amount: {
          total: parseFloat(payment.amount),
          tax_free: 0,
          vat: Math.floor(parseFloat(payment.amount) / 11),
          point: 0,
          discount: 0,
          green_deposit: 0
        },
        item_name: (payment.paymentData as any)?.item_name,
        item_code: "",
        quantity: 1,
        created_at: payment.createdAt,
        approved_at: new Date().toISOString()
      };

      // 결제 완료 처리
      await storage.updatePaymentStatus(payment.id, 'completed', payment.transactionId || undefined);

      // 프리미엄 리포트 생성
      const premiumReportData = {
        userId: payment.userId,
        paymentId: payment.id,
        reportType: (payment.paymentData as any)?.reportType || 'detailed',
        reportData: {
          generatedAt: new Date().toISOString(),
          personalityType: "INTJ", // TODO: 실제 퀴즈 결과에서 가져오기
          detailedAnalysis: "상세 분석 내용이 여기에 포함됩니다...",
          recommendations: ["추천사항 1", "추천사항 2", "추천사항 3"]
        }
      };

      const premiumReport = await storage.createPremiumReport(premiumReportData);

      // 클라이언트를 결과 페이지로 리다이렉트
      res.redirect(`/quiz-result/${payment.quizResultId}?premium=true&reportId=${premiumReport.id}`);

    } catch (error) {
      console.error("카카오페이 결제 승인 오류:", error);
      res.status(500).json({ error: "결제 승인 중 오류가 발생했습니다." });
    }
  });

  // 네이버페이 결제 준비 API
  app.post("/api/payment/naver/ready", async (req, res) => {
    try {
      const { quizResultId, amount, reportType } = req.body;
      
      // 입력 검증
      if (!quizResultId || !amount || !reportType) {
        return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
      }

      // 퀴즈 결과 확인
      const quizResult = await storage.getQuizResultById(quizResultId);
      if (!quizResult) {
        return res.status(404).json({ error: "퀴즈 결과를 찾을 수 없습니다." });
      }

      // 결제 정보 저장 (준비 단계)
      const paymentData = {
        userId: quizResult.userId,
        quizResultId,
        amount,
        paymentMethod: 'naver',
        paymentStatus: 'pending' as const,
        paymentData: {
          reportType,
          merchant_pay_key: `NAVER_${Date.now()}`,
          product_name: reportType,
          total_pay_amt: amount,
          shop_user_id: quizResult.userId,
          req_transaction_id: `REQ_${Date.now()}`,
        }
      };

      const payment = await storage.createPayment(paymentData);

      // TODO: 실제 네이버페이 API 호출
      // const naverResponse = await callNaverPayReady({
      //   merchant_pay_key: paymentData.paymentData.merchant_pay_key,
      //   product_name: paymentData.paymentData.product_name,
      //   total_pay_amt: paymentData.paymentData.total_pay_amt,
      //   shop_user_id: paymentData.paymentData.shop_user_id,
      //   approval_url: `${req.protocol}://${req.get('host')}/api/payment/naver/approve?payment_id=${payment.id}`,
      //   cancel_url: `${req.protocol}://${req.get('host')}/payment/cancel`,
      //   fail_url: `${req.protocol}://${req.get('host')}/payment/fail`
      // });

      // 데모용 Mock 응답
      const mockResponse = {
        success: "true",
        code: "Success",
        message: "정상 처리되었습니다.",
        body: {
          reserveId: `R${Date.now()}`,
          merchant_pay_key: paymentData.paymentData.merchant_pay_key,
          req_transaction_id: paymentData.paymentData.req_transaction_id,
          next_redirect_pc_url: `https://test-pay.naver.com/mockpay/${payment.id}`,
          next_redirect_mobile_url: `https://test-pay.naver.com/mockpay/mobile/${payment.id}`
        }
      };

      // 결제 정보에 ReserveId 저장
      await storage.updatePayment(payment.id, {
        transactionId: mockResponse.body.reserveId,
        paymentData: {
          ...paymentData.paymentData,
          reserveId: mockResponse.body.reserveId
        }
      });

      res.json({
        success: true,
        paymentId: payment.id,
        redirectUrl: mockResponse.body.next_redirect_pc_url,
        ...mockResponse.body
      });

    } catch (error) {
      console.error("네이버페이 결제 준비 오류:", error);
      res.status(500).json({ error: "결제 준비 중 오류가 발생했습니다." });
    }
  });

  // 네이버페이 결제 승인 API
  app.get("/api/payment/naver/approve", async (req, res) => {
    try {
      const { payment_id, PaymentId } = req.query;

      if (!payment_id || !PaymentId) {
        return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
      }

      // 결제 정보 조회
      const payment = await storage.getPaymentById(payment_id as string);
      if (!payment) {
        return res.status(404).json({ error: "결제 정보를 찾을 수 없습니다." });
      }

      // TODO: 실제 네이버페이 승인 API 호출
      // const approveResponse = await callNaverPayApprove({
      //   merchant_pay_key: (payment.paymentData as any)?.merchant_pay_key,
      //   paymentId: PaymentId as string,
      //   req_transaction_id: (payment.paymentData as any)?.req_transaction_id
      // });

      // 데모용 Mock 승인 응답
      const mockApproveResponse = {
        success: "true",
        code: "Success",
        message: "정상 처리되었습니다.",
        body: {
          paymentId: PaymentId as string,
          merchant_pay_key: (payment.paymentData as any)?.merchant_pay_key,
          req_transaction_id: (payment.paymentData as any)?.req_transaction_id,
          primary_pay_method: "CARD",
          primary_pay_means: "네이버페이",
          total_pay_amt: parseFloat(payment.amount),
          primary_pay_amt: parseFloat(payment.amount),
          npay_order_id: `NORDER_${Date.now()}`,
          admissionYmdt: new Date().toISOString().replace(/[:.]/g, '').slice(0, -5)
        }
      };

      // 결제 완료 처리
      await storage.updatePaymentStatus(payment.id, 'completed', payment.transactionId || undefined);

      // 프리미엄 리포트 생성
      const premiumReportData = {
        userId: payment.userId,
        paymentId: payment.id,
        reportType: (payment.paymentData as any)?.reportType || 'detailed',
        reportData: {
          generatedAt: new Date().toISOString(),
          personalityType: "INTJ", // TODO: 실제 퀴즈 결과에서 가져오기
          detailedAnalysis: "상세 분석 내용이 여기에 포함됩니다...",
          recommendations: ["추천사항 1", "추천사항 2", "추천사항 3"]
        }
      };

      const premiumReport = await storage.createPremiumReport(premiumReportData);

      // 클라이언트를 결과 페이지로 리다이렉트
      res.redirect(`/quiz-result/${payment.quizResultId}?premium=true&reportId=${premiumReport.id}&provider=naver`);

    } catch (error) {
      console.error("네이버페이 결제 승인 오류:", error);
      res.status(500).json({ error: "결제 승인 중 오류가 발생했습니다." });
    }
  });

  // 결제 취소 처리
  app.get("/payment/cancel", async (req, res) => {
    res.redirect("/?message=payment_cancelled");
  });

  // 결제 실패 처리
  app.get("/payment/fail", async (req, res) => {
    res.redirect("/?message=payment_failed");
  });

  const httpServer = createServer(app);

  return httpServer;
}
