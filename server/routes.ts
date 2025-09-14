import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { personalityTypes } from "./data/personality";

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

  // personalityTypes 데이터는 별도 모듈에서 import
  // (기존 정의 제거됨)
    "ENFJ": {
      persona: "정의로운 사회운동가",
      meme: "사람들의 멘토",
      description: "타인의 잠재력을 발견하고 개발하는 것을 좋아하며, 사회 발전에 기여하고자 합니다.",
      detailedAnalysis: `ENFJ는 타인의 성장을 돕고 사회에 긍정적 변화를 만드는 천부적 리더입니다.

**주요 특징:**
• 강력한 인간관계 구축 능력
• 타인의 잠재력을 발견하고 개발하는 재능
• 사회적 책임감과 정의감
• 뛰어난 소통 능력과 설득력

**강점:**
• 타인을 이해하고 동기를 부여하는 능력
• 팀워크와 협력을 통한 목표 달성
• 긍정적 변화를 이끌어내는 리더십
• 다양한 관점을 수용하고 조화를 만드는 능력

**개선 포인트:**
• 타인의 문제에 과도하게 개입하는 경향 관리
• 자신의 필요와 감정 돌보기
• 비판에 대한 민감성 완화
• 완벽주의와 과도한 책임감 관리`,
      recommendations: [
        "타인을 도울 수 있는 역할과 기회를 적극 찾으세요",
        "팀 프로젝트와 협업 환경에서 능력을 발휘하세요",
        "자신의 감정과 필요도 충분히 돌보세요",
        "적절한 경계를 설정하여 번아웃을 예방하세요"
      ],
      careerSuggestions: ["교육자", "상담사", "인사 담당자", "코치", "사회복지사", "정치인", "종교인"]
    },
    "ENFP": {
      persona: "재기발랄한 활동가",
      meme: "열정적인 영감가",
      description: "창의적이고 열정적이며, 사람들과의 소통을 통해 새로운 가능성을 탐구합니다.",
      detailedAnalysis: `ENFP는 무한한 열정과 창의성으로 주변을 밝게 만드는 영감가입니다.

**주요 특징:**
• 높은 에너지와 열정
• 창의적이고 혁신적인 사고
• 뛰어난 대인관계 능력
• 새로운 가능성에 대한 열린 마음

**강점:**
• 사람들을 동기부여하고 영감을 주는 능력
• 창의적 문제 해결과 아이디어 제시
• 다양한 관심사와 빠른 학습 능력
• 긍정적이고 낙관적인 에너지

**개선 포인트:**
• 집중력과 지속성 개발
• 세부사항에 대한 관심과 완성도 향상
• 과도한 약속과 일정 관리
• 비판에 대한 민감성 완화`,
      recommendations: [
        "다양한 프로젝트와 새로운 경험에 도전하세요",
        "창의적 협업과 브레인스토밍 기회를 만들어보세요",
        "시작한 프로젝트를 완료할 수 있는 시스템을 구축하세요",
        "정기적인 휴식을 통해 에너지를 재충전하세요"
      ],
      careerSuggestions: ["마케팅 전문가", "이벤트 기획자", "상담사", "언론인", "예술가", "교육자", "기업가"]
    },
    "ISTJ": {
      persona: "현실주의자",
      meme: "믿음직한 실무자",
      description: "체계적이고 신뢰할 수 있으며, 전통적인 가치를 중시하고 책임감이 강합니다.",
      detailedAnalysis: `ISTJ는 안정성과 신뢰성을 바탕으로 조직의 근간을 이루는 현실주의자입니다.

**주요 특징:**
• 체계적이고 조직적인 업무 처리
• 강한 책임감과 의무감
• 전통과 기존 방식을 존중
• 신뢰할 수 있고 일관된 행동

**강점:**
• 세부사항에 대한 정확성과 꼼꼼함
• 계획을 세우고 체계적으로 실행하는 능력
• 약속과 기한을 지키는 신뢰성
• 안정적이고 지속적인 성과 창출

**개선 포인트:**
• 변화와 혁신에 대한 개방성 증진
• 창의적 사고와 새로운 접근법 시도
• 감정 표현과 대인관계 스킬 개발
• 업무와 개인 생활의 균형 유지`,
      recommendations: [
        "체계적이고 안정적인 업무 환경에서 능력을 발휘하세요",
        "단계별 계획과 명확한 목표를 설정하세요",
        "새로운 기술이나 방법론을 점진적으로 학습해보세요",
        "정기적인 휴식과 취미 활동으로 스트레스를 관리하세요"
      ],
      careerSuggestions: ["회계사", "감사관", "은행원", "공무원", "법무사", "의사", "엔지니어"]
    },
    "ISFJ": {
      persona: "용감한 수호자",
      meme: "따뜻한 보살핌꾼",
      description: "따뜻하고 헌신적이며, 타인을 돕고 보호하는 것을 자신의 사명으로 여깁니다.",
      detailedAnalysis: `ISFJ는 타인을 돌보고 지원하는 것에서 깊은 만족을 느끼는 수호자입니다.

**주요 특징:**
• 강한 봉사 정신과 이타적 성향
• 타인의 필요를 민감하게 파악
• 세심하고 배려 깊은 관심
• 겸손하고 신중한 행동

**강점:**
• 타인의 감정과 필요를 이해하는 능력
• 세심한 배려와 실질적인 도움 제공
• 안정적이고 신뢰할 수 있는 관계 구축
• 조화로운 환경 조성과 갈등 완화

**개선 포인트:**
• 자신의 필요와 의견을 표현하는 용기 개발
• 과도한 자기희생과 스트레스 관리
• 변화에 대한 적응력 향상
• 자신감과 자기주장 능력 강화`,
      recommendations: [
        "타인을 돌보고 지원할 수 있는 역할을 찾으세요",
        "자신의 기여와 가치를 인정하고 표현하세요",
        "적절한 경계를 설정하여 자신을 보호하세요",
        "새로운 경험과 도전을 통해 성장하세요"
      ],
      careerSuggestions: ["간호사", "교사", "사회복지사", "상담사", "비서", "인사 담당자", "의료진"]
    },
    "ESTJ": {
      persona: "엄격한 관리자",
      meme: "천부적 조직가",
      description: "효율적이고 체계적인 관리 능력을 바탕으로 목표 달성을 위해 노력합니다.",
      detailedAnalysis: `ESTJ는 뛰어난 조직력과 관리 능력으로 목표를 달성하는 관리자입니다.

**주요 특징:**
• 뛰어난 조직력과 관리 능력
• 명확한 목표 설정과 체계적 추진
• 전통적 가치와 질서를 중시
• 강한 책임감과 리더십

**강점:**
• 효율적인 시스템과 프로세스 구축
• 팀을 이끌고 목표를 달성하는 능력
• 현실적이고 실용적인 문제 해결
• 일정과 예산을 철저히 관리하는 능력

**개선 포인트:**
• 타인의 개인적 상황에 대한 이해와 공감
• 창의적이고 혁신적인 접근법 수용
• 과도한 통제욕과 완벽주의 관리
• 변화하는 환경에 대한 유연성 개발`,
      recommendations: [
        "관리직이나 리더십 역할에서 능력을 발휘하세요",
        "체계적인 프로세스와 명확한 규칙이 있는 환경을 선택하세요",
        "팀원들의 개별적 특성과 동기를 파악하여 활용하세요",
        "새로운 방법론과 기술을 점진적으로 도입해보세요"
      ],
      careerSuggestions: ["경영진", "프로젝트 매니저", "은행 지점장", "공무원", "군인", "영업 관리자", "운영 관리자"]
    },
    "ESFJ": {
      persona: "사교적인 외교관",
      meme: "인기 많은 서포터",
      description: "따뜻하고 사교적이며, 조화로운 관계를 유지하고 타인을 지원하는 것을 좋아합니다.",
      detailedAnalysis: `ESFJ는 뛰어난 사교성과 배려심으로 모든 사람이 편안함을 느끼게 하는 외교관입니다.

**주요 특징:**
• 뛰어난 사교 능력과 친화력
• 타인의 감정과 필요에 민감하게 반응
• 조화와 협력을 중시하는 성향
• 전통적 가치와 사회적 규범 존중

**강점:**
• 팀워크와 협력을 통한 목표 달성
• 갈등을 중재하고 조화를 만드는 능력
• 실질적이고 구체적인 도움 제공
• 따뜻한 인간관계와 네트워크 구축

**개선 포인트:**
• 자신의 의견과 필요를 주장하는 용기
• 비판에 대한 과도한 민감성 관리
• 갈등 상황에서의 직면 능력 개발
• 개인적 시간과 공간 확보",
      recommendations: [
        "팀 환경에서 협력과 조화를 이끄는 역할을 맡으세요",
        "타인을 돕고 지원할 수 있는 업무를 선택하세요",
        "자신의 성취와 기여를 인정받을 수 있는 환경을 찾으세요",
        "개인적 필요와 감정도 충분히 돌보세요"
      ],
      careerSuggestions: ["인사 담당자", "이벤트 기획자", "고객 서비스", "교사", "간호사", "사회복지사", "비영리 단체 직원"]
    },
    "ISTP": {
      persona: "만능 재주꾼",
      meme: "조용한 해결사",
      description: "실용적이고 현실적인 문제 해결 능력이 뛰어나며, 손으로 직접 만들고 수리하는 것을 좋아합니다.",
      detailedAnalysis: "ISTP는 뛰어난 기술적 능력과 실용적 문제 해결력을 가진 만능 재주꾼입니다.\n\n**주요 특징:**\n• 뛰어난 기계적 이해력과 손재주\n• 논리적이고 분석적인 사고 방식\n• 독립적이고 자율적인 업무 선호\n• 현실적이고 실용적인 접근법\n\n**강점:**\n• 복잡한 시스템을 이해하고 수리하는 능력\n• 위기 상황에서의 신속한 문제 해결\n• 객관적이고 논리적인 분석력\n• 유연하고 적응력 있는 대처 방식\n\n**개선 포인트:**\n• 장기적 계획과 목표 설정 능력 개발\n• 감정적 소통과 대인관계 스킬 향상\n• 팀워크와 협업 능력 강화\n• 자신의 성취를 표현하고 인정받는 방법 학습",
      recommendations: [
        "기술적이고 실습적인 업무 환경을 선택하세요",
        "독립적으로 작업할 수 있는 공간과 시간을 확보하세요",
        "새로운 기술과 도구를 학습하고 실험해보세요",
        "실무 경험을 통해 전문성을 계속 발전시키세요"
      ],
      careerSuggestions: ["엔지니어", "기계공", "컴퓨터 프로그래머", "건축가", "파일럿", "외과의사", "응급실 의료진"]
    },
    "ISFP": {
      persona: "호기심 많은 예술가",
      meme: "감성적 창작자",
      description: "예술적 감각이 뛰어나고 개인의 가치를 중시하며, 자신만의 독특한 방식으로 세상을 표현합니다.",
      detailedAnalysis: `ISFP는 풍부한 감성과 예술적 재능으로 아름다움을 창조하는 예술가입니다.

**주요 특징:**
• 뛰어난 예술적 감각과 미적 안목
• 강한 개인적 가치관과 진정성 추구
• 섬세한 감정과 풍부한 상상력
• 자유롭고 유연한 사고방식

**강점:**
• 창의적이고 독창적인 작품 창조
• 타인의 감정을 이해하고 공감하는 능력
• 개성 있고 독특한 관점 제시
• 조화롭고 아름다운 환경 조성

**개선 포인트:**
• 자신의 작품과 아이디어를 적극적으로 표현
• 비판에 대한 민감성 관리
• 계획성과 체계성 개발
• 현실적 목표 설정과 실행력 향상`,
      recommendations: [
        "자신의 창의성과 예술적 재능을 발휘할 기회를 찾으세요",
        "개인적 가치와 일치하는 의미 있는 일을 선택하세요",
        "자신만의 독특한 스타일과 표현 방식을 개발하세요",
        "정기적인 영감과 동기 부여를 위한 활동을 계획하세요"
      ],
      careerSuggestions: ["예술가", "디자이너", "음악가", "사진작가", "작가", "상담사", "동물 관리사"]
    },
    "ESTP": {
      persona: "모험을 즐기는 사업가",
      meme: "현장의 왕",
      description: "활동적이고 현실적이며, 즉흥적인 상황에서 뛰어난 적응력과 실행력을 발휘합니다.",
      detailedAnalysis: `ESTP는 현재에 집중하며 활발한 에너지로 모든 일을 즐겁게 만드는 사업가입니다.

**주요 특징:**
• 높은 활동성과 행동력
• 현실적이고 실용적인 사고
• 뛰어난 사교 능력과 친화력
• 즉흥적이고 유연한 대처 능력

**강점:**
• 위기 상황에서의 신속한 대처와 문제 해결
• 사람들과 쉽게 관계를 맺고 네트워크 구축
• 실무적이고 현장 중심적인 접근법
• 변화하는 환경에 빠른 적응

**개선 포인트:**
• 장기적 계획과 전략적 사고 개발
• 세부사항에 대한 관심과 정확성 향상
• 감정적 깊이와 성찰 능력 개발
• 충동적 결정보다는 신중한 판단력 강화`,
      recommendations: [
        "역동적이고 변화가 많은 환경에서 능력을 발휘하세요",
        "사람들과의 직접적인 상호작용이 많은 역할을 선택하세요",
        "실무 경험과 현장 학습을 통해 전문성을 개발하세요",
        "단기 목표와 즉각적인 성과에 집중하되 장기적 관점도 고려하세요"
      ],
      careerSuggestions: ["영업 담당자", "기업가", "이벤트 기획자", "부동산 중개인", "응급실 의료진", "경찰관", "스포츠 선수"]
    },
    "ESFP": {
      persona: "자유로운 연예인",
      meme: "파티의 중심",
      description: "밝고 친근하며, 사람들과 함께 즐거운 시간을 보내는 것을 좋아하고 자연스럽게 관심을 끕니다.",
      detailedAnalysis: `ESFP는 따뜻한 마음과 자연스러운 매력으로 모든 사람을 즐겁게 만드는 연예인입니다.

**주요 특징:**
• 밝고 긍정적인 에너지
• 뛰어난 사교 능력과 친화력
• 현재 순간을 즐기는 성향
• 타인을 돕고 기쁘게 하려는 마음

**강점:**
• 사람들을 즐겁게 하고 동기를 부여하는 능력
• 따뜻하고 친근한 인간관계 구축
• 창의적이고 즉흥적인 표현력
• 변화하는 상황에 유연하게 적응

**개선 포인트:**
• 장기적 목표 설정과 계획 수립 능력
• 세부사항과 완성도에 대한 관심 증진
• 비판에 대한 민감성 관리
• 자기 관리와 규칙적인 생활 패턴 개발`,
      recommendations: [
        "사람들과의 상호작용이 많은 활기찬 환경을 선택하세요",
        "창의적 표현과 즉흥성을 발휘할 수 있는 기회를 찾으세요",
        "팀워크와 협력을 통해 목표를 달성하는 프로젝트에 참여하세요",
        "정기적인 피드백과 인정을 받을 수 있는 환경을 구축하세요"
      ],
      careerSuggestions: ["연예인", "이벤트 기획자", "교사", "상담사", "판매원", "요리사", "여행 가이드"]
    }
  };

  // 퀴즈 결과 조회 API
  app.get("/api/quiz-results/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // 퀴즈 결과 조회
      const quizResult = await storage.getQuizResultById(id);
      if (!quizResult) {
        return res.status(404).json({ error: "퀴즈 결과를 찾을 수 없습니다." });
      }

      // 성격 유형 데이터 조회
      const personalityData = personalityTypes[quizResult.personalityType as keyof typeof personalityTypes];
      if (!personalityData) {
        return res.status(404).json({ error: "성격 유형 데이터를 찾을 수 없습니다." });
      }

      const response = {
        id: quizResult.id,
        type: quizResult.personalityType,
        persona: personalityData.persona,
        meme: personalityData.meme,
        description: personalityData.description,
        quizType: quizResult.quizType,
        createdAt: quizResult.createdAt
      };

      res.json(response);
    } catch (error) {
      console.error("퀴즈 결과 조회 오류:", error);
      res.status(500).json({ error: "퀴즈 결과 조회 중 오류가 발생했습니다." });
    }
  });

  // 프리미엄 리포트 조회 API
  app.get("/api/premium-reports/:quizResultId", async (req, res) => {
    try {
      const { quizResultId } = req.params;
      
      // 퀴즈 결과 조회
      const quizResult = await storage.getQuizResultById(quizResultId);
      if (!quizResult) {
        return res.status(404).json({ error: "퀴즈 결과를 찾을 수 없습니다." });
      }

      // 성격 유형 데이터 조회
      const personalityData = personalityTypes[quizResult.personalityType as keyof typeof personalityTypes];
      if (!personalityData) {
        return res.status(404).json({ error: "성격 유형 데이터를 찾을 수 없습니다." });
      }

      // 프리미엄 리포트 데이터 생성 (또는 데이터베이스에서 조회)
      const premiumReport = {
        id: `premium-${quizResultId}`,
        reportType: "detailed",
        reportData: {
          detailedAnalysis: personalityData.detailedAnalysis,
          recommendations: personalityData.recommendations,
          careerSuggestions: personalityData.careerSuggestions,
          generatedAt: new Date().toISOString()
        }
      };

      res.json(premiumReport);
    } catch (error) {
      console.error("프리미엄 리포트 조회 오류:", error);
      res.status(500).json({ error: "프리미엄 리포트 조회 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
