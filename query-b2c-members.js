import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

const query = `
SELECT DISTINCT
  m.id,
  u.name as user_name,
  u.phone_number as user_phone,
  m.title as membership_title,
  m.begin_date,
  m.end_date,
  o.total_price,
  o.b_product_info,
  CASE
    WHEN o.total_price = 0 OR o.total_price IS NULL THEN '0원'
    ELSE '유료'
  END as payment_type
FROM b_class_bmembership m
JOIN b_payment_btransaction t ON m.transaction_id = t.id
JOIN b_payment_border o ON t.order_id = o.id
LEFT JOIN user_user u ON o.user_id = u.id
WHERE m.is_active = true
  AND m.end_date >= CURRENT_DATE
  AND o.b_place_id = 26
  AND t.is_refund = false
  AND m.title NOT LIKE '%PT%'
  AND m.title NOT LIKE '%개인레슨%'
  AND m.title NOT LIKE '%프라이빗레슨%'
  AND m.title NOT LIKE '%그룹레슨%'
  AND m.title NOT LIKE '%1일%'
  AND m.title NOT LIKE '%체험%'
  AND m.title NOT LIKE '%골프락커%'
  AND m.title NOT LIKE '%시설대관%'
  AND m.title NOT LIKE '%제휴업체%'
  AND m.title NOT LIKE '%법인%'
  AND m.title NOT LIKE '%회원사%'
  AND m.title NOT LIKE '%입주사%'
  AND m.title NOT LIKE '%위메이드%'
  AND m.title NOT LIKE '%환불%'
  AND m.title NOT LIKE '%취소%'
  AND o.total_price >= 0
ORDER BY payment_type, m.end_date DESC;
`;

async function run() {
  try {
    const result = await pool.query(query);
    console.log('\n=== B2C 회원 명단 ===\n');
    console.log(`총 ${result.rows.length}명 조회됨 (전체 985명 중)\n`);

    let zeroPriceCount = 0;
    let paidCount = 0;

    result.rows.forEach((row, idx) => {
      if (row.payment_type === '0원') zeroPriceCount++;
      else paidCount++;

      console.log(`${idx + 1}. ID: ${row.id} [${row.payment_type}]`);
      console.log(`   회원명: ${row.user_name || '정보없음'}`);
      console.log(`   연락처: ${row.user_phone || '정보없음'}`);
      console.log(`   멤버십: ${row.membership_title}`);
      console.log(`   시작일: ${row.begin_date.toISOString().split('T')[0]}`);
      console.log(`   종료일: ${row.end_date.toISOString().split('T')[0]}`);
      console.log(`   결제금액: ${row.total_price || 0}원`);
      console.log('');
    });

    console.log('=== B2C 회원 통계 ===');
    console.log(`B2C 전체: ${result.rows.length}명`);
    console.log(`0원 결제: ${zeroPriceCount}명`);
    console.log(`유료 결제: ${paidCount}명`);
    console.log(`\n비B2C(법인/입주사/위메이드): ${985 - result.rows.length}명`);

  } catch (error) {
    console.error('쿼리 실행 오류:', error);
  } finally {
    await pool.end();
  }
}

run();
