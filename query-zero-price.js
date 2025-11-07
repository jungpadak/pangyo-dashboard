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
  m.title as membership_title,
  m.begin_date,
  m.end_date,
  o.total_price,
  o.b_product_info
FROM b_class_bmembership m
JOIN b_payment_btransaction t ON m.transaction_id = t.id
JOIN b_payment_border o ON t.order_id = o.id
WHERE m.is_active = true
  AND m.end_date >= CURRENT_DATE
  AND o.b_place_id = 26
  AND (o.total_price = 0 OR o.total_price IS NULL)
  AND m.title NOT LIKE '%PT%'
  AND m.title NOT LIKE '%개인레슨%'
  AND m.title NOT LIKE '%프라이빗레슨%'
  AND m.title NOT LIKE '%그룹레슨%'
  AND m.title NOT LIKE '%1일%'
  AND m.title NOT LIKE '%체험%'
  AND m.title NOT LIKE '%골프락커%'
  AND m.title NOT LIKE '%시설대관%'
  AND m.title NOT LIKE '%제휴업체%'
ORDER BY m.end_date DESC
LIMIT 20;
`;

async function run() {
  try {
    const result = await pool.query(query);
    console.log('\n=== 0원 결제자 명단 (처음 20명) ===\n');
    console.log(`총 ${result.rows.length}명 조회됨\n`);

    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ID: ${row.id}`);
      console.log(`   멤버십: ${row.membership_title}`);
      console.log(`   시작일: ${row.begin_date.toISOString().split('T')[0]}`);
      console.log(`   종료일: ${row.end_date.toISOString().split('T')[0]}`);
      console.log(`   결제금액: ${row.total_price || 0}원`);
      console.log('');
    });

    // 전체 카운트도 조회
    const countResult = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND (o.total_price = 0 OR o.total_price IS NULL)
        AND m.title NOT LIKE '%PT%'
        AND m.title NOT LIKE '%개인레슨%'
        AND m.title NOT LIKE '%프라이빗레슨%'
        AND m.title NOT LIKE '%그룹레슨%'
        AND m.title NOT LIKE '%1일%'
        AND m.title NOT LIKE '%체험%'
        AND m.title NOT LIKE '%골프락커%'
        AND m.title NOT LIKE '%시설대관%'
        AND m.title NOT LIKE '%제휴업체%'
    `);

    console.log(`전체 0원 결제자: ${countResult.rows[0].count}명`);

  } catch (error) {
    console.error('쿼리 실행 오류:', error);
  } finally {
    await pool.end();
  }
}

run();
