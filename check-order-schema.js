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
    // b_payment_border 테이블의 컬럼 조회
    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'b_payment_border'
        AND column_name LIKE '%user%'
      ORDER BY ordinal_position
    `);

    console.log('\n=== b_payment_border 테이블에서 user 관련 컬럼 ===\n');
    console.log(`총 ${result.rows.length}개의 컬럼:\n`);

    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
    });

    console.log('\n');

  } catch (error) {
    console.error('스키마 조회 오류:', error);
  } finally {
    await pool.end();
  }
}

run();
