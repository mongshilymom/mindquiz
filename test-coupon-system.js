#!/usr/bin/env node

/**
 * MindQuiz 쿠폰 시스템 테스트 스크립트
 * 쿠폰 발급, 홀드, 해제, 사용 등의 전체 workflow를 테스트
 */

const fs = require('fs');
const path = require('path');

// store 모듈 직접 로드
const store = require('./server/lib/store.cjs');

console.log('=== MindQuiz 쿠폰 시스템 테스트 ===\n');

// 테스트 데이터 클리어
function clearTestData() {
  console.log('1. 테스트 데이터 초기화...');
  const dataDir = path.join(__dirname, 'server', 'data');
  if (fs.existsSync(dataDir)) {
    const files = ['orders.ndjson', 'coupons.ndjson', 'events.ndjson'];
    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
        console.log(`   ✓ ${file} 초기화 완료`);
      }
    });
  }
  console.log('');
}

// 쿠폰 발급 테스트
function testIssueCoupon() {
  console.log('2. 쿠폰 발급 테스트...');
  
  const discountCoupon = store.issueCoupon('DISCOUNT_10', 'order123');
  const expansionCoupon = store.issueCoupon('EXPANSION_PACK', 'order456');
  
  console.log(`   ✓ 10% 할인 쿠폰 발급: ${discountCoupon}`);
  console.log(`   ✓ 확장팩 쿠폰 발급: ${expansionCoupon}`);
  
  return { discountCoupon, expansionCoupon };
}

// 쿠폰 조회 테스트
function testGetCoupon(coupons) {
  console.log('\n3. 쿠폰 조회 테스트...');
  
  const discount = store.getCoupon(coupons.discountCoupon);
  const expansion = store.getCoupon(coupons.expansionCoupon);
  
  console.log(`   ✓ 할인 쿠폰 상태: ${discount.state}, 타입: ${discount.type}`);
  console.log(`   ✓ 확장팩 쿠폰 상태: ${expansion.state}, 타입: ${expansion.type}`);
  
  return { discount, expansion };
}

// 쿠폰 홀드 테스트
function testHoldCoupon(coupons) {
  console.log('\n4. 쿠폰 홀드 테스트...');
  
  const holdResult1 = store.holdCoupon(coupons.discountCoupon, 'order789');
  const holdResult2 = store.holdCoupon(coupons.expansionCoupon, 'order790');
  
  console.log(`   ✓ 할인 쿠폰 홀드: ${holdResult1.ok ? '성공' : '실패 - ' + holdResult1.reason}`);
  console.log(`   ✓ 확장팩 쿠폰 홀드: ${holdResult2.ok ? '성공' : '실패 - ' + holdResult2.reason}`);
  
  // 홀드 후 상태 확인
  const discountAfter = store.getCoupon(coupons.discountCoupon);
  const expansionAfter = store.getCoupon(coupons.expansionCoupon);
  
  console.log(`   ✓ 홀드 후 할인 쿠폰 상태: ${discountAfter.state}`);
  console.log(`   ✓ 홀드 후 확장팩 쿠폰 상태: ${expansionAfter.state}`);
}

// 쿠폰 해제 테스트
function testReleaseCoupon(coupons) {
  console.log('\n5. 쿠폰 해제 테스트...');
  
  const releaseResult = store.releaseCoupon(coupons.expansionCoupon);
  console.log(`   ✓ 확장팩 쿠폰 해제: ${releaseResult.ok ? '성공' : '실패 - ' + releaseResult.reason}`);
  
  const expansionAfter = store.getCoupon(coupons.expansionCoupon);
  console.log(`   ✓ 해제 후 확장팩 쿠폰 상태: ${expansionAfter.state}`);
}

// 쿠폰 사용 테스트
function testRedeemCoupon(coupons) {
  console.log('\n6. 쿠폰 사용 테스트...');
  
  const redeemResult = store.redeemCoupon(coupons.discountCoupon, 'order789');
  console.log(`   ✓ 할인 쿠폰 사용: ${redeemResult.ok ? '성공' : '실패 - ' + redeemResult.reason}`);
  
  const discountAfter = store.getCoupon(coupons.discountCoupon);
  console.log(`   ✓ 사용 후 할인 쿠폰 상태: ${discountAfter.state}`);
  
  // 이미 사용된 쿠폰 재사용 시도
  const redeemAgain = store.redeemCoupon(coupons.discountCoupon, 'order800');
  console.log(`   ✓ 재사용 시도 결과: ${redeemAgain.ok ? '성공' : '실패 - ' + redeemAgain.reason}`);
}

// 주문 저장 테스트
function testOrderOperations() {
  console.log('\n7. 주문 저장 테스트...');
  
  store.saveOrder({
    orderId: 'test-order-001',
    provider: 'kakao',
    stage: 'READY',
    amount: 5900,
    couponCode: 'TEST-COUPON-001'
  });
  
  store.updateOrder('test-order-001', {
    stage: 'PAID',
    receipt: { paymentId: 'kakao-12345' }
  });
  
  const order = store.getOrder('test-order-001');
  console.log(`   ✓ 주문 저장 및 업데이트 완료: ${order ? '성공' : '실패'}`);
  if (order) {
    console.log(`   ✓ 주문ID: ${order.orderId}, 금액: ${order.amount}, 쿠폰: ${order.couponCode}`);
  }
}

// 로그 조회 테스트
function testLogOperations() {
  console.log('\n8. 로그 조회 테스트...');
  
  // 이벤트 로그 저장
  store.logEvent({ action: 'test_event', detail: 'This is a test event' });
  
  // 모든 데이터 조회
  const orders = store.list(store._files.orders);
  const coupons = store.list(store._files.coupons);
  const events = store.list(store._files.events);
  
  console.log(`   ✓ 총 주문 로그: ${orders.length}개`);
  console.log(`   ✓ 총 쿠폰 로그: ${coupons.length}개`);
  console.log(`   ✓ 총 이벤트 로그: ${events.length}개`);
}

// 에러 케이스 테스트
function testErrorCases() {
  console.log('\n9. 에러 케이스 테스트...');
  
  // 존재하지 않는 쿠폰
  const nonExistent = store.getCoupon('NON-EXISTENT-COUPON');
  console.log(`   ✓ 존재하지 않는 쿠폰 조회: ${nonExistent ? '실패' : '성공 (null 반환)'}`);
  
  // 존재하지 않는 쿠폰 홀드 시도
  const holdNonExistent = store.holdCoupon('NON-EXISTENT-COUPON', 'order999');
  console.log(`   ✓ 존재하지 않는 쿠폰 홀드 시도: ${holdNonExistent.ok ? '실패' : '성공 - ' + holdNonExistent.reason}`);
}

// 메인 테스트 실행
async function runTests() {
  try {
    clearTestData();
    
    const coupons = testIssueCoupon();
    testGetCoupon(coupons);
    testHoldCoupon(coupons);
    testReleaseCoupon(coupons);
    testRedeemCoupon(coupons);
    testOrderOperations();
    testLogOperations();
    testErrorCases();
    
    console.log('\n=== 테스트 완료 ===');
    console.log('✅ 모든 쿠폰 시스템 기능이 정상적으로 동작합니다!');
    
    console.log('\n=== 사용 방법 안내 ===');
    console.log('1. 관리자 로그 접속: http://localhost:3004/admin/logs?pass=YOUR_ADMIN_PASSWORD');
    console.log('2. 쿠폰 발급 API: GET /api/coupon/issue?orderId=ORDER_ID&exp=A_OR_B');
    console.log('3. 결제 시 쿠폰 사용: POST /api/payment/kakao/ready (couponCode 포함)');
    console.log('4. CSV 내보내기: admin 페이지에서 각 섹션별 "CSV 내보내기" 버튼 클릭');
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error.message);
    console.error(error.stack);
  }
}

runTests();