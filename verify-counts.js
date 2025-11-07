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

async function verifyCounts() {
  try {
    console.log('\n=== 판교벤처타운 회원 수 크로스체크 ===\n');

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

    // 1. 현재 API에서 사용하는 조건 (is_active = true, end_date >= CURRENT_DATE, 필터, refund 제외)
    const currentApiCount = await pool.query(`
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

    // 2. is_active만 체크 (end_date 무시)
    const activeOnlyCount = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
    `);

    // 3. end_date 조건만 (is_active 무시)
    const endDateOnlyCount = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
    `);

    // 4. 제외 조건 없이 (PT, 레슨 등 포함)
    const noExcludeCount = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
    `);

    // 5. refund 포함
    const withRefundCount = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        ${excludeConditions}
    `);

    // 6. 모든 조건 없이
    const allMembersCount = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE o.b_place_id = 26
    `);

    // 7. 현재 유효한 멤버십 (가장 단순한 조건)
    const simpleValidCount = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
    `);

    // 8. end_date와 begin_date 사이에 오늘이 있는 회원
    const todayBetweenCount = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.begin_date <= CURRENT_DATE
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
    `);

    console.log('1. 현재 API 조건 (is_active=true, end_date>=오늘, 필터적용, refund제외):');
    console.log(`   ${currentApiCount.rows[0].count}명\n`);

    console.log('2. is_active만 체크 (만료된 회원 포함):');
    console.log(`   ${activeOnlyCount.rows[0].count}명\n`);

    console.log('3. end_date만 체크 (is_active 무시):');
    console.log(`   ${endDateOnlyCount.rows[0].count}명\n`);

    console.log('4. 제외 조건 없이 (PT, 레슨 등 포함):');
    console.log(`   ${noExcludeCount.rows[0].count}명\n`);

    console.log('5. refund 포함:');
    console.log(`   ${withRefundCount.rows[0].count}명\n`);

    console.log('6. 모든 판교 회원 (만료, refund 모두 포함):');
    console.log(`   ${allMembersCount.rows[0].count}명\n`);

    console.log('7. 가장 단순한 유효회원 (end_date>=오늘, place_id=26):');
    console.log(`   ${simpleValidCount.rows[0].count}명\n`);

    console.log('8. 오늘이 begin_date와 end_date 사이에 있는 회원:');
    console.log(`   ${todayBetweenCount.rows[0].count}명\n`);

    // 제외된 항목들 확인
    const excludedItems = await pool.query(`
      SELECT m.title, COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        AND (
          m.title LIKE '%PT%'
          OR m.title LIKE '%개인레슨%'
          OR m.title LIKE '%프라이빗레슨%'
          OR m.title LIKE '%그룹레슨%'
          OR m.title LIKE '%1일%'
          OR m.title LIKE '%체험%'
          OR m.title LIKE '%골프락커%'
          OR m.title LIKE '%시설대관%'
          OR m.title LIKE '%제휴업체%'
        )
      GROUP BY m.title
      ORDER BY count DESC
    `);

    console.log('=== 제외된 항목들 ===\n');
    excludedItems.rows.forEach(row => {
      console.log(`${row.title}: ${row.count}명`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await pool.end();
  }
}

verifyCounts();
