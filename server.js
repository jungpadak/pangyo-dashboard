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

    // 전체 회원 조회 (user_id 포함)
    const allMembersQuery = await pool.query(`
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

    // Google Sheets 데이터로 분류 (user_id 기준 unique 카운트)
    const existingUserIds = new Set();
    const newUserIds = new Set();
    const wemadeUserIds = new Set();
    const otherTenantUserIds = new Set();
    const nonTenantUserIds = new Set();

    allMembersQuery.rows.forEach(row => {
      const userId = row.user_id ? String(row.user_id) : null;
      if (!userId) return; // userId가 없으면 스킵

      const memberInfo = companyMappingCache.get(userId);

      if (memberInfo?.memberType === '기존') {
        existingUserIds.add(userId);

        if (memberInfo?.tenantType === '입주사(위메이드)') {
          wemadeUserIds.add(userId);
        } else if (memberInfo?.tenantType === '입주사(위메이드 외)') {
          otherTenantUserIds.add(userId);
        } else if (memberInfo?.tenantType === '비입주사') {
          nonTenantUserIds.add(userId);
        }
      } else {
        // 매칭 안된 회원은 신규로 간주
        newUserIds.add(userId);
      }
    });

    const existingCount = existingUserIds.size;
    const newCount = newUserIds.size;
    const wemadeCount = wemadeUserIds.size;
    const otherTenantCount = otherTenantUserIds.size;
    const nonTenantCount = nonTenantUserIds.size;
    const total = existingCount + newCount;

    res.json({
      success: true,
      data: {
        total,
        segments: {
          existing: {
            count: existingCount,
            percentage: total > 0 ? ((existingCount / total) * 100).toFixed(1) : 0,
            subSegments: {
              wemade: {
                count: wemadeCount,
                percentage: existingCount > 0 ? ((wemadeCount / existingCount) * 100).toFixed(1) : 0
              },
              otherTenant: {
                count: otherTenantCount,
                percentage: existingCount > 0 ? ((otherTenantCount / existingCount) * 100).toFixed(1) : 0
              },
              nonTenant: {
                count: nonTenantCount,
                percentage: existingCount > 0 ? ((nonTenantCount / existingCount) * 100).toFixed(1) : 0
              }
            }
          },
          new: {
            count: newCount,
            percentage: total > 0 ? ((newCount / total) * 100).toFixed(1) : 0
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
    const filteredMembers = allMembersResult.rows.filter(row => {
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

      const membersQuery = await pool.query(`
        SELECT DISTINCT ON (m.id)
          m.id,
          u.id as user_id,
          o.total_price
        FROM b_class_bmembership m
        JOIN b_payment_btransaction t ON m.transaction_id = t.id
        JOIN b_payment_border o ON t.order_id = o.id
        LEFT JOIN user_user u ON o.user_id = u.id
        WHERE m.is_active = true
          AND m.begin_date <= $2::date
          AND m.end_date >= $1::date
          AND o.b_place_id = 26
          AND t.is_refund = false
          ${excludeConditions}
      `, [monthStart, monthEnd]);

      // 법인별로 그룹화 (user_id 기준 unique 카운트)
      const companyData = new Map();

      membersQuery.rows.forEach(row => {
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
        data.revenue += row.total_price || 0;
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

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 프로덕션 환경에서 빌드된 프론트엔드 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));

  // 모든 라우트를 index.html로 리다이렉트 (SPA 지원)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`🚀 서버가 http://localhost:${port} 에서 실행 중입니다`);
});
