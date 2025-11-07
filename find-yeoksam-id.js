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
    // b_payment_border 테이블에서 사용되는 b_place_id 목록 조회
    const placeIdsQuery = await pool.query(`
      SELECT DISTINCT o.b_place_id, COUNT(*) as count
      FROM b_payment_border o
      GROUP BY o.b_place_id
      ORDER BY o.b_place_id
    `);

    console.log('\n=== b_payment_border에서 사용 중인 place_id 목록 ===\n');
    placeIdsQuery.rows.forEach(row => {
      console.log(`Place ID: ${row.b_place_id}, 주문 건수: ${row.count}`);
    });

    console.log('\n판교벤처타운은 place_id = 26입니다.');
    console.log('역삼은 어떤 place_id일까요? (보통 1, 2, 3 등이 역삼일 가능성이 높습니다)');

  } catch (error) {
    console.error('쿼리 실행 오류:', error);
  } finally {
    await pool.end();
  }
}

run();
