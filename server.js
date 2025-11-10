import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;
const app = express();
const port = 3003;

// PostgreSQL 연결 풀 설정
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

// Google Sheets 데이터 캐시
let companyMappingCache = new Map();

// Google Sheets에서 회원-법인 매핑 데이터 가져오기
async function fetchCompanyMappingData() {
  try {
    console.log('📊 Google Sheets 데이터를 가져옵니다...');
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/146URXXeql_Y8S5kSbnCP5IPnzIMy30hbRcP0mLoBcvU/export?format=csv&gid=370135236';

    const response = await axios.get(sheetUrl);
    const records = parse(response.data, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // externalUserId를 키로 하는 Map 생성
    const newMapping = new Map();
    let count = 0;

    for (const record of records) {
      const externalUserId = record['externalUserId'];
      const companyName = record['법인명'];
      const companyId = record['법인ID'];
      const tenantType = record['입주사구분'];
      const memberType = record['기존신규'];

      if (externalUserId && externalUserId !== '-') {
        newMapping.set(externalUserId, {
          companyName: companyName && companyName !== '-' ? companyName : null,
          companyId: companyId && companyId !== '-' ? companyId : null,
          tenantType: tenantType && tenantType !== '-' ? tenantType : null,
          memberType: memberType && memberType !== '-' ? memberType : null
        });
        count++;
      }
    }

    companyMappingCache = newMapping;
    console.log(`✅ Google Sheets 데이터 로드 완료: ${count}개 매핑`);

  } catch (error) {
    console.error('❌ Google Sheets 데이터 로드 실패:', error.message);
  }
}

// 서버 시작 시 한 번 로드
fetchCompanyMappingData();

// 1시간마다 자동 갱신
setInterval(fetchCompanyMappingData, 60 * 60 * 1000);

// 미들웨어
app.use(cors());
app.use(express.json());

// 데이터베이스 연결 테스트
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ DB 연결 실패:', err);
  } else {
    console.log('✅ DB 연결 성공:', res.rows[0].now);
  }
});

// 테이블 목록 조회 API
app.get('/api/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({
      success: true,
      tables: result.rows.map(row => row.table_name)
    });
  } catch (error) {
    console.error('테이블 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 테이블 스키마 조회 API
app.get('/api/schema/:tableName', async (req, res) => {
  const { tableName } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    res.json({
      success: true,
      tableName,
      columns: result.rows
    });
  } catch (error) {
    console.error('스키마 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 테이블 데이터 샘플 조회 API
app.get('/api/data/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const limit = req.query.limit || 10;

  try {
    // 테이블명 검증 (SQL 인젝션 방지)
    const tableCheck = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1`,
      [tableName]
    );

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '테이블을 찾을 수 없습니다'
      });
    }

    const result = await pool.query(
      `SELECT * FROM "${tableName}" LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      tableName,
      rowCount: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 판교벤처타운 유효회원 통계 API
app.get('/api/pangyo-stats', async (req, res) => {
  try {
    // 제외할 패턴: PT, 레슨, 1일권, 체험, 골프락커, 시설대관, 제휴업체
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

    // 현재 유효한 멤버십 개수
    const currentMembersQuery = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        ${excludeConditions}
    `);

    // 월별 신규 가입 추이 (최근 12개월)
    const monthlyTrendQuery = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', m.begin_date), 'YYYY-MM') as month,
        COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.begin_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
        AND o.b_place_id = 26
        ${excludeConditions}
      GROUP BY DATE_TRUNC('month', m.begin_date)
      ORDER BY month ASC
    `);

    // 법인 vs 일반 회원 비율
    const membershipTypeQuery = await pool.query(`
      SELECT
        CASE
          WHEN m.title LIKE '%법인%' OR m.title LIKE '%회원사%' THEN 'corporate'
          ELSE 'regular'
        END as type,
        COUNT(DISTINCT m.id) as count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        ${excludeConditions}
      GROUP BY type
    `);

    res.json({
      success: true,
      data: {
        currentMembers: parseInt(currentMembersQuery.rows[0]?.count || 0),
        monthlyTrend: monthlyTrendQuery.rows.map(row => ({
          month: row.month,
          count: parseInt(row.count)
        })),
        membershipType: {
          corporate: parseInt(membershipTypeQuery.rows.find(r => r.type === 'corporate')?.count || 0),
          regular: parseInt(membershipTypeQuery.rows.find(r => r.type === 'regular')?.count || 0)
        }
      }
    });
  } catch (error) {
    console.error('판교 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 판교벤처타운 Raw 데이터 API
app.get('/api/pangyo-raw-data', async (req, res) => {
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

    // 멤버십 타입별 상세 데이터 (0원/유료 구분)
    const membershipByType = await pool.query(`
      SELECT
        m.title,
        COUNT(DISTINCT CASE WHEN o.total_price = 0 OR o.total_price IS NULL THEN m.id END) as zero_price_count,
        COUNT(DISTINCT CASE WHEN o.total_price > 0 THEN m.id END) as paid_count,
        COUNT(DISTINCT m.id) as total_count
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        ${excludeConditions}
      GROUP BY m.title
      ORDER BY total_count DESC, m.title ASC
    `);

    // 전체 요약
    const summary = await pool.query(`
      SELECT
        COUNT(DISTINCT m.id) as total_members,
        COUNT(DISTINCT CASE WHEN o.total_price = 0 OR o.total_price IS NULL THEN m.id END) as zero_price_members,
        COUNT(DISTINCT CASE WHEN o.total_price > 0 THEN m.id END) as paid_members
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        ${excludeConditions}
    `);

    res.json({
      success: true,
      data: {
        summary: {
          totalMembers: parseInt(summary.rows[0].total_members),
          zeroPriceMembers: parseInt(summary.rows[0].zero_price_members),
          paidMembers: parseInt(summary.rows[0].paid_members)
        },
        membershipTypes: membershipByType.rows.map(row => ({
          title: row.title,
          zeroPriceCount: parseInt(row.zero_price_count),
          paidCount: parseInt(row.paid_count),
          totalCount: parseInt(row.total_count)
        }))
      }
    });
  } catch (error) {
    console.error('Raw 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 판교벤처타운 회원 상세 리스트 API
app.get('/api/pangyo-members', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

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

    // 전체 카운트
    const countResult = await pool.query(`
      SELECT COUNT(DISTINCT m.id) as total
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        ${excludeConditions}
    `);

    // 회원 목록
    const membersResult = await pool.query(`
      SELECT DISTINCT ON (m.id)
        m.id,
        u.name as user_name,
        u.phone_number as user_phone,
        m.title as membership_title,
        m.begin_date,
        m.end_date,
        o.total_price,
        o.b_product_info
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        ${excludeConditions}
      ORDER BY m.id DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        members: membersResult.rows.map(row => ({
          id: row.id,
          userName: row.user_name,
          userPhone: row.user_phone,
          membershipTitle: row.membership_title,
          beginDate: row.begin_date,
          endDate: row.end_date,
          totalPrice: row.total_price || 0,
          productInfo: row.b_product_info
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        }
      }
    });
  } catch (error) {
    console.error('회원 리스트 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 세그먼트별 회원 통계 API (기존/신규)
app.get('/api/pangyo-segments', async (req, res) => {
  try {
    // view 파라미터: 'valid' (기본, 유효회원만) 또는 'all' (전체 회원)
    const view = req.query.view || 'valid';

    // month 파라미터 받기 (없으면 현재 월)
    const requestedMonth = req.query.month;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth = requestedMonth || currentMonth;

    // view=valid일 때만 필터 적용
    const excludeConditions = view === 'valid' ? `
      AND m.title NOT LIKE '%PT%'
      AND m.title NOT LIKE '%개인레슨%'
      AND m.title NOT LIKE '%프라이빗레슨%'
      AND m.title NOT LIKE '%그룹레슨%'
      AND m.title NOT LIKE '%1일%'
      AND m.title NOT LIKE '%체험%'
      AND m.title NOT LIKE '%골프락커%'
      AND m.title NOT LIKE '%시설대관%'
      AND m.title NOT LIKE '%제휴업체%'
    ` : '';

    // 월의 시작일과 종료일 계산
    const monthStart = `${targetMonth}-01`;
    const nextMonth = new Date(targetMonth + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(0);
    const monthEnd = `${targetMonth}-${String(nextMonth.getDate()).padStart(2, '0')}`;

    // 현재 월 여부 확인
    const isCurrentMonth = targetMonth === currentMonth;
    const isOctober2025 = targetMonth === '2025-10';

    // 전체 회원 조회 (유효 + 만료)
    // end_date를 포함하여 유효/만료 상태를 판단
    let allMembersQuery, expiredMembersQuery;

    if (isOctober2025) {
      // 10월: 멤버십 유효기간 기준 (오픈월 특성 - 9월 말 결제 포함)
      // 10월 중 어느 시점에라도 유효했던 멤버십을 모두 포함
      allMembersQuery = await pool.query(`
        SELECT DISTINCT ON (m.id)
          m.id,
          u.id as user_id,
          m.end_date
        FROM b_class_bmembership m
        JOIN b_payment_btransaction t ON m.transaction_id = t.id
        JOIN b_payment_border o ON t.order_id = o.id
        LEFT JOIN user_user u ON o.user_id = u.id
        WHERE m.begin_date <= $2::date
          AND m.end_date >= $1::date
          AND o.b_place_id = 26
          AND t.is_refund = false
          ${excludeConditions}
      `, [monthStart, monthEnd]);

      // 10월 이전에 만료된 회원
      expiredMembersQuery = await pool.query(`
        SELECT DISTINCT ON (m.id)
          m.id,
          u.id as user_id,
          m.end_date
        FROM b_class_bmembership m
        JOIN b_payment_btransaction t ON m.transaction_id = t.id
        JOIN b_payment_border o ON t.order_id = o.id
        LEFT JOIN user_user u ON o.user_id = u.id
        WHERE m.end_date < $1::date
          AND o.b_place_id = 26
          AND t.is_refund = false
          ${excludeConditions}
      `, [monthStart]);
    } else {
      // 다른 월
      const targetDate = isCurrentMonth
        ? now.toISOString().split('T')[0]
        : monthEnd;

      // 유효 회원
      allMembersQuery = await pool.query(`
        SELECT DISTINCT ON (m.id)
          m.id,
          u.id as user_id,
          m.end_date
        FROM b_class_bmembership m
        JOIN b_payment_btransaction t ON m.transaction_id = t.id
        JOIN b_payment_border o ON t.order_id = o.id
        LEFT JOIN user_user u ON o.user_id = u.id
        WHERE m.is_active = true
          AND m.begin_date <= $1::date
          AND m.end_date >= $1::date
          AND o.b_place_id = 26
          AND t.is_refund = false
          ${excludeConditions}
      `, [targetDate]);

      // 만료된 회원 (is_active 조건 제거 - 과거 회원 포함)
      expiredMembersQuery = await pool.query(`
        SELECT DISTINCT ON (m.id)
          m.id,
          u.id as user_id,
          m.end_date
        FROM b_class_bmembership m
        JOIN b_payment_btransaction t ON m.transaction_id = t.id
        JOIN b_payment_border o ON t.order_id = o.id
        LEFT JOIN user_user u ON o.user_id = u.id
        WHERE m.end_date < $1::date
          AND o.b_place_id = 26
          AND t.is_refund = false
          ${excludeConditions}
      `, [targetDate]);
    }

    // Google Sheets 데이터로 분류 (user_id 기준 unique 카운트)
    // 유효 회원
    const activeExistingUserIds = new Set();
    const activeNewUserIds = new Set();
    const activeWemadeUserIds = new Set();
    const activeOtherTenantUserIds = new Set();
    const activeNonTenantUserIds = new Set();

    allMembersQuery.rows.forEach(row => {
      const userId = row.user_id ? String(row.user_id) : null;
      if (!userId) return;

      const memberInfo = companyMappingCache.get(userId);

      if (memberInfo?.memberType === '기존') {
        activeExistingUserIds.add(userId);

        if (memberInfo?.tenantType === '입주사(위메이드)') {
          activeWemadeUserIds.add(userId);
        } else if (memberInfo?.tenantType === '입주사(위메이드 외)') {
          activeOtherTenantUserIds.add(userId);
        } else if (memberInfo?.tenantType === '비입주사') {
          activeNonTenantUserIds.add(userId);
        }
      } else {
        activeNewUserIds.add(userId);
      }
    });

    // 만료된 회원
    const expiredExistingUserIds = new Set();
    const expiredNewUserIds = new Set();
    const expiredWemadeUserIds = new Set();
    const expiredOtherTenantUserIds = new Set();
    const expiredNonTenantUserIds = new Set();

    expiredMembersQuery.rows.forEach(row => {
      const userId = row.user_id ? String(row.user_id) : null;
      if (!userId) return;

      const memberInfo = companyMappingCache.get(userId);

      if (memberInfo?.memberType === '기존') {
        expiredExistingUserIds.add(userId);

        if (memberInfo?.tenantType === '입주사(위메이드)') {
          expiredWemadeUserIds.add(userId);
        } else if (memberInfo?.tenantType === '입주사(위메이드 외)') {
          expiredOtherTenantUserIds.add(userId);
        } else if (memberInfo?.tenantType === '비입주사') {
          expiredNonTenantUserIds.add(userId);
        }
      } else {
        expiredNewUserIds.add(userId);
      }
    });

    // 집계
    const activeTotal = activeExistingUserIds.size + activeNewUserIds.size;
    const expiredTotal = expiredExistingUserIds.size + expiredNewUserIds.size;

    // 중복 제거: 유효와 만료 회원을 합친 후 unique user_id 카운트
    const allUniqueUserIds = new Set([
      ...activeExistingUserIds,
      ...activeNewUserIds,
      ...expiredExistingUserIds,
      ...expiredNewUserIds
    ]);
    const allUniqueTotal = allUniqueUserIds.size;

    // view에 따라 total 결정
    // view=valid: 유효회원만 (기본)
    // view=all: 중복제거된 전체 회원
    const total = view === 'valid' ? activeTotal : allUniqueTotal;

    console.log(`📊 세그먼트 집계 (${targetMonth}, view=${view}): 전체=${total}, 유효=${activeTotal}, 만료=${expiredTotal}`);

    res.json({
      success: true,
      data: {
        month: targetMonth,
        total,
        active: {
          total: activeTotal,
          percentage: total > 0 ? ((activeTotal / total) * 100).toFixed(1) : 0,
          segments: {
            existing: {
              count: activeExistingUserIds.size,
              percentage: activeTotal > 0 ? ((activeExistingUserIds.size / activeTotal) * 100).toFixed(1) : 0,
              subSegments: {
                wemade: {
                  count: activeWemadeUserIds.size,
                  percentage: activeExistingUserIds.size > 0 ? ((activeWemadeUserIds.size / activeExistingUserIds.size) * 100).toFixed(1) : 0
                },
                otherTenant: {
                  count: activeOtherTenantUserIds.size,
                  percentage: activeExistingUserIds.size > 0 ? ((activeOtherTenantUserIds.size / activeExistingUserIds.size) * 100).toFixed(1) : 0
                },
                nonTenant: {
                  count: activeNonTenantUserIds.size,
                  percentage: activeExistingUserIds.size > 0 ? ((activeNonTenantUserIds.size / activeExistingUserIds.size) * 100).toFixed(1) : 0
                }
              }
            },
            new: {
              count: activeNewUserIds.size,
              percentage: activeTotal > 0 ? ((activeNewUserIds.size / activeTotal) * 100).toFixed(1) : 0
            }
          }
        },
        expired: {
          total: expiredTotal,
          percentage: total > 0 ? ((expiredTotal / total) * 100).toFixed(1) : 0,
          segments: {
            existing: {
              count: expiredExistingUserIds.size,
              percentage: expiredTotal > 0 ? ((expiredExistingUserIds.size / expiredTotal) * 100).toFixed(1) : 0,
              subSegments: {
                wemade: {
                  count: expiredWemadeUserIds.size,
                  percentage: expiredExistingUserIds.size > 0 ? ((expiredWemadeUserIds.size / expiredExistingUserIds.size) * 100).toFixed(1) : 0
                },
                otherTenant: {
                  count: expiredOtherTenantUserIds.size,
                  percentage: expiredExistingUserIds.size > 0 ? ((expiredOtherTenantUserIds.size / expiredExistingUserIds.size) * 100).toFixed(1) : 0
                },
                nonTenant: {
                  count: expiredNonTenantUserIds.size,
                  percentage: expiredExistingUserIds.size > 0 ? ((expiredNonTenantUserIds.size / expiredExistingUserIds.size) * 100).toFixed(1) : 0
                }
              }
            },
            new: {
              count: expiredNewUserIds.size,
              percentage: expiredTotal > 0 ? ((expiredNewUserIds.size / expiredTotal) * 100).toFixed(1) : 0
            }
          }
        },
        // 하위 호환성을 위해 기존 필드 유지 (유효 회원만)
        segments: {
          existing: {
            count: activeExistingUserIds.size,
            percentage: activeTotal > 0 ? ((activeExistingUserIds.size / activeTotal) * 100).toFixed(1) : 0,
            subSegments: {
              wemade: {
                count: activeWemadeUserIds.size,
                percentage: activeExistingUserIds.size > 0 ? ((activeWemadeUserIds.size / activeExistingUserIds.size) * 100).toFixed(1) : 0
              },
              otherTenant: {
                count: activeOtherTenantUserIds.size,
                percentage: activeExistingUserIds.size > 0 ? ((activeOtherTenantUserIds.size / activeExistingUserIds.size) * 100).toFixed(1) : 0
              },
              nonTenant: {
                count: activeNonTenantUserIds.size,
                percentage: activeExistingUserIds.size > 0 ? ((activeNonTenantUserIds.size / activeExistingUserIds.size) * 100).toFixed(1) : 0
              }
            }
          },
          new: {
            count: activeNewUserIds.size,
            percentage: activeTotal > 0 ? ((activeNewUserIds.size / activeTotal) * 100).toFixed(1) : 0
          }
        }
      }
    });
  } catch (error) {
    console.error('세그먼트 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 세그먼트별 회원 리스트 API
app.get('/api/pangyo-segment-members/:segment', async (req, res) => {
  try {
    const { segment } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

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

    // 전체 회원 조회
    const allMembersResult = await pool.query(`
      SELECT DISTINCT ON (m.id)
        m.id,
        u.id as user_id,
        u.name as user_name,
        u.phone_number as user_phone,
        m.title as membership_title,
        m.begin_date,
        m.end_date,
        o.total_price,
        o.b_product_info
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
      ORDER BY m.id DESC
    `);

    // 세그먼트별로 필터링
    let filteredMembers = allMembersResult.rows.filter(row => {
      const userId = row.user_id ? String(row.user_id) : null;
      const memberInfo = userId ? companyMappingCache.get(userId) : null;

      if (segment === 'all') {
        return true; // 전체 회원 표시
      } else if (segment === 'existing') {
        return memberInfo?.memberType === '기존';
      } else if (segment === 'new') {
        return memberInfo?.memberType === '신규' || !memberInfo?.memberType;
      } else if (segment === 'wemade') {
        return memberInfo?.memberType === '기존' && memberInfo?.tenantType === '입주사(위메이드)';
      } else if (segment === 'otherTenant') {
        return memberInfo?.memberType === '기존' && memberInfo?.tenantType === '입주사(위메이드 외)';
      } else if (segment === 'nonTenant') {
        return memberInfo?.memberType === '기존' && memberInfo?.tenantType === '비입주사';
      }
      return false;
    });

    // 검색 필터 적용 (세그먼트 필터 이후, 페이지네이션 이전)
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredMembers = filteredMembers.filter(row => {
        const userId = row.user_id ? String(row.user_id) : null;
        const memberInfo = userId ? companyMappingCache.get(userId) : null;

        const nameMatch = row.user_name && row.user_name.toLowerCase().includes(lowerSearchTerm);
        const phoneMatch = row.user_phone && row.user_phone.includes(searchTerm);
        const companyMatch = memberInfo?.companyName && memberInfo.companyName.toLowerCase().includes(lowerSearchTerm);

        return nameMatch || phoneMatch || companyMatch;
      });
    }

    // 페이지네이션
    const totalCount = filteredMembers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedMembers = filteredMembers.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        segment,
        members: paginatedMembers.map(row => {
          const userId = row.user_id ? String(row.user_id) : null;
          const memberInfo = userId ? companyMappingCache.get(userId) : null;

          return {
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            userPhone: row.user_phone,
            membershipTitle: row.membership_title,
            beginDate: row.begin_date,
            endDate: row.end_date,
            totalPrice: row.total_price || 0,
            productInfo: row.b_product_info,
            companyName: memberInfo?.companyName || null,
            companyId: memberInfo?.companyId || null,
            tenantType: memberInfo?.tenantType || null,
            memberType: memberInfo?.memberType || null
          };
        }),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        }
      }
    });
  } catch (error) {
    console.error('세그먼트 회원 리스트 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 법인별 통계 API
app.get('/api/company-stats', async (req, res) => {
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

    // 전체 회원 조회
    const allMembersResult = await pool.query(`
      SELECT DISTINCT ON (m.id)
        m.id,
        u.id as user_id
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE m.is_active = true
        AND m.end_date >= CURRENT_DATE
        AND o.b_place_id = 26
        AND t.is_refund = false
        ${excludeConditions}
    `);

    // 법인별로 집계 (user_id 기준 unique 카운트)
    const companyStats = new Map();

    allMembersResult.rows.forEach(row => {
      const userId = row.user_id ? String(row.user_id) : null;
      if (!userId) return; // userId가 없으면 스킵

      const memberInfo = companyMappingCache.get(userId);

      if (memberInfo?.companyName) {
        const company = memberInfo.companyName;
        if (!companyStats.has(company)) {
          companyStats.set(company, {
            companyName: company,
            tenantType: memberInfo.tenantType,
            userIds: new Set()
          });
        }
        companyStats.get(company).userIds.add(userId);
      }
    });

    // Set을 count로 변환
    companyStats.forEach((data, key) => {
      companyStats.set(key, {
        companyName: data.companyName,
        tenantType: data.tenantType,
        count: data.userIds.size
      });
    });

    // Map을 배열로 변환하고 회원수 기준 내림차순 정렬
    const sortedCompanies = Array.from(companyStats.values())
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        totalCompanies: sortedCompanies.length,
        companies: sortedCompanies
      }
    });
  } catch (error) {
    console.error('법인별 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 법인별 월별 추이 데이터 API (Dashboard용)
app.get('/api/dashboard-data', async (req, res) => {
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

    // 최근 12개월 데이터 조회
    const monthlyDataQuery = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - (n || ' months')::interval), 'YYYY-MM') as month
      FROM generate_series(0, 11) as n
      ORDER BY month ASC
    `);

    const months = monthlyDataQuery.rows.map(r => r.month);
    const result = [];

    // 각 월별로 데이터 조회
    for (const month of months) {
      const monthStart = `${month}-01`;
      // 월의 마지막 날을 정확하게 계산
      const nextMonth = new Date(month + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(0); // 이전 달의 마지막 날
      const monthEnd = `${month}-${String(nextMonth.getDate()).padStart(2, '0')}`;

      // 현재 월 여부 확인
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const isCurrentMonth = month === currentMonth;

      // 오픈월 특별 처리
      const isOctober2025 = month === '2025-10';
      const isOpenMonth = month === '2025-11';

      // 회원수는 항상 유효회원 기준 (과거는 말일, 당월은 오늘)
      const targetDate = isCurrentMonth
        ? now.toISOString().split('T')[0]
        : monthEnd;

      // 회원수 조회
      let membersCountQuery;
      if (isOctober2025) {
        // 10월: 오픈월 특성 - 10월 중 유효했던 모든 멤버십 (9월 말 결제 포함)
        membersCountQuery = await pool.query(`
          SELECT DISTINCT ON (m.id)
            m.id,
            u.id as user_id
          FROM b_class_bmembership m
          JOIN b_payment_btransaction t ON m.transaction_id = t.id
          JOIN b_payment_border o ON t.order_id = o.id
          LEFT JOIN user_user u ON o.user_id = u.id
          WHERE m.begin_date <= $2::date
            AND m.end_date >= $1::date
            AND o.b_place_id = 26
            AND t.is_refund = false
            ${excludeConditions}
        `, [monthStart, monthEnd]);
      } else {
        // 다른 월: 유효회원 기준
        membersCountQuery = await pool.query(`
          SELECT DISTINCT ON (m.id)
            m.id,
            u.id as user_id
          FROM b_class_bmembership m
          JOIN b_payment_btransaction t ON m.transaction_id = t.id
          JOIN b_payment_border o ON t.order_id = o.id
          LEFT JOIN user_user u ON o.user_id = u.id
          WHERE m.is_active = true
            AND m.begin_date <= $1::date
            AND m.end_date >= $1::date
            AND o.b_place_id = 26
            AND t.is_refund = false
            ${excludeConditions}
        `, [targetDate]);
      }

      // 매출 조회
      let membersRevenueQuery, optionsQuery;
      if (isOctober2025) {
        // 10월: 10월 중 유효했던 멤버십의 매출 (9월 말 결제 포함)
        membersRevenueQuery = await pool.query(`
          SELECT DISTINCT ON (m.id)
            m.id,
            u.id as user_id,
            t.final_price as revenue
          FROM b_class_bmembership m
          JOIN b_payment_btransaction t ON m.transaction_id = t.id
          JOIN b_payment_border o ON t.order_id = o.id
          LEFT JOIN user_user u ON o.user_id = u.id
          WHERE m.begin_date <= $2::date
            AND m.end_date >= $1::date
            AND o.b_place_id = 26
            AND t.is_refund = false
            ${excludeConditions}
        `, [monthStart, monthEnd]);

        // 옵션 상품도 10월 유효기간 기준
        optionsQuery = await pool.query(`
          SELECT DISTINCT ON (opt.id)
            opt.id,
            u.id as user_id,
            t.final_price as revenue
          FROM b_class_boption opt
          JOIN b_payment_btransaction t ON opt.transaction_id = t.id
          JOIN b_payment_border o ON t.order_id = o.id
          LEFT JOIN user_user u ON o.user_id = u.id
          WHERE opt.begin_date <= $2::date
            AND opt.end_date >= $1::date
            AND o.b_place_id = 26
            AND t.is_refund = false
        `, [monthStart, monthEnd]);
      } else if (isOpenMonth) {
        // 11월 오픈월: 결제일 기준 매출
        membersRevenueQuery = await pool.query(`
          SELECT DISTINCT ON (m.id)
            m.id,
            u.id as user_id,
            t.final_price as revenue
          FROM b_class_bmembership m
          JOIN b_payment_btransaction t ON m.transaction_id = t.id
          JOIN b_payment_border o ON t.order_id = o.id
          LEFT JOIN user_user u ON o.user_id = u.id
          WHERE m.is_active = true
            AND t.pay_date >= $1::date
            AND t.pay_date <= $2::date
            AND o.b_place_id = 26
            AND t.is_refund = false
            ${excludeConditions}
        `, [monthStart, monthEnd]);

        // 옵션 상품도 결제일 기준
        optionsQuery = await pool.query(`
          SELECT DISTINCT ON (opt.id)
            opt.id,
            u.id as user_id,
            t.final_price as revenue
          FROM b_class_boption opt
          JOIN b_payment_btransaction t ON opt.transaction_id = t.id
          JOIN b_payment_border o ON t.order_id = o.id
          LEFT JOIN user_user u ON o.user_id = u.id
          WHERE opt.is_active = true
            AND t.pay_date >= $1::date
            AND t.pay_date <= $2::date
            AND o.b_place_id = 26
            AND t.is_refund = false
        `, [monthStart, monthEnd]);
      } else {
        // 다른 월: 유효회원의 매출
        membersRevenueQuery = await pool.query(`
          SELECT DISTINCT ON (m.id)
            m.id,
            u.id as user_id,
            t.final_price as revenue
          FROM b_class_bmembership m
          JOIN b_payment_btransaction t ON m.transaction_id = t.id
          JOIN b_payment_border o ON t.order_id = o.id
          LEFT JOIN user_user u ON o.user_id = u.id
          WHERE m.is_active = true
            AND m.begin_date <= $1::date
            AND m.end_date >= $1::date
            AND o.b_place_id = 26
            AND t.is_refund = false
            ${excludeConditions}
        `, [targetDate]);

        // 옵션 상품도 유효기간 기준
        optionsQuery = await pool.query(`
          SELECT DISTINCT ON (opt.id)
            opt.id,
            u.id as user_id,
            t.final_price as revenue
          FROM b_class_boption opt
          JOIN b_payment_btransaction t ON opt.transaction_id = t.id
          JOIN b_payment_border o ON t.order_id = o.id
          LEFT JOIN user_user u ON o.user_id = u.id
          WHERE opt.is_active = true
            AND opt.begin_date <= $1::date
            AND opt.end_date >= $1::date
            AND o.b_place_id = 26
            AND t.is_refund = false
        `, [targetDate]);
      }

      // 법인별로 그룹화 (user_id 기준 unique 카운트)
      const companyData = new Map();

      // 1단계: 멤버십 회원수 집계 (유효회원 기준)
      membersCountQuery.rows.forEach(row => {
        const userId = row.user_id ? String(row.user_id) : null;
        const memberInfo = userId ? companyMappingCache.get(userId) : null;

        // 회사명 결정: 있으면 회사명, 없으면 "미인증 회원"
        const companyName = memberInfo?.companyName || '미인증 회원';
        const key = companyName;

        if (!companyData.has(key)) {
          companyData.set(key, {
            month,
            company: companyName,
            type: memberInfo?.companyName
              ? (memberInfo?.memberType === '기존'
                ? (memberInfo?.tenantType === '입주사(위메이드)' ? '기존_입주사_위메이드' :
                   memberInfo?.tenantType === '입주사(위메이드 외)' ? '기존_입주사_위메이드외' : '기존_비입주사')
                : '신규')
              : '미인증',
            userIds: new Set(),
            revenue: 0
          });
        }
        const data = companyData.get(key);
        if (userId) {
          data.userIds.add(userId);
        }
      });

      // 2단계: 멤버십 매출 추가
      membersRevenueQuery.rows.forEach(row => {
        const userId = row.user_id ? String(row.user_id) : null;
        const memberInfo = userId ? companyMappingCache.get(userId) : null;
        const companyName = memberInfo?.companyName || '미인증 회원';
        const key = companyName;

        // 해당 법인이 존재하면 매출 추가, 없으면 생성 (회원수는 0)
        if (!companyData.has(key)) {
          companyData.set(key, {
            month,
            company: companyName,
            type: memberInfo?.companyName
              ? (memberInfo?.memberType === '기존'
                ? (memberInfo?.tenantType === '입주사(위메이드)' ? '기존_입주사_위메이드' :
                   memberInfo?.tenantType === '입주사(위메이드 외)' ? '기존_입주사_위메이드외' : '기존_비입주사')
                : '신규')
              : '미인증',
            userIds: new Set(),
            revenue: 0
          });
        }
        const data = companyData.get(key);
        data.revenue += row.revenue || 0;
      });

      // 3단계: 옵션 매출 추가
      optionsQuery.rows.forEach(row => {
        const userId = row.user_id ? String(row.user_id) : null;
        const memberInfo = userId ? companyMappingCache.get(userId) : null;
        const companyName = memberInfo?.companyName || '미인증 회원';
        const key = companyName;

        // 해당 법인이 존재하면 매출 추가
        if (!companyData.has(key)) {
          companyData.set(key, {
            month,
            company: companyName,
            type: memberInfo?.companyName
              ? (memberInfo?.memberType === '기존'
                ? (memberInfo?.tenantType === '입주사(위메이드)' ? '기존_입주사_위메이드' :
                   memberInfo?.tenantType === '입주사(위메이드 외)' ? '기존_입주사_위메이드외' : '기존_비입주사')
                : '신규')
              : '미인증',
            userIds: new Set(),
            revenue: 0
          });
        }
        const data = companyData.get(key);
        data.revenue += row.revenue || 0;
      });

      // Set을 members 카운트로 변환
      companyData.forEach((data, key) => {
        companyData.set(key, {
          month: data.month,
          company: data.company,
          type: data.type,
          members: data.userIds.size,
          revenue: data.revenue
        });
      });

      result.push(...Array.from(companyData.values()));
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Dashboard 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 멤버십 판매 현황 API
app.get('/api/membership-sales', async (req, res) => {
  try {
    console.log('🎫 멤버십 판매 현황 조회 시작');

    // 회원-법인 매핑 데이터 확인
    if (companyMappingCache.size === 0) {
      await fetchCompanyMappingData();
    }

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

    // 모든 멤버십 판매 데이터 조회 (월별로 그룹화할 수 있도록)
    const query = `
      SELECT DISTINCT ON (m.id)
        m.id as membership_id,
        m.title as product_name,
        m.begin_date,
        m.end_date,
        t.pay_date,
        o.total_price,
        o.user_id,
        u.id as user_id_check
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE m.is_active = true
        AND o.b_place_id = 26
        AND t.is_refund = false
        AND t.pay_date IS NOT NULL
        ${excludeConditions}
      ORDER BY m.id, t.pay_date DESC
    `;

    const result = await pool.query(query);

    // 월별, 법인별, 상품별로 집계
    const salesByMonth = {};

    result.rows.forEach(row => {
      const payDate = new Date(row.pay_date);
      const month = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`;

      // 법인 정보 가져오기
      const userMapping = companyMappingCache.get(String(row.user_id));
      const companyName = userMapping?.companyName || '미인증';

      // 월별 데이터 초기화
      if (!salesByMonth[month]) {
        salesByMonth[month] = {};
      }

      // 법인별 데이터 초기화
      if (!salesByMonth[month][companyName]) {
        salesByMonth[month][companyName] = {};
      }

      // 상품별 집계
      const productName = row.product_name || '기타';
      if (!salesByMonth[month][companyName][productName]) {
        salesByMonth[month][companyName][productName] = {
          count: 0,
          amount: 0
        };
      }

      salesByMonth[month][companyName][productName].count += 1;
      salesByMonth[month][companyName][productName].amount += parseFloat(row.total_price || 0);
    });

    // 결과를 배열 형태로 변환
    const salesData = [];
    Object.keys(salesByMonth).forEach(month => {
      Object.keys(salesByMonth[month]).forEach(company => {
        Object.keys(salesByMonth[month][company]).forEach(product => {
          const data = salesByMonth[month][company][product];
          salesData.push({
            month,
            company,
            product,
            count: data.count,
            amount: data.amount
          });
        });
      });
    });

    // 월, 법인명, 상품명 순으로 정렬
    salesData.sort((a, b) => {
      if (a.month !== b.month) return b.month.localeCompare(a.month); // 최신 월 먼저
      if (a.company !== b.company) return a.company.localeCompare(b.company);
      return a.product.localeCompare(b.product);
    });

    console.log(`✅ 멤버십 판매 데이터 ${salesData.length}건 조회 완료`);

    res.json({
      success: true,
      data: salesData
    });

  } catch (error) {
    console.error('❌ 멤버십 판매 현황 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 콘텐츠 & 옵션 판매 현황 API
app.get('/api/content-options-sales', async (req, res) => {
  try {
    console.log('🎯 콘텐츠 & 옵션 판매 현황 조회 시작');

    // 회원-법인 매핑 데이터 확인
    if (companyMappingCache.size === 0) {
      await fetchCompanyMappingData();
    }

    // PT, 그룹레슨, 골프 등 부가 서비스 조회
    const includeConditions = `
      AND (
        m.title LIKE '%PT%'
        OR m.title LIKE '%개인레슨%'
        OR m.title LIKE '%프라이빗레슨%'
        OR m.title LIKE '%그룹레슨%'
        OR m.title LIKE '%골프%'
        OR m.title LIKE '%골프락커%'
        OR m.title LIKE '%스쿼시%'
      )
    `;

    // 멤버십에서 부가 서비스 조회
    const membershipQuery = `
      SELECT DISTINCT ON (m.id)
        m.id as item_id,
        m.title as product_name,
        m.begin_date,
        m.end_date,
        t.pay_date,
        o.total_price,
        o.user_id,
        u.id as user_id_check,
        'membership' as item_type
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE m.is_active = true
        AND o.b_place_id = 26
        AND t.is_refund = false
        AND t.pay_date IS NOT NULL
        ${includeConditions}
      ORDER BY m.id, t.pay_date DESC
    `;

    // 옵션 상품 조회 (락커, 운동복 등)
    const optionQuery = `
      SELECT DISTINCT ON (opt.id)
        opt.id as item_id,
        opt.title as product_name,
        opt.begin_date,
        opt.end_date,
        t.pay_date,
        o.total_price,
        o.user_id,
        u.id as user_id_check,
        'option' as item_type
      FROM b_class_boption opt
      JOIN b_payment_btransaction t ON opt.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE opt.is_active = true
        AND o.b_place_id = 26
        AND t.is_refund = false
        AND t.pay_date IS NOT NULL
      ORDER BY opt.id, t.pay_date DESC
    `;

    const [membershipResult, optionResult] = await Promise.all([
      pool.query(membershipQuery),
      pool.query(optionQuery)
    ]);

    // 두 결과를 합침
    const result = {
      rows: [...membershipResult.rows, ...optionResult.rows]
    };

    // 카테고리 분류 함수
    function categorizeProduct(title) {
      const lower = title.toLowerCase();
      if (lower.includes('pt') || lower.includes('개인레슨') || lower.includes('프라이빗')) {
        return 'PT/개인레슨';
      } else if (lower.includes('그룹레슨')) {
        return '그룹레슨';
      } else if (lower.includes('골프') || lower.includes('골프락커')) {
        return '골프';
      } else if (lower.includes('스쿼시')) {
        return '스쿼시';
      } else if (lower.includes('락커')) {
        return '락커';
      } else if (lower.includes('운동복')) {
        return '운동복';
      } else if (lower.includes('수건')) {
        return '수건';
      } else if (lower.includes('샤워')) {
        return '샤워용품';
      }
      return '기타';
    }

    // 월별, 법인별, 카테고리별, 상품별로 집계
    const salesByMonth = {};

    result.rows.forEach(row => {
      const payDate = new Date(row.pay_date);
      const month = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`;

      // 법인 정보 가져오기
      const userMapping = companyMappingCache.get(String(row.user_id));
      const companyName = userMapping?.companyName || '미인증';

      // 카테고리 분류
      const category = categorizeProduct(row.product_name);

      // 월별 데이터 초기화
      if (!salesByMonth[month]) {
        salesByMonth[month] = {};
      }

      // 카테고리별 데이터 초기화
      if (!salesByMonth[month][category]) {
        salesByMonth[month][category] = {
          total: { count: 0, amount: 0 },
          byCompany: {},
          byProduct: {}
        };
      }

      // 전체 집계
      salesByMonth[month][category].total.count += 1;
      salesByMonth[month][category].total.amount += parseFloat(row.total_price || 0);

      // 법인별 집계
      if (!salesByMonth[month][category].byCompany[companyName]) {
        salesByMonth[month][category].byCompany[companyName] = { count: 0, amount: 0 };
      }
      salesByMonth[month][category].byCompany[companyName].count += 1;
      salesByMonth[month][category].byCompany[companyName].amount += parseFloat(row.total_price || 0);

      // 상품별 집계
      const productName = row.product_name || '기타';
      if (!salesByMonth[month][category].byProduct[productName]) {
        salesByMonth[month][category].byProduct[productName] = { count: 0, amount: 0 };
      }
      salesByMonth[month][category].byProduct[productName].count += 1;
      salesByMonth[month][category].byProduct[productName].amount += parseFloat(row.total_price || 0);
    });

    console.log(`✅ 콘텐츠 & 옵션 판매 데이터 조회 완료`);

    res.json({
      success: true,
      data: salesByMonth
    });

  } catch (error) {
    console.error('❌ 콘텐츠 & 옵션 판매 현황 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 전체 회원 리스트 API (회원별 그룹화, 모든 멤버십 표시)
app.get('/api/pangyo-all-members', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    // 모든 멤버십 조회 (유효+만료, 필터 없음)
    const allMembershipsQuery = await pool.query(`
      SELECT
        m.id as membership_id,
        u.id as user_id,
        u.name as user_name,
        u.phone_number as user_phone,
        m.title as membership_title,
        m.begin_date,
        m.end_date,
        m.is_active,
        o.total_price,
        o.b_product_info,
        'membership' as item_type
      FROM b_class_bmembership m
      JOIN b_payment_btransaction t ON m.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE o.b_place_id = 26
        AND t.is_refund = false
        AND u.id IS NOT NULL
      ORDER BY u.id, m.end_date DESC
    `);

    // 모든 옵션 상품 조회
    const allOptionsQuery = await pool.query(`
      SELECT
        opt.id as membership_id,
        u.id as user_id,
        u.name as user_name,
        u.phone_number as user_phone,
        opt.title as membership_title,
        opt.begin_date,
        opt.end_date,
        opt.is_active,
        o.total_price,
        o.b_product_info,
        'option' as item_type
      FROM b_class_boption opt
      JOIN b_payment_btransaction t ON opt.transaction_id = t.id
      JOIN b_payment_border o ON t.order_id = o.id
      LEFT JOIN user_user u ON o.user_id = u.id
      WHERE o.b_place_id = 26
        AND t.is_refund = false
        AND u.id IS NOT NULL
      ORDER BY u.id, opt.end_date DESC
    `);

    // 회원별로 그룹화
    const userMembershipsMap = new Map();
    const now = new Date();

    // 멤버십과 옵션 상품을 하나의 배열로 합치기
    const allItems = [...allMembershipsQuery.rows, ...allOptionsQuery.rows];

    allItems.forEach(row => {
      const userId = row.user_id;
      if (!userMembershipsMap.has(userId)) {
        const memberInfo = companyMappingCache.get(String(userId));
        userMembershipsMap.set(userId, {
          userId,
          userName: row.user_name,
          userPhone: row.user_phone,
          companyName: memberInfo?.companyName || null,
          tenantType: memberInfo?.tenantType || null,
          memberType: memberInfo?.memberType || '신규',
          memberships: []
        });
      }

      const endDate = new Date(row.end_date);
      const isExpired = endDate < now;

      userMembershipsMap.get(userId).memberships.push({
        membershipId: row.membership_id,
        title: row.membership_title,
        beginDate: row.begin_date,
        endDate: row.end_date,
        isExpired,
        totalPrice: row.total_price || 0,
        type: row.item_type  // 'membership' or 'option'
      });
    });

    // Map을 배열로 변환
    let allUsers = Array.from(userMembershipsMap.values());

    // 검색 필터 적용
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      allUsers = allUsers.filter(user => {
        const nameMatch = user.userName && user.userName.toLowerCase().includes(lowerSearchTerm);
        const phoneMatch = user.userPhone && user.userPhone.includes(searchTerm);
        const companyMatch = user.companyName && user.companyName.toLowerCase().includes(lowerSearchTerm);
        return nameMatch || phoneMatch || companyMatch;
      });
    }

    // 페이지네이션
    const totalCount = allUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedUsers = allUsers.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        members: paginatedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        }
      }
    });
  } catch (error) {
    console.error('전체 회원 리스트 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 프로덕션 환경에서 빌드된 프론트엔드 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

app.listen(port, () => {
  console.log(`🚀 서버가 http://localhost:${port} 에서 실행 중입니다`);
});
