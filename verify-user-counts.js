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

async function verifyUserCounts() {
  try {
    console.log('\n=== 회원 수 vs 멤버십 수 비교 ===\n');

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

    // 1. 유니크 회원 수 (필터 적용)
    const uniqueUsersFiltered = await pool.query(`
      SELECT COUNT(DISTINCT o.user_id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
    `);

    // 2. 멤버십 수 (필터 적용)
    const membershipsFiltered = await pool.query(`
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

    // 3. 유니크 회원 수 (필터 미적용)
    const uniqueUsersUnfiltered = await pool.query(`
      SELECT COUNT(DISTINCT o.user_id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
    `);

    // 4. 멤버십 수 (필터 미적용)
    const membershipsUnfiltered = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
    `);

    // 5. 여러 멤버십을 가진 회원 수
    const multiMembershipUsers = await pool.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT o.user_id, COUNT(DISTINCT m.id) as membership_count
        FROM b_class_bmembership m
        JOIN b_payment_btransaction t ON m.transaction_id = t.id
        JOIN b_payment_border o ON t.order_id = o.id
        WHERE m.is_active = true
          AND m.end_date >= CURRENT_DATE
          AND o.b_place_id = 26
          AND t.is_refund = false
          ${excludeConditions}
        GROUP BY o.user_id
        HAVING COUNT(DISTINCT m.id) > 1
      ) as multi_users
    `);

    // 6. 멤버십을 2개 이상 가진 회원들의 상세 정보
    const multiDetail = await pool.query(`
      SELECT
        o.user_id,
        u.name as user_name,
        COUNT(DISTINCT m.id) as membership_count,
        STRING_AGG(DISTINCT m.title, ' | ') as memberships
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
      GROUP BY o.user_id, u.name
      HAVING COUNT(DISTINCT m.id) > 1
      ORDER BY membership_count DESC
      LIMIT 10
    `);

    console.log('### 필터 적용 (PT, 레슨 등 제외) ###');
    console.log(`유니크 회원 수: ${uniqueUsersFiltered.rows[0].count}명`);
    console.log(`멤버십 수: ${membershipsFiltered.rows[0].count}개`);
    console.log(`차이: ${parseInt(membershipsFiltered.rows[0].count) - parseInt(uniqueUsersFiltered.rows[0].count)}개 (한 회원이 여러 멤버십 보유)\n`);

    console.log('### 필터 미적용 (모든 상품 포함) ###');
    console.log(`유니크 회원 수: ${uniqueUsersUnfiltered.rows[0].count}명`);
    console.log(`멤버십 수: ${membershipsUnfiltered.rows[0].count}개`);
    console.log(`차이: ${parseInt(membershipsUnfiltered.rows[0].count) - parseInt(uniqueUsersUnfiltered.rows[0].count)}개\n`);

    console.log(`여러 멤버십을 가진 회원: ${multiMembershipUsers.rows[0].count}명\n`);

    console.log('=== 여러 멤버십을 가진 회원 예시 (상위 10명) ===\n');
    multiDetail.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.user_name || '정보없음'} (user_id: ${row.user_id})`);
      console.log(`   멤버십 수: ${row.membership_count}개`);
      console.log(`   상품: ${row.memberships}`);
      console.log('');
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await pool.end();
  }
}

verifyUserCounts();
