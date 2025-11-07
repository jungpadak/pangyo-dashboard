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
    // 모든 테이블 목록 조회
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE '%user%'
      ORDER BY table_name
    `);

    console.log('\n=== User 관련 테이블 목록 ===\n');
    console.log(`총 ${result.rows.length}개의 테이블 발견:\n`);

    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.table_name}`);
    });

    console.log('\n');

  } catch (error) {
    console.error('테이블 조회 오류:', error);
  } finally {
    await pool.end();
  }
}

run();
