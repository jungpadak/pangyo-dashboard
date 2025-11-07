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
    // 역삼은 가장 주문 건수가 많은 Place ID 1로 추정
    const yeoksamPlaceId = 1;
    console.log(`\n역삼 지점으로 추정되는 place_id: ${yeoksamPlaceId}\n`);

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
        AND o.b_place_id = $1
        AND t.is_refund = false
        ${excludeConditions}
    `, [yeoksamPlaceId]);

    // B2B 회원: 0원 결제 OR 상품명에 "법인" 포함
    const b2bQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = $1
        AND t.is_refund = false
        ${excludeConditions}
        AND (
          o.total_price = 0
          OR o.total_price IS NULL
          OR m.title LIKE '%법인%'
        )
    `, [yeoksamPlaceId]);

    // B2C 회원: 유료 결제 AND 상품명에 "법인" 미포함
    const b2cQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = $1
        AND t.is_refund = false
        ${excludeConditions}
        AND o.total_price > 0
        AND m.title NOT LIKE '%법인%'
    `, [yeoksamPlaceId]);

    // 0원 결제만
    const zeroPriceQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = $1
        AND t.is_refund = false
        ${excludeConditions}
        AND (o.total_price = 0 OR o.total_price IS NULL)
    `, [yeoksamPlaceId]);

    // 상품명에 "법인" 포함
    const corporateQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = $1
        AND t.is_refund = false
        ${excludeConditions}
        AND m.title LIKE '%법인%'
    `, [yeoksamPlaceId]);

    // 법인이면서 유료 결제인 회원
    const corporatePaidQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = $1
        AND t.is_refund = false
        ${excludeConditions}
        AND m.title LIKE '%법인%'
        AND o.total_price > 0
    `, [yeoksamPlaceId]);

    const total = parseInt(totalQuery.rows[0].count);
    const b2b = parseInt(b2bQuery.rows[0].count);
    const b2c = parseInt(b2cQuery.rows[0].count);
    const zeroPrice = parseInt(zeroPriceQuery.rows[0].count);
    const corporate = parseInt(corporateQuery.rows[0].count);
    const corporatePaid = parseInt(corporatePaidQuery.rows[0].count);

    console.log('\n=== 역삼 회원 분류 (결제금액 + 상품명 기준) ===\n');
    console.log(`전체 유효회원: ${total}명\n`);

    console.log('--- B2B 회원 분석 ---');
    console.log(`B2B 전체: ${b2b}명 (${total > 0 ? ((b2b/total)*100).toFixed(1) : 0}%)`);
    console.log(`  ├─ 0원 결제: ${zeroPrice}명`);
    console.log(`  ├─ 상품명에 "법인" 포함: ${corporate}명`);
    console.log(`  └─ 법인 중 유료 결제: ${corporatePaid}명\n`);

    console.log('--- B2C 회원 ---');
    console.log(`B2C 전체: ${b2c}명 (${total > 0 ? ((b2c/total)*100).toFixed(1) : 0}%)`);
    console.log(`  └─ 유료 결제 & 법인 미포함\n`);

    console.log('--- 검증 ---');
    console.log(`B2B + B2C = ${b2b} + ${b2c} = ${b2b + b2c}명 (전체 ${total}명)`);

    if (b2b + b2c === total) {
      console.log('✅ 숫자가 일치합니다!');
    } else {
      console.log('⚠️  숫자가 일치하지 않습니다!');
      console.log(`차이: ${total - (b2b + b2c)}명`);
    }

    // 판교와 비교
    console.log('\n\n=== 판교와 비교 ===');
    console.log('판교벤처타운: 987명 (B2B: 744명 75.4%, B2C: 243명 24.6%)');
    console.log(`역삼: ${total}명 (B2B: ${b2b}명 ${total > 0 ? ((b2b/total)*100).toFixed(1) : 0}%, B2C: ${b2c}명 ${total > 0 ? ((b2c/total)*100).toFixed(1) : 0}%)`);

  } catch (error) {
    console.error('쿼리 실행 오류:', error);
  } finally {
    await pool.end();
  }
}

run();
