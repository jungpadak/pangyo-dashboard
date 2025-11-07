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

async function run() {
  try {
    const excludeConditions = `
      AND m.title NOT LIKE '%PT%'
      AND m.title NOT LIKE '%개인레슨%'
      AND m.title NOT LIKE '%프라이빗레슨%'
      AND m.title NOT LIKE '%그룹레슨%'
      AND m.title NOT LIKE '%1일%'
      AND m.title NOT LIKE '%체험%'
      AND m.title NOT LIKE '%골프락커%'
      AND m.title NOT LIKE '%시설대관%'
      AND m.title NOT LIKE '%제휴업체%'
    `;

    // 전체 유효회원 수
    const totalQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
    `);

    // B2C 회원 수 (법인/입주사/위메이드 제외)
    const b2cQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
        AND m.title NOT LIKE '%법인%'
        AND m.title NOT LIKE '%회원사%'
        AND m.title NOT LIKE '%입주사%'
        AND m.title NOT LIKE '%위메이드%'
    `);

    // 비B2C 회원 수 (법인/입주사/위메이드)
    const nonB2cQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
        AND (
          m.title LIKE '%법인%'
          OR m.title LIKE '%회원사%'
          OR m.title LIKE '%입주사%'
          OR m.title LIKE '%위메이드%'
        )
    `);

    const total = parseInt(totalQuery.rows[0].count);
    const b2c = parseInt(b2cQuery.rows[0].count);
    const nonB2c = parseInt(nonB2cQuery.rows[0].count);

    console.log('\n=== 판교벤처타운 유효회원 통계 ===\n');
    console.log(`전체 유효회원: ${total}명`);
    console.log(`\nB2C 회원: ${b2c}명 (${((b2c/total)*100).toFixed(1)}%)`);
    console.log(`비B2C 회원 (법인/입주사/위메이드): ${nonB2c}명 (${((nonB2c/total)*100).toFixed(1)}%)`);
    console.log(`\n검증: ${b2c} + ${nonB2c} = ${b2c + nonB2c}명 (전체 ${total}명)`);

    if (b2c + nonB2c === total) {
      console.log('✅ 숫자가 일치합니다!');
    } else {
      console.log('⚠️  숫자가 일치하지 않습니다!');
    }

  } catch (error) {
    console.error('쿼리 실행 오류:', error);
  } finally {
    await pool.end();
  }
}

run();
