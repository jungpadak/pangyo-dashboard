import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, TrendingUp, X } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';

// 더미 데이터 - 전체 기간으로 확장
const rawData = [
  {month: '2023-11', company: '위메이드', type: '기존_입주사_위메이드', members: 248, revenue: 24488656},
  {month: '2023-11', company: '크래프톤', type: '기존_입주사_위메이드외', members: 158, revenue: 14864628},
  {month: '2023-11', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 131, revenue: 12939851},
  {month: '2023-11', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 171, revenue: 17176820},
  {month: '2023-11', company: '넷마블', type: '기존_입주사_위메이드외', members: 99, revenue: 9802468},
  {month: '2023-11', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 123, revenue: 12318133},
  {month: '2023-11', company: '카카오게임즈', type: '기존_비입주사', members: 69, revenue: 6605813},
  {month: '2023-11', company: '컴투스', type: '기존_비입주사', members: 54, revenue: 5381677},
  {month: '2023-11', company: '펄어비스', type: '기존_비입주사', members: 44, revenue: 4353830},
  {month: '2023-11', company: '게임빌', type: '기존_비입주사', members: 37, revenue: 3719846},
  {month: '2023-11', company: '선데이토즈', type: '기존_비입주사', members: 30, revenue: 2808206},
  {month: '2023-11', company: 'B2C 개인회원', type: '신규_B2C', members: 172, revenue: 14006360},
  {month: '2023-12', company: '위메이드', type: '기존_입주사_위메이드', members: 246, revenue: 23913773},
  {month: '2023-12', company: '크래프톤', type: '기존_입주사_위메이드외', members: 158, revenue: 15006869},
  {month: '2023-12', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 131, revenue: 13091326},
  {month: '2023-12', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 177, revenue: 16752945},
  {month: '2023-12', company: '넷마블', type: '기존_입주사_위메이드외', members: 101, revenue: 9634854},
  {month: '2023-12', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 129, revenue: 12241869},
  {month: '2023-12', company: '카카오게임즈', type: '기존_비입주사', members: 67, revenue: 6676046},
  {month: '2023-12', company: '컴투스', type: '기존_비입주사', members: 55, revenue: 5028618},
  {month: '2023-12', company: '펄어비스', type: '기존_비입주사', members: 44, revenue: 4073082},
  {month: '2023-12', company: '게임빌', type: '기존_비입주사', members: 38, revenue: 3692562},
  {month: '2023-12', company: '선데이토즈', type: '기존_비입주사', members: 28, revenue: 2727994},
  {month: '2023-12', company: 'B2C 개인회원', type: '신규_B2C', members: 175, revenue: 13693028},
  {month: '2024-01', company: '위메이드', type: '기존_입주사_위메이드', members: 253, revenue: 25234656},
  {month: '2024-01', company: '크래프톤', type: '기존_입주사_위메이드외', members: 158, revenue: 14781332},
  {month: '2024-01', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 129, revenue: 12821697},
  {month: '2024-01', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 169, revenue: 16074803},
  {month: '2024-01', company: '넷마블', type: '기존_입주사_위메이드외', members: 100, revenue: 9890382},
  {month: '2024-01', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 125, revenue: 11834730},
  {month: '2024-01', company: '카카오게임즈', type: '기존_비입주사', members: 71, revenue: 6655437},
  {month: '2024-01', company: '컴투스', type: '기존_비입주사', members: 53, revenue: 5033754},
  {month: '2024-01', company: '펄어비스', type: '기존_비입주사', members: 45, revenue: 4371808},
  {month: '2024-01', company: '게임빌', type: '기존_비입주사', members: 36, revenue: 3449088},
  {month: '2024-01', company: '선데이토즈', type: '기존_비입주사', members: 28, revenue: 2819653},
  {month: '2024-01', company: 'B2C 개인회원', type: '신규_B2C', members: 181, revenue: 14889225},
  {month: '2024-02', company: '위메이드', type: '기존_입주사_위메이드', members: 253, revenue: 25091945},
  {month: '2024-02', company: '크래프톤', type: '기존_입주사_위메이드외', members: 154, revenue: 14810889},
  {month: '2024-02', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 132, revenue: 12695074},
  {month: '2024-02', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 170, revenue: 16967030},
  {month: '2024-02', company: '넷마블', type: '기존_입주사_위메이드외', members: 103, revenue: 10127754},
  {month: '2024-02', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 128, revenue: 12557066},
  {month: '2024-02', company: '카카오게임즈', type: '기존_비입주사', members: 68, revenue: 6779056},
  {month: '2024-02', company: '컴투스', type: '기존_비입주사', members: 53, revenue: 5314966},
  {month: '2024-02', company: '펄어비스', type: '기존_비입주사', members: 46, revenue: 4566738},
  {month: '2024-02', company: '게임빌', type: '기존_비입주사', members: 35, revenue: 3435176},
  {month: '2024-02', company: '선데이토즈', type: '기존_비입주사', members: 30, revenue: 2943877},
  {month: '2024-02', company: 'B2C 개인회원', type: '신규_B2C', members: 188, revenue: 15922729},
  {month: '2024-03', company: '위메이드', type: '기존_입주사_위메이드', members: 252, revenue: 25055382},
  {month: '2024-03', company: '크래프톤', type: '기존_입주사_위메이드외', members: 157, revenue: 15196636},
  {month: '2024-03', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 128, revenue: 12044734},
  {month: '2024-03', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 169, revenue: 15815439},
  {month: '2024-03', company: '넷마블', type: '기존_입주사_위메이드외', members: 103, revenue: 9916066},
  {month: '2024-03', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 126, revenue: 12318133},
  {month: '2024-03', company: '카카오게임즈', type: '기존_비입주사', members: 70, revenue: 6955098},
  {month: '2024-03', company: '컴투스', type: '기존_비입주사', members: 53, revenue: 5164820},
  {month: '2024-03', company: '펄어비스', type: '기존_비입주사', members: 46, revenue: 4416862},
  {month: '2024-03', company: '게임빌', type: '기존_비입주사', members: 35, revenue: 3517398},
  {month: '2024-03', company: '선데이토즈', type: '기존_비입주사', members: 29, revenue: 2857878},
  {month: '2024-03', company: 'B2C 개인회원', type: '신규_B2C', members: 187, revenue: 14628928},
  {month: '2024-04', company: '위메이드', type: '기존_입주사_위메이드', members: 255, revenue: 24916010},
  {month: '2024-04', company: '크래프톤', type: '기존_입주사_위메이드외', members: 160, revenue: 15475476},
  {month: '2024-04', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 132, revenue: 12934094},
  {month: '2024-04', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 167, revenue: 16699997},
  {month: '2024-04', company: '넷마블', type: '기존_입주사_위메이드외', members: 101, revenue: 9697635},
  {month: '2024-04', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 128, revenue: 12084851},
  {month: '2024-04', company: '카카오게임즈', type: '기존_비입주사', members: 70, revenue: 6813326},
  {month: '2024-04', company: '컴투스', type: '기존_비입주사', members: 53, revenue: 5001757},
  {month: '2024-04', company: '펄어비스', type: '기존_비입주사', members: 46, revenue: 4403104},
  {month: '2024-04', company: '게임빌', type: '기존_비입주사', members: 35, revenue: 3299898},
  {month: '2024-04', company: '선데이토즈', type: '기존_비입주사', members: 30, revenue: 2826478},
  {month: '2024-04', company: 'B2C 개인회원', type: '신규_B2C', members: 196, revenue: 15481688},
  {month: '2024-05', company: '위메이드', type: '기존_입주사_위메이드', members: 260, revenue: 25487080},
  {month: '2024-05', company: '크래프톤', type: '기존_입주사_위메이드외', members: 160, revenue: 14940864},
  {month: '2024-05', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 128, revenue: 12641357},
  {month: '2024-05', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 166, revenue: 15938506},
  {month: '2024-05', company: '넷마블', type: '기존_입주사_위메이드외', members: 103, revenue: 10050331},
  {month: '2024-05', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 131, revenue: 12983018},
  {month: '2024-05', company: '카카오게임즈', type: '기존_비입주사', members: 73, revenue: 6818084},
  {month: '2024-05', company: '컴투스', type: '기존_비입주사', members: 53, revenue: 5140062},
  {month: '2024-05', company: '펄어비스', type: '기존_비입주사', members: 46, revenue: 4478050},
  {month: '2024-05', company: '게임빌', type: '기존_비입주사', members: 33, revenue: 3285175},
  {month: '2024-05', company: '선데이토즈', type: '기존_비입주사', members: 30, revenue: 2776438},
  {month: '2024-05', company: 'B2C 개인회원', type: '신규_B2C', members: 200, revenue: 15877942},
  {month: '2024-06', company: '위메이드', type: '기존_입주사_위메이드', members: 252, revenue: 25368804},
  {month: '2024-06', company: '크래프톤', type: '기존_입주사_위메이드외', members: 159, revenue: 15088387},
  {month: '2024-06', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 131, revenue: 12589683},
  {month: '2024-06', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 162, revenue: 16151282},
  {month: '2024-06', company: '넷마블', type: '기존_입주사_위메이드외', members: 104, revenue: 9758393},
  {month: '2024-06', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 130, revenue: 12793250},
  {month: '2024-06', company: '카카오게임즈', type: '기존_비입주사', members: 71, revenue: 6958855},
  {month: '2024-06', company: '컴투스', type: '기존_비입주사', members: 52, revenue: 5113056},
  {month: '2024-06', company: '펄어비스', type: '기존_비입주사', members: 47, revenue: 4460208},
  {month: '2024-06', company: '게임빌', type: '기존_비입주사', members: 33, revenue: 3149856},
  {month: '2024-06', company: '선데이토즈', type: '기존_비입주사', members: 31, revenue: 2836963},
  {month: '2024-06', company: '하이퍼커넥트', type: '신규_B2B', members: 43, revenue: 3900948},
  {month: '2024-06', company: 'B2C 개인회원', type: '신규_B2C', members: 206, revenue: 15966772},
  {month: '2024-07', company: '위메이드', type: '기존_입주사_위메이드', members: 263, revenue: 26198373},
  {month: '2024-07', company: '크래프톤', type: '기존_입주사_위메이드외', members: 161, revenue: 15115072},
  {month: '2024-07', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 131, revenue: 12302256},
  {month: '2024-07', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 165, revenue: 15895350},
  {month: '2024-07', company: '넷마블', type: '기존_입주사_위메이드외', members: 104, revenue: 9888624},
  {month: '2024-07', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 132, revenue: 12732894},
  {month: '2024-07', company: '카카오게임즈', type: '기존_비입주사', members: 72, revenue: 7084272},
  {month: '2024-07', company: '컴투스', type: '기존_비입주사', members: 52, revenue: 4941091},
  {month: '2024-07', company: '펄어비스', type: '기존_비입주사', members: 48, revenue: 4667318},
  {month: '2024-07', company: '게임빌', type: '기존_비입주사', members: 31, revenue: 3076131},
  {month: '2024-07', company: '선데이토즈', type: '기존_비입주사', members: 31, revenue: 2865349},
  {month: '2024-07', company: '하이퍼커넥트', type: '신규_B2B', members: 47, revenue: 4292706},
  {month: '2024-07', company: '두나무', type: '신규_B2B', members: 50, revenue: 4691850},
  {month: '2024-07', company: 'B2C 개인회원', type: '신규_B2C', members: 206, revenue: 15616598},
  {month: '2024-08', company: '위메이드', type: '기존_입주사_위메이드', members: 262, revenue: 26063018},
  {month: '2024-08', company: '크래프톤', type: '기존_입주사_위메이드외', members: 159, revenue: 15349005},
  {month: '2024-08', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 127, revenue: 12655077},
  {month: '2024-08', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 162, revenue: 16116378},
  {month: '2024-08', company: '넷마블', type: '기존_입주사_위메이드외', members: 105, revenue: 10173825},
  {month: '2024-08', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 135, revenue: 13095225},
  {month: '2024-08', company: '카카오게임즈', type: '기존_비입주사', members: 75, revenue: 6974400},
  {month: '2024-08', company: '컴투스', type: '기존_비입주사', members: 52, revenue: 5061656},
  {month: '2024-08', company: '펄어비스', type: '기존_비입주사', members: 49, revenue: 4636843},
  {month: '2024-08', company: '게임빌', type: '기존_비입주사', members: 31, revenue: 2954982},
  {month: '2024-08', company: '선데이토즈', type: '기존_비입주사', members: 31, revenue: 3059566},
  {month: '2024-08', company: '하이퍼커넥트', type: '신규_B2B', members: 48, revenue: 4386144},
  {month: '2024-08', company: '두나무', type: '신규_B2B', members: 53, revenue: 4829324},
  {month: '2024-08', company: '딜리셔스', type: '신규_B2B', members: 30, revenue: 2813100},
  {month: '2024-08', company: 'B2C 개인회원', type: '신규_B2C', members: 196, revenue: 16049459},
  {month: '2024-09', company: '위메이드', type: '기존_입주사_위메이드', members: 261, revenue: 26100000},
  {month: '2024-09', company: '크래프톤', type: '기존_입주사_위메이드외', members: 161, revenue: 15449850},
  {month: '2024-09', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 128, revenue: 12544000},
  {month: '2024-09', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 159, revenue: 15741000},
  {month: '2024-09', company: '넷마블', type: '기존_입주사_위메이드외', members: 107, revenue: 10486500},
  {month: '2024-09', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 136, revenue: 13328000},
  {month: '2024-09', company: '카카오게임즈', type: '기존_비입주사', members: 76, revenue: 7372000},
  {month: '2024-09', company: '컴투스', type: '기존_비입주사', members: 52, revenue: 5096000},
  {month: '2024-09', company: '펄어비스', type: '기존_비입주사', members: 49, revenue: 4753000},
  {month: '2024-09', company: '게임빌', type: '기존_비입주사', members: 30, revenue: 2940000},
  {month: '2024-09', company: '선데이토즈', type: '기존_비입주사', members: 32, revenue: 3136000},
  {month: '2024-09', company: '하이퍼커넥트', type: '신규_B2B', members: 51, revenue: 4692000},
  {month: '2024-09', company: '두나무', type: '신규_B2B', members: 55, revenue: 5115000},
  {month: '2024-09', company: '딜리셔스', type: '신규_B2B', members: 34, revenue: 3026000},
  {month: '2024-09', company: '비바리퍼블리카', type: '신규_B2B', members: 27, revenue: 2457000},
  {month: '2024-09', company: 'B2C 개인회원', type: '신규_B2C', members: 190, revenue: 14579259},
  {month: '2024-10', company: '위메이드', type: '기존_입주사_위메이드', members: 265, revenue: 26235000},
  {month: '2024-10', company: '크래프톤', type: '기존_입주사_위메이드외', members: 162, revenue: 15552000},
  {month: '2024-10', company: '스마일게이트', type: '기존_입주사_위메이드외', members: 126, revenue: 12348000},
  {month: '2024-10', company: '넥슨코리아', type: '기존_입주사_위메이드외', members: 156, revenue: 15288000},
  {month: '2024-10', company: '넷마블', type: '기존_입주사_위메이드외', members: 108, revenue: 10584000},
  {month: '2024-10', company: '엔씨소프트', type: '기존_입주사_위메이드외', members: 139, revenue: 13611000},
  {month: '2024-10', company: '카카오게임즈', type: '기존_비입주사', members: 78, revenue: 7566000},
  {month: '2024-10', company: '컴투스', type: '기존_비입주사', members: 51, revenue: 4998000},
  {month: '2024-10', company: '펄어비스', type: '기존_비입주사', members: 50, revenue: 4850000},
  {month: '2024-10', company: '게임빌', type: '기존_비입주사', members: 30, revenue: 2940000},
  {month: '2024-10', company: '선데이토즈', type: '기존_비입주사', members: 33, revenue: 3234000},
  {month: '2024-10', company: '하이퍼커넥트', type: '신규_B2B', members: 53, revenue: 4876000},
  {month: '2024-10', company: '두나무', type: '신규_B2B', members: 57, revenue: 5244000},
  {month: '2024-10', company: '딜리셔스', type: '신규_B2B', members: 37, revenue: 3404000},
  {month: '2024-10', company: '비바리퍼블리카', type: '신규_B2B', members: 29, revenue: 2663000},
  {month: '2024-10', company: 'B2C 개인회원', type: '신규_B2C', members: 192, revenue: 15249316}
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sortConfig, setSortConfig] = useState({ key: 'monthChangePercent', direction: 'asc' });
  const [expandedCategories, setExpandedCategories] = useState({
    existing: true,
    new: true,
    unverified: true,
    wemade: true,
    wemadeOther: true,
    nonResident: true,
    b2b: true,
    b2c: true
  });
  const [expandedCompanyCategories, setExpandedCompanyCategories] = useState({
    existing: true,
    existing_wemade: true,
    existing_wemadeOther: true,
    existing_nonResident: true,
    new: true,
    unverified: true
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [membershipView, setMembershipView] = useState('byCompany'); // 'byCompany' or 'byProduct'
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [realData, setRealData] = useState(null);
  const [dashboardData, setDashboardData] = useState([]);
  const [segmentData, setSegmentData] = useState(null);
  const [previousSegmentData, setPreviousSegmentData] = useState(null);
  const [membershipData, setMembershipData] = useState([]);
  const [contentOptionsData, setContentOptionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // API에서 실제 데이터 가져오기
  // 초기 데이터 로드
  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard-data').then(res => res.json()),
      fetch('/api/company-stats').then(res => res.json()),
      fetch('/api/membership-sales').then(res => res.json()),
      fetch('/api/content-options-sales').then(res => res.json())
    ])
      .then(([dashboardRes, companyRes, membershipRes, contentRes]) => {
        if (dashboardRes.success) {
          setDashboardData(dashboardRes.data);
          // 최신 월을 기본값으로 설정
          const months = [...new Set(dashboardRes.data.map(d => d.month))].sort();
          setSelectedMonth(months[months.length - 1]);
        }
        if (companyRes.success) {
          setRealData(companyRes.data);
        }
        if (membershipRes.success) {
          setMembershipData(membershipRes.data);
        }
        if (contentRes.success) {
          setContentOptionsData(contentRes.data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('데이터 로드 실패:', error);
        setLoading(false);
      });
  }, []);

  // selectedMonth가 변경될 때마다 세그먼트 데이터 재조회 (당월 + 전월)
  useEffect(() => {
    if (!selectedMonth || !dashboardData.length) return;

    // 전월 계산
    const months = [...new Set(dashboardData.map(d => d.month))].sort();
    const currentMonthIndex = months.indexOf(selectedMonth);
    const previousMonth = currentMonthIndex > 0 ? months[currentMonthIndex - 1] : null;

    // 당월 세그먼트 데이터
    fetch(`/api/pangyo-segments?month=${selectedMonth}`)
      .then(res => res.json())
      .then(segmentRes => {
        if (segmentRes.success) {
          setSegmentData(segmentRes.data);
        }
      })
      .catch(error => {
        console.error('세그먼트 데이터 로드 실패:', error);
      });

    // 전월 세그먼트 데이터
    if (previousMonth) {
      fetch(`/api/pangyo-segments?month=${previousMonth}`)
        .then(res => res.json())
        .then(segmentRes => {
          if (segmentRes.success) {
            setPreviousSegmentData(segmentRes.data);
          }
        })
        .catch(error => {
          console.error('전월 세그먼트 데이터 로드 실패:', error);
        });
    } else {
      setPreviousSegmentData(null);
    }
  }, [selectedMonth, dashboardData]);
  
  const processedData = useMemo(() => {
    // 로딩 중이거나 데이터가 없으면 null 반환
    if (loading || dashboardData.length === 0 || !segmentData || !selectedMonth) {
      return null;
    }

    const dataToUse = dashboardData;

    const months = [...new Set(dataToUse.map(d => d.month))].sort();
    const currentMonthIndex = months.indexOf(selectedMonth);
    const previousMonth = currentMonthIndex > 0 ? months[currentMonthIndex - 1] : null;

    const latestData = dataToUse.filter(d => d.month === selectedMonth);
    const previousData = previousMonth ? dataToUse.filter(d => d.month === previousMonth) : [];

    // ⚠️ 중요: 회원 수는 segmentData를 사용 (정확한 unique user_id 카운트)
    // dashboardData는 법인별 합계이므로 중복 가능성이 있음
    const totalMembers = segmentData?.total || 0;
    const totalRevenue = latestData.reduce((sum, d) => sum + d.revenue, 0);

    // 전월 회원 수 및 매출 계산
    // ⚠️ 중요: 전월 회원 수도 previousSegmentData를 사용 (정확한 unique user_id 카운트)
    const prevTotalMembers = previousSegmentData?.total || 0;
    const prevTotalRevenue = previousData.reduce((sum, d) => sum + d.revenue, 0);

    const memberChange = totalMembers - prevTotalMembers;
    const revenueChange = totalRevenue - prevTotalRevenue;

    // 데이터 일관성 검증
    const dashboardCalculatedMembers = latestData.reduce((sum, d) => sum + d.members, 0);
    const dataDiscrepancy = Math.abs(totalMembers - dashboardCalculatedMembers);
    const hasDataIssue = dataDiscrepancy > 5; // 5명 이상 차이나면 경고
    
    const corporateMembers = latestData
      .filter(d => d.type !== '신규_B2C')
      .reduce((sum, d) => sum + d.members, 0);
    const corporateRatio = (corporateMembers / totalMembers * 100).toFixed(1);

    // 계층별 집계
    const hierarchyData = {
      existing: {
        wemade: latestData.filter(d => d.type === '기존_입주사_위메이드'),
        wemadeOther: latestData.filter(d => d.type === '기존_입주사_위메이드외'),
        nonResident: latestData.filter(d => d.type === '기존_비입주사')
      },
      new: latestData.filter(d => d.type === '신규'),
      unverified: latestData.filter(d => d.type === '미인증')
    };

    const companies = [...new Set(dataToUse.map(d => d.company))].filter(c => c !== 'B2C 개인회원');

    const companyAnalysis = companies.map(company => {
      const companyData = dataToUse.filter(d => d.company === company).sort((a, b) => a.month.localeCompare(b.month));
      const latest = companyData[companyData.length - 1];
      const previous = companyData[companyData.length - 2];
      const quarterAgo = companyData[companyData.length - 4];

      const monthChange = latest && previous ? latest.members - previous.members : 0;
      const quarterChange = latest && quarterAgo ? latest.members - quarterAgo.members : 0;

      const monthChangePercent = previous ? (monthChange / previous.members * 100) : 0;
      const quarterChangePercent = quarterAgo ? (quarterChange / quarterAgo.members * 100) : 0;

      let status = '🟢';
      let statusBg = 'bg-green-50';
      if (monthChangePercent < -10 || (monthChange < 0 && quarterChange < 0)) {
        status = '🔴';
        statusBg = 'bg-red-50';
      } else if (monthChangePercent < -5) {
        status = '🟡';
        statusBg = 'bg-yellow-50';
      }

      return {
        name: company,
        type: latest.type,
        members: latest.members,
        revenue: latest.revenue,
        monthChange,
        quarterChange,
        monthChangePercent,
        quarterChangePercent,
        status,
        statusBg,
        history: companyData
      };
    });

    const sortedCompanies = [...companyAnalysis].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // 계층별로 그룹화
    const companyHierarchy = {
      existing: {
        wemade: sortedCompanies.filter(c => c.type === '기존_입주사_위메이드'),
        wemadeOther: sortedCompanies.filter(c => c.type === '기존_입주사_위메이드외'),
        nonResident: sortedCompanies.filter(c => c.type === '기존_비입주사')
      },
      new: sortedCompanies.filter(c => c.type === '신규'),
      unverified: sortedCompanies.filter(c => c.type === '미인증')
    };

    const riskCompanies = companyAnalysis.filter(c => c.status === '🔴').length;

    // Total 추이 계산
    const totalHistory = months.map(month => {
      const monthData = dataToUse.filter(d => d.month === month);
      return {
        month,
        members: monthData.reduce((sum, d) => sum + d.members, 0),
        revenue: monthData.reduce((sum, d) => sum + d.revenue, 0)
      };
    });

    return {
      totalMembers,
      totalRevenue,
      prevTotalMembers,
      prevTotalRevenue,
      memberChange,
      revenueChange,
      corporateRatio,
      riskCompanies,
      companyAnalysis: sortedCompanies,
      companyHierarchy,
      hierarchyData,
      latestMonth: selectedMonth,
      previousMonth,
      riskList: companyAnalysis.filter(c => c.status === '🔴'),
      totalHistory,
      availableMonths: months,
      hasDataIssue,
      dataDiscrepancy,
      dashboardCalculatedMembers,
      segmentData,
      previousSegmentData
    };
  }, [dashboardData, sortConfig, loading, segmentData, previousSegmentData, selectedMonth]);

  const handlePrevMonth = () => {
    if (!processedData) return;
    const currentIndex = processedData.availableMonths.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(processedData.availableMonths[currentIndex - 1]);
    }
  };

  const handleNextMonth = () => {
    if (!processedData) return;
    const currentIndex = processedData.availableMonths.indexOf(selectedMonth);
    if (currentIndex < processedData.availableMonths.length - 1) {
      setSelectedMonth(processedData.availableMonths[currentIndex + 1]);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleCompanyCategory = (category) => {
    setExpandedCompanyCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleCompany = (company) => {
    setExpandedCompanies(prev => ({ ...prev, [company]: !prev[company] }));
  };

  const formatRevenue = (amount) => {
    return `₩${amount.toLocaleString()}`;
  };

  const AllCompanyTrendChart = ({ companies, totalHistory }) => {
    if (!companies || companies.length === 0) return null;

    // 전월 대비 증감 계산
    const companyChanges = companies
      .filter(c => c.history && c.history.length >= 2)
      .map(company => {
        const latestIdx = company.history.length - 1;
        const latest = company.history[latestIdx]?.members || 0;
        const previous = company.history[latestIdx - 1]?.members || 0;
        const change = latest - previous;
        return {
          name: company.name,
          latest,
          previous,
          change
        };
      })
      .filter(c => c.change !== 0); // 변화 없는 법인 제외

    // 급증/급감 법인 찾기
    const topIncrease = companyChanges
      .filter(c => c.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    const topDecrease = companyChanges
      .filter(c => c.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);

    // Recharts용 데이터 포맷 (막대 그래프만)
    const chartData = totalHistory.map(h => ({
      month: h.month.slice(2),
      '전체 회원': h.members
    }));

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">법인별 회원 증감 현황</h3>
            <p className="text-sm text-gray-500 mt-1">
              법인별 클릭하거나 추이 아이콘을 클릭하여 전체 기간 조이 를 확인할 수 있습니다
            </p>
          </div>
        </div>

        <div className="relative bg-white rounded-lg p-4" style={{ height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => value.toLocaleString()}
                label={{ value: '회원수 (명)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <Tooltip
                formatter={(value, name) => [value.toLocaleString() + '명', name]}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
              />

              {/* 전체 회원은 막대그래프 */}
              <Bar
                dataKey="전체 회원"
                fill="url(#colorTotal)"
                fillOpacity={0.8}
                radius={[8, 8, 0, 0]}
              />

              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 급증/급감 법인 요약 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* 급증 법인 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📈</span>
              <h4 className="font-semibold text-green-900">이번 달 급증 법인</h4>
            </div>
            {topIncrease.length > 0 ? (
              <div className="space-y-2">
                {topIncrease.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between text-green-800">
                    <span className="font-medium">{c.name}</span>
                    <span className="font-semibold">+{c.change}명</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-700 text-xs">급증한 법인이 없습니다</p>
            )}
          </div>

          {/* 급감 법인 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📉</span>
              <h4 className="font-semibold text-red-900">이번 달 급감 법인</h4>
            </div>
            {topDecrease.length > 0 ? (
              <div className="space-y-2">
                {topDecrease.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between text-red-800">
                    <span className="font-medium">{c.name}</span>
                    <span className="font-semibold">{c.change}명</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-red-700 text-xs">급감한 법인이 없습니다</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TrendModal = ({ company, onClose }) => {
    if (!company) return null;

    // 월별로 그룹화 (중복 제거)
    const monthlyData = new Map();
    company.history.forEach(h => {
      const monthKey = h.month;
      if (!monthlyData.has(monthKey) || monthlyData.get(monthKey).members < h.members) {
        monthlyData.set(monthKey, h);
      }
    });

    const uniqueHistory = Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
    const members = uniqueHistory.map(h => h.members);
    const maxMembers = Math.max(...members);
    const minMembers = Math.min(...members);

    // Recharts용 데이터 - YY-MM 형식으로 표시
    const chartData = uniqueHistory.map(h => ({
      month: h.month.slice(2),  // "2025-10" -> "25-10"
      members: h.members
    }));

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {company.name} - 전체 기간 추이
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="relative bg-white rounded-lg" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip 
                  formatter={(value) => value.toLocaleString() + '명'}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="members" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-600 p-5 rounded-lg shadow">
              <div className="text-sm text-white/90 mb-1 font-medium">최신 회원수</div>
              <div className="text-2xl font-bold text-white">{members[members.length - 1].toLocaleString()}명</div>
            </div>
            <div className="bg-gray-700 p-5 rounded-lg shadow">
              <div className="text-sm text-white/90 mb-1 font-medium">최고치</div>
              <div className="text-2xl font-bold text-white">{maxMembers.toLocaleString()}명</div>
            </div>
            <div className="bg-gray-600 p-5 rounded-lg shadow">
              <div className="text-sm text-white/90 mb-1 font-medium">최저치</div>
              <div className="text-2xl font-bold text-white">{minMembers.toLocaleString()}명</div>
            </div>
            <div className="bg-gray-700 p-5 rounded-lg shadow">
              <div className="text-sm text-white/90 mb-1 font-medium">평균</div>
              <div className="text-2xl font-bold text-white">
                {Math.round(members.reduce((a, b) => a + b, 0) / members.length).toLocaleString()}명
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const KPICard = ({ title, value, previousValue, change, isRevenue, isWarning, gradient }) => (
    <div className={`relative overflow-hidden rounded-lg shadow hover:shadow-md transition-all duration-200 ${gradient || 'bg-blue-600'}`}>
      <div className="relative p-6 text-white">
        <div className="text-sm font-medium mb-2 opacity-90">{title}</div>
        <div className="text-3xl font-bold mb-2">{value}</div>
        {previousValue && (
          <div className="text-sm opacity-70 mb-2">
            전월: {previousValue}
          </div>
        )}
        {change !== null && change !== undefined && (
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              change >= 0 ? 'bg-white/20' : 'bg-red-500/30'
            }`}>
              {change >= 0 ? '↑' : '↓'}
              {isRevenue ? formatRevenue(Math.abs(change)) : `${Math.abs(change)}명`}
            </div>
            <span className="text-xs opacity-80">전월 대비</span>
          </div>
        )}
        {isWarning && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500">
            요주의
          </div>
        )}
      </div>
    </div>
  );

  const HierarchyRow = ({ label, data, members, revenue, level = 0, category, isExpanded }) => (
    <>
      <tr className={`hover:bg-gray-50 ${level === 0 ? 'bg-gray-100 font-bold' : level === 1 ? 'bg-gray-50' : ''}`}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ paddingLeft: `${24 + level * 24}px` }}>
          <div className="flex items-center gap-2">
            {category && (
              <button onClick={() => toggleCategory(category)} className="focus:outline-none">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            {label}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
          {members.toLocaleString()}명
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
          {formatRevenue(revenue)}
        </td>
      </tr>
      {isExpanded && data && data.map((item, idx) => (
        <tr key={idx} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ paddingLeft: `${24 + (level + 1) * 24}px` }}>
            {item.company}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
            {item.members.toLocaleString()}명
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
            {formatRevenue(item.revenue)}
          </td>
        </tr>
      ))}
    </>
  );

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="text-gray-400">⇅</span>;
    return sortConfig.direction === 'asc' ? <span className="text-blue-600">↑</span> : <span className="text-blue-600">↓</span>;
  };

  // 계층 구조 렌더링 helper
  const renderCompanyHierarchy = () => {
    const hierarchy = processedData.companyHierarchy;
    const rows = [];

    // 기존 카테고리 - segmentData 기반으로 정확한 회원 수 계산
    const existingTotalMembers = processedData.segmentData?.segments?.existing?.count || 0;
    const prevExistingMembers = processedData.previousSegmentData?.segments?.existing?.count || 0;
    const existingMonthChange = existingTotalMembers - prevExistingMembers;
    const existingMonthChangePercent = prevExistingMembers > 0 ? (existingMonthChange / prevExistingMembers) * 100 : 0;
    const existingStatus = existingMonthChange >= 0 ? '🟢' : existingMonthChangePercent < -10 ? '🔴' : '🟡';

    // 3개월 변화는 별도 계산 필요 (현재는 단순화)
    const existingCompanies = [...hierarchy.existing.wemade, ...hierarchy.existing.wemadeOther, ...hierarchy.existing.nonResident];
    const existingQuarterChange = existingCompanies.reduce((sum, c) => sum + c.quarterChange, 0);

    rows.push(
      <tr key="existing" className="bg-gray-100 hover:bg-gray-200 cursor-pointer font-bold" onClick={() => toggleCompanyCategory('existing')}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center gap-2">
            {expandedCompanyCategories.existing ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            기존 회원사
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
          {existingTotalMembers.toLocaleString()}명
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
          existingMonthChange > 0 ? 'text-green-600' : existingMonthChange < 0 ? 'text-red-600' : 'text-gray-500'
        }`}>
          {existingMonthChange > 0 ? '+' : ''}{existingMonthChange}명
          <span className="text-xs ml-1">
            ({existingMonthChangePercent > 0 ? '+' : ''}{existingMonthChangePercent.toFixed(1)}%)
          </span>
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
          existingQuarterChange > 0 ? 'text-green-600' : existingQuarterChange < 0 ? 'text-red-600' : 'text-gray-500'
        }`}>
          {existingQuarterChange > 0 ? '+' : ''}{existingQuarterChange}명
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center text-2xl">
          {existingStatus}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 기존 회원사 전체의 월별 합계 계산
              const monthlyTotals = new Map();
              dashboardData.forEach(d => {
                if (d.type.startsWith('기존_')) {
                  const current = monthlyTotals.get(d.month) || { month: d.month, members: 0 };
                  current.members += d.members;
                  monthlyTotals.set(d.month, current);
                }
              });
              const aggregatedHistory = Array.from(monthlyTotals.values()).sort((a, b) => a.month.localeCompare(b.month));
              setSelectedCompany({ name: '기존 회원사', history: aggregatedHistory });
            }}
            className="text-blue-600 hover:text-blue-800 hover:scale-125 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
          >
            <TrendingUp size={20} />
          </button>
        </td>
      </tr>
    );

    if (expandedCompanyCategories.existing) {
      // 위메이드
      rows.push(
        <tr key="existing_wemade" className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleCompanyCategory('existing_wemade')}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ paddingLeft: '48px' }}>
            <div className="flex items-center gap-2">
              {expandedCompanyCategories.existing_wemade ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              위메이드
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">입주사</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
            {hierarchy.existing.wemade.reduce((sum, c) => sum + c.members, 0).toLocaleString()}명
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
        </tr>
      );

      if (expandedCompanyCategories.existing_wemade) {
        hierarchy.existing.wemade.forEach((company, idx) => {
          rows.push(
            <tr key={`wemade-${idx}`} className={`hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm ${company.statusBg}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ paddingLeft: '72px' }}>
                {company.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                위메이드
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                {company.members.toLocaleString()}명
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                company.monthChange > 0 ? 'text-green-600' : company.monthChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {company.monthChange > 0 ? '+' : ''}{company.monthChange}명
                <span className="text-xs ml-1">
                  ({company.monthChangePercent > 0 ? '+' : ''}{company.monthChangePercent.toFixed(1)}%)
                </span>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                company.quarterChange > 0 ? 'text-green-600' : company.quarterChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {company.quarterChange > 0 ? '+' : ''}{company.quarterChange}명
                <span className="text-xs ml-1">
                  ({company.quarterChangePercent > 0 ? '+' : ''}{company.quarterChangePercent.toFixed(1)}%)
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-2xl">
                {company.status}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => setSelectedCompany(company)}
                  className="text-blue-600 hover:text-blue-800 hover:scale-125 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
                >
                  <TrendingUp size={20} />
                </button>
              </td>
            </tr>
          );
        });
      }

      // 위메이드 외 (동일한 패턴)
      rows.push(
        <tr key="existing_wemadeOther" className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleCompanyCategory('existing_wemadeOther')}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ paddingLeft: '48px' }}>
            <div className="flex items-center gap-2">
              {expandedCompanyCategories.existing_wemadeOther ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              위메이드 외
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">입주사</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
            {hierarchy.existing.wemadeOther.reduce((sum, c) => sum + c.members, 0).toLocaleString()}명
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
        </tr>
      );

      if (expandedCompanyCategories.existing_wemadeOther) {
        hierarchy.existing.wemadeOther.forEach((company, idx) => {
          rows.push(
            <tr key={`wemadeOther-${idx}`} className={`hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm ${company.statusBg}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ paddingLeft: '72px' }}>
                {company.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                위메이드 외
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                {company.members.toLocaleString()}명
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                company.monthChange > 0 ? 'text-green-600' : company.monthChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {company.monthChange > 0 ? '+' : ''}{company.monthChange}명
                <span className="text-xs ml-1">
                  ({company.monthChangePercent > 0 ? '+' : ''}{company.monthChangePercent.toFixed(1)}%)
                </span>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                company.quarterChange > 0 ? 'text-green-600' : company.quarterChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {company.quarterChange > 0 ? '+' : ''}{company.quarterChange}명
                <span className="text-xs ml-1">
                  ({company.quarterChangePercent > 0 ? '+' : ''}{company.quarterChangePercent.toFixed(1)}%)
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-2xl">
                {company.status}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => setSelectedCompany(company)}
                  className="text-blue-600 hover:text-blue-800 hover:scale-125 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
                >
                  <TrendingUp size={20} />
                </button>
              </td>
            </tr>
          );
        });
      }

      // 비입주사
      rows.push(
        <tr key="existing_nonResident" className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleCompanyCategory('existing_nonResident')}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ paddingLeft: '48px' }}>
            <div className="flex items-center gap-2">
              {expandedCompanyCategories.existing_nonResident ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              비입주사
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">비입주사</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
            {hierarchy.existing.nonResident.reduce((sum, c) => sum + c.members, 0).toLocaleString()}명
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
        </tr>
      );

      if (expandedCompanyCategories.existing_nonResident) {
        hierarchy.existing.nonResident.forEach((company, idx) => {
          rows.push(
            <tr key={`nonResident-${idx}`} className={`hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm ${company.statusBg}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ paddingLeft: '72px' }}>
                {company.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                비입주사
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                {company.members.toLocaleString()}명
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                company.monthChange > 0 ? 'text-green-600' : company.monthChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {company.monthChange > 0 ? '+' : ''}{company.monthChange}명
                <span className="text-xs ml-1">
                  ({company.monthChangePercent > 0 ? '+' : ''}{company.monthChangePercent.toFixed(1)}%)
                </span>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                company.quarterChange > 0 ? 'text-green-600' : company.quarterChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {company.quarterChange > 0 ? '+' : ''}{company.quarterChange}명
                <span className="text-xs ml-1">
                  ({company.quarterChangePercent > 0 ? '+' : ''}{company.quarterChangePercent.toFixed(1)}%)
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-2xl">
                {company.status}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => setSelectedCompany(company)}
                  className="text-blue-600 hover:text-blue-800 hover:scale-125 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
                >
                  <TrendingUp size={20} />
                </button>
              </td>
            </tr>
          );
        });
      }
    }

    // 신규 회원사 카테고리 - segmentData 기반으로 정확한 회원 수 계산
    const newTotalMembers = processedData.segmentData?.segments?.new?.count || 0;
    const prevNewMembers = processedData.previousSegmentData?.segments?.new?.count || 0;
    const newMonthChange = newTotalMembers - prevNewMembers;
    const newMonthChangePercent = prevNewMembers > 0 ? (newMonthChange / prevNewMembers) * 100 : 0;
    const newStatus = newMonthChange >= 0 ? '🟢' : newMonthChangePercent < -10 ? '🔴' : '🟡';

    // 3개월 변화는 별도 계산 필요 (현재는 단순화)
    const newCompanies = hierarchy.new;
    const newQuarterChange = newCompanies.reduce((sum, c) => sum + c.quarterChange, 0);

    rows.push(
      <tr key="new" className="bg-gray-100 hover:bg-gray-200 cursor-pointer font-bold" onClick={() => toggleCompanyCategory('new')}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center gap-2">
            {expandedCompanyCategories.new ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            신규 회원사
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
          {newTotalMembers.toLocaleString()}명
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
          newMonthChange > 0 ? 'text-green-600' : newMonthChange < 0 ? 'text-red-600' : 'text-gray-500'
        }`}>
          {newMonthChange > 0 ? '+' : ''}{newMonthChange}명
          <span className="text-xs ml-1">
            ({newMonthChangePercent > 0 ? '+' : ''}{newMonthChangePercent.toFixed(1)}%)
          </span>
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
          newQuarterChange > 0 ? 'text-green-600' : newQuarterChange < 0 ? 'text-red-600' : 'text-gray-500'
        }`}>
          {newQuarterChange > 0 ? '+' : ''}{newQuarterChange}명
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center text-2xl">
          {newStatus}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 신규 회원사 전체의 월별 합계 계산
              const monthlyTotals = new Map();
              dashboardData.forEach(d => {
                if (d.type === '신규') {
                  const current = monthlyTotals.get(d.month) || { month: d.month, members: 0 };
                  current.members += d.members;
                  monthlyTotals.set(d.month, current);
                }
              });
              const aggregatedHistory = Array.from(monthlyTotals.values()).sort((a, b) => a.month.localeCompare(b.month));
              setSelectedCompany({ name: '신규 회원사', history: aggregatedHistory });
            }}
            className="text-blue-600 hover:text-blue-800 hover:scale-125 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
          >
            <TrendingUp size={20} />
          </button>
        </td>
      </tr>
    );

    if (expandedCompanyCategories.new) {
      // 신규 회원사 목록 (하위 계층 없이 바로 표시)
      newCompanies.forEach((company, idx) => {
        rows.push(
          <tr key={`new-${idx}`} className={`hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm ${company.statusBg}`}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ paddingLeft: '48px' }}>
              {company.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              신규
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
              {company.members.toLocaleString()}명
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
              company.monthChange > 0 ? 'text-green-600' : company.monthChange < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {company.monthChange > 0 ? '+' : ''}{company.monthChange}명
              <span className="text-xs ml-1">
                ({company.monthChangePercent > 0 ? '+' : ''}{company.monthChangePercent.toFixed(1)}%)
              </span>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
              company.quarterChange > 0 ? 'text-green-600' : company.quarterChange < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {company.quarterChange > 0 ? '+' : ''}{company.quarterChange}명
              <span className="text-xs ml-1">
                ({company.quarterChangePercent > 0 ? '+' : ''}{company.quarterChangePercent.toFixed(1)}%)
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-2xl">
              {company.status}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <button
                onClick={() => setSelectedCompany(company)}
                className="text-blue-600 hover:text-blue-800 hover:scale-125 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
              >
                <TrendingUp size={20} />
              </button>
            </td>
          </tr>
        );
      });
    }

    // 미인증 회원 카테고리
    const unverifiedMembers = hierarchy.unverified;
    if (unverifiedMembers.length > 0) {
      const unverifiedMonthChange = unverifiedMembers.reduce((sum, c) => sum + c.monthChange, 0);
      const unverifiedQuarterChange = unverifiedMembers.reduce((sum, c) => sum + c.quarterChange, 0);
      const unverifiedTotalMembers = unverifiedMembers.reduce((sum, c) => sum + c.members, 0);
      const unverifiedMonthChangePercent = unverifiedTotalMembers > 0 ? (unverifiedMonthChange / (unverifiedTotalMembers - unverifiedMonthChange)) * 100 : 0;
      const unverifiedStatus = unverifiedMonthChange >= 0 ? '🟢' : unverifiedMonthChangePercent < -10 ? '🔴' : '🟡';

      rows.push(
        <tr key="unverified" className="bg-gray-100 hover:bg-gray-200 cursor-pointer font-bold" onClick={() => toggleCompanyCategory('unverified')}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <div className="flex items-center gap-2">
              {expandedCompanyCategories.unverified ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              미인증 회원
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
            {unverifiedTotalMembers.toLocaleString()}명
          </td>
          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
            unverifiedMonthChange > 0 ? 'text-green-600' : unverifiedMonthChange < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {unverifiedMonthChange > 0 ? '+' : ''}{unverifiedMonthChange}명
            <span className="text-xs ml-1">
              ({unverifiedMonthChangePercent > 0 ? '+' : ''}{unverifiedMonthChangePercent.toFixed(1)}%)
            </span>
          </td>
          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
            unverifiedQuarterChange > 0 ? 'text-green-600' : unverifiedQuarterChange < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {unverifiedQuarterChange > 0 ? '+' : ''}{unverifiedQuarterChange}명
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center text-2xl">
            {unverifiedStatus}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // 미인증 회원 전체의 월별 합계 계산
                const monthlyTotals = new Map();
                dashboardData.forEach(d => {
                  if (d.type === '미인증') {
                    const current = monthlyTotals.get(d.month) || { month: d.month, members: 0 };
                    current.members += d.members;
                    monthlyTotals.set(d.month, current);
                  }
                });
                const aggregatedHistory = Array.from(monthlyTotals.values()).sort((a, b) => a.month.localeCompare(b.month));
                setSelectedCompany({ name: '미인증 회원', history: aggregatedHistory });
              }}
              className="text-blue-600 hover:text-blue-800 hover:scale-125 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
            >
              <TrendingUp size={20} />
            </button>
          </td>
        </tr>
      );

      if (expandedCompanyCategories.unverified) {
        // 미인증 회원 목록
        unverifiedMembers.forEach((member, idx) => {
          rows.push(
            <tr key={`unverified-${idx}`} className={`hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm ${member.statusBg}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ paddingLeft: '48px' }}>
                {member.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                미인증
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                {member.members.toLocaleString()}명
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                member.monthChange > 0 ? 'text-green-600' : member.monthChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {member.monthChange > 0 ? '+' : ''}{member.monthChange}명
                <span className="text-xs ml-1">
                  ({member.monthChangePercent > 0 ? '+' : ''}{member.monthChangePercent.toFixed(1)}%)
                </span>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                member.quarterChange > 0 ? 'text-green-600' : member.quarterChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {member.quarterChange > 0 ? '+' : ''}{member.quarterChange}명
                <span className="text-xs ml-1">
                  ({member.quarterChangePercent > 0 ? '+' : ''}{member.quarterChangePercent.toFixed(1)}%)
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-2xl">
                {member.status}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => setSelectedCompany(member)}
                  className="text-blue-600 hover:text-blue-800 hover:scale-125 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
                >
                  <TrendingUp size={20} />
                </button>
              </td>
            </tr>
          );
        });
      }
    }

    return rows;
  };

  // 로딩 중일 때 로딩 화면 표시
  if (loading || !processedData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Butfit 판교벤처타운
            </h1>
            <div>
              <div className="flex items-center gap-4">
                <p className="text-gray-600 text-lg">법인회원 관리 대시보드</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    disabled={!processedData || processedData.availableMonths.indexOf(selectedMonth) === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 min-w-[100px] text-center">
                    {processedData.latestMonth}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    disabled={!processedData || processedData.availableMonths.indexOf(selectedMonth) === processedData.availableMonths.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              {selectedMonth === '2025-10' && (
                <p className="text-sm text-amber-600 mt-1">
                  ※ 오픈월 특성상 결제일 기준으로 표시됩니다 (11월 시작 사전판매 포함)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-3 mb-10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm'
            }`}
          >
            전체 현황
          </button>
          <button
            onClick={() => setActiveTab('membership')}
            className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'membership'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm'
            }`}
          >
            멤버십 현황
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'content'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm'
            }`}
          >
            콘텐츠 & 옵션 현황
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* KPI 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard
                title="총 유효회원"
                value={`${processedData.totalMembers.toLocaleString()}명`}
                previousValue={`${processedData.prevTotalMembers.toLocaleString()}명`}
                change={processedData.memberChange}
                gradient="bg-blue-600"
              />
              <KPICard
                title="당월 매출"
                value={formatRevenue(processedData.totalRevenue)}
                previousValue={formatRevenue(processedData.prevTotalRevenue)}
                change={processedData.revenueChange}
                isRevenue
                gradient="bg-blue-700"
              />
              <KPICard
                title="이탈 위험 법인"
                value={`${processedData.riskCompanies}개사`}
                change={null}
                isWarning={processedData.riskCompanies > 0}
                gradient={processedData.riskCompanies > 0 ? "bg-red-600" : "bg-gray-700"}
              />
            </div>

            {/* 데이터 일관성 경고 */}
            {processedData.hasDataIssue && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-8 shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">데이터 불일치 감지</h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      대시보드와 회원관리 탭의 회원 수가 일치하지 않습니다. ({processedData.dataDiscrepancy}명 차이)
                    </p>
                    <div className="bg-white/60 rounded-lg p-4 text-sm space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-yellow-900 font-medium">회원관리 (정확한 카운트):</span>
                        <span className="font-bold text-yellow-900">{processedData.totalMembers.toLocaleString()}명</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-700">대시보드 합계:</span>
                        <span className="text-yellow-700">{processedData.dashboardCalculatedMembers.toLocaleString()}명</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-yellow-200 text-xs text-yellow-600">
                        현재 "총 유효회원"은 회원관리 탭과 동일한 정확한 값을 표시합니다.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 알림 */}
            {processedData.riskCompanies > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8 shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-3">이번 달 주의 법인 ({processedData.riskCompanies}개사)</h3>
                    <div className="space-y-2">
                      {processedData.riskList.slice(0, 3).map((company, idx) => (
                        <div key={idx} className="bg-white/60 rounded-lg p-3 text-sm text-red-900">
                          <strong className="font-semibold">{company.name}</strong>
                          <span className="ml-2 text-red-700">
                            {company.monthChange > 0 ? '+' : ''}{company.monthChange}명
                            ({company.monthChangePercent > 0 ? '+' : ''}{company.monthChangePercent.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 법인별 상세 테이블 */}
            <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">법인별 회원 증감 현황</h2>
                  <p className="text-sm text-gray-600 mt-1">법인명을 클릭하거나 추이 아이콘을 클릭하면 전체 기간 추이를 확인할 수 있습니다</p>
                </div>
                <button
                  onClick={() => setShowTrendChart(!showTrendChart)}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <TrendingUp size={20} />
                  {showTrendChart ? '차트 숨기기' : '전체 법인 추이 차트'}
                </button>
              </div>

              {showTrendChart && <AllCompanyTrendChart companies={processedData.companyAnalysis} totalHistory={processedData.totalHistory} />}
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                        법인명 <SortIcon columnKey="name" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('members')}>
                        당월회원 <SortIcon columnKey="members" />
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('monthChange')}>
                        전월대비 <SortIcon columnKey="monthChange" />
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('quarterChange')}>
                        전분기대비 <SortIcon columnKey="quarterChange" />
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">추이</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {renderCompanyHierarchy()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 범례 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">상태 구분</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-200">
                  <span className="text-2xl">🟢</span>
                  <div>
                    <div className="font-medium text-green-800">안정</div>
                    <div className="text-xs text-green-600">유지 또는 증가</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <span className="text-2xl">🟡</span>
                  <div>
                    <div className="font-medium text-yellow-800">주의</div>
                    <div className="text-xs text-yellow-600">전월 대비 5-10% 감소</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-red-50 p-3 rounded-lg border border-red-200">
                  <span className="text-2xl">🔴</span>
                  <div>
                    <div className="font-medium text-red-800">긴급</div>
                    <div className="text-xs text-red-600">10% 이상 감소 또는 연속 감소</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'membership' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">멤버십 판매 현황 ({processedData.latestMonth})</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMembershipView('byCompany')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      membershipView === 'byCompany' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    법인별 보기
                  </button>
                  <button
                    onClick={() => setMembershipView('byProduct')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      membershipView === 'byProduct' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    상품별 보기
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {membershipView === 'byCompany' ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">법인명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">판매수량</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">매출</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...new Set(membershipData.filter(d => d.month === selectedMonth).map(d => d.company))].map((company, compIdx) => {
                        const companyProducts = membershipData.filter(d => d.month === selectedMonth && d.company === company);
                        const isExpanded = expandedCompanies[company];
                        const totalCount = companyProducts.reduce((sum, p) => sum + p.count, 0);
                        const totalAmount = companyProducts.reduce((sum, p) => sum + p.amount, 0);
                        
                        return (
                          <React.Fragment key={compIdx}>
                            <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleCompany(company)}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  {company}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">전체</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">{totalCount}개</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">{formatRevenue(totalAmount)}</td>
                            </tr>
                            {isExpanded && companyProducts.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ paddingLeft: '48px' }}>↳</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.product}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.count}개</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatRevenue(item.amount)}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">총 판매수량</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">총 매출</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...new Set(membershipData.filter(d => d.month === selectedMonth).map(d => d.product))].map((product, idx) => {
                        const productData = membershipData.filter(d => d.month === selectedMonth && d.product === product);
                        const totalCount = productData.reduce((sum, p) => sum + p.count, 0);
                        const totalAmount = productData.reduce((sum, p) => sum + p.amount, 0);

                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">{totalCount}개</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">{formatRevenue(totalAmount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && contentOptionsData && (
          <div className="space-y-6">
            {/* 매출 구성 요약 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">매출 구성 현황 ({processedData.latestMonth})</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {contentOptionsData[selectedMonth] && Object.keys(contentOptionsData[selectedMonth]).map((category, idx) => {
                  const data = contentOptionsData[selectedMonth][category];
                  const categoryIcons = {
                    'PT/개인레슨': '💪',
                    '그룹레슨': '👥',
                    '골프': '⛳',
                    '스쿼시': '🎾',
                    '기타': '➕'
                  };

                  return (
                    <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{categoryIcons[category] || '📦'}</span>
                        <div className="text-sm font-medium text-gray-700">{category}</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{data.total.count}건</div>
                      <div className="text-sm text-gray-600 mt-1">{formatRevenue(data.total.amount)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 카테고리별 상세 */}
            {contentOptionsData[selectedMonth] && Object.keys(contentOptionsData[selectedMonth]).map((category, catIdx) => {
              const categoryData = contentOptionsData[selectedMonth][category];

              return (
                <div key={catIdx} className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      총 {categoryData.total.count}건, {formatRevenue(categoryData.total.amount)}
                    </p>
                  </div>

                  <div className="p-6">
                    {/* 상품별 판매량 */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">상품별 판매량</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">상품명</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">판매수량</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">매출</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(categoryData.byProduct)
                              .sort(([,a], [,b]) => b.count - a.count)
                              .map(([product, data], idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm text-gray-900">{product}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{data.count}건</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatRevenue(data.amount)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 법인별 구매 현황 */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">법인별 구매 현황</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">법인명</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">구매건수</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">매출</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(categoryData.byCompany)
                              .sort(([,a], [,b]) => b.amount - a.amount)
                              .map(([company, data], idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm text-gray-900">{company}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{data.count}건</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatRevenue(data.amount)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCompany && <TrendModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />}
    </div>
  );
};

export default Dashboard;