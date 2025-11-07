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
    // b_payment_border 테이블의 모든 컬럼 조회
    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'b_payment_border'
      ORDER BY ordinal_position
    `);

    console.log('\n=== b_payment_border 테이블 전체 컬럼 ===\n');
    console.log(`총 ${result.rows.length}개의 컬럼:\n`);

    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
    });

    console.log('\n');

    // 환불 관련으로 보이는 컬럼 찾기
    const refundColumns = result.rows.filter(row =>
      row.column_name.toLowerCase().includes('refund') ||
      row.column_name.toLowerCase().includes('cancel') ||
      row.column_name.toLowerCase().includes('status') ||
      row.column_name.toLowerCase().includes('is_')
    );

    console.log('=== 환불/상태 관련 컬럼 ===\n');
    refundColumns.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('스키마 조회 오류:', error);
  } finally {
    await pool.end();
  }
}

run();
