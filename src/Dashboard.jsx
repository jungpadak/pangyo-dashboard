import React, { useState, useMemo, useEffect } from 'react';
import { Download, ChevronDown, ChevronRight, TrendingUp, X } from 'lucide-react';
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

// 멤버십 상품 더미 데이터
const membershipData = [
  {month: '2024-10', company: '위메이드', product: '1개월 구독권', count: 80, amount: 6400000},
  {month: '2024-10', company: '위메이드', product: '6개월 이용권', count: 100, amount: 11000000},
  {month: '2024-10', company: '위메이드', product: '12개월 이용권', count: 85, amount: 8835000},
  {month: '2024-10', company: '크래프톤', product: '1개월 구독권', count: 50, amount: 4000000},
  {month: '2024-10', company: '크래프톤', product: '6개월 이용권', count: 70, amount: 7700000},
  {month: '2024-10', company: '크래프톤', product: '12개월 이용권', count: 42, amount: 4368000},
  {month: '2024-10', company: '넥슨코리아', product: '1개월 구독권', count: 45, amount: 3600000},
  {month: '2024-10', company: '넥슨코리아', product: '6개월 이용권', count: 65, amount: 7150000},
  {month: '2024-10', company: '넥슨코리아', product: '12개월 이용권', count: 46, amount: 4784000},
  {month: '2024-10', company: 'B2C 개인회원', product: '1개월 구독권', count: 120, amount: 9600000},
  {month: '2024-10', company: 'B2C 개인회원', product: '6개월 이용권', count: 50, amount: 5500000},
  {month: '2024-10', company: 'B2C 개인회원', product: '12개월 이용권', count: 22, amount: 2288000},
];

// 콘텐츠 & 옵션 더미 데이터
const contentData = [
  {month: '2024-10', company: '위메이드', product: 'PT 10회', count: 30, amount: 2400000},
  {month: '2024-10', company: '위메이드', product: 'PT 20회', count: 15, amount: 1650000},
  {month: '2024-10', company: '위메이드', product: 'PT 30회', count: 8, amount: 1040000},
  {month: '2024-10', company: '위메이드', product: '스쿼시', count: 8, amount: 480000},
  {month: '2024-10', company: 'B2C 개인회원', product: 'PT 10회', count: 40, amount: 3200000},
  {month: '2024-10', company: 'B2C 개인회원', product: 'PT 20회', count: 22, amount: 2420000},
  {month: '2024-10', company: 'B2C 개인회원', product: 'PT 30회', count: 12, amount: 1560000},
  {month: '2024-10', company: 'B2C 개인회원', product: '골프', count: 12, amount: 1440000},
  {month: '2024-10', company: 'B2C 개인회원', product: '1일권', count: 35, amount: 525000},
  {month: '2024-10', company: '크래프톤', product: 'PT 10회', count: 18, amount: 1440000},
  {month: '2024-10', company: '크래프톤', product: '스쿼시', count: 5, amount: 300000},
  {month: '2024-10', company: '넥슨코리아', product: 'PT 10회', count: 22, amount: 1760000},
  {month: '2024-10', company: '넥슨코리아', product: 'PT 20회', count: 10, amount: 1100000},
  {month: '2024-10', company: '넥슨코리아', product: 'PT 30회', count: 5, amount: 650000},
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
  const [loading, setLoading] = useState(true);

  // API에서 실제 데이터 가져오기
  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard-data').then(res => res.json()),
      fetch('/api/company-stats').then(res => res.json()),
      fetch('/api/pangyo-segments').then(res => res.json())
    ])
      .then(([dashboardRes, companyRes, segmentRes]) => {
        if (dashboardRes.success) {
          setDashboardData(dashboardRes.data);
        }
        if (companyRes.success) {
          setRealData(companyRes.data);
        }
        if (segmentRes.success) {
          setSegmentData(segmentRes.data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('데이터 로드 실패:', error);
        setLoading(false);
      });
  }, []);
  
  const processedData = useMemo(() => {
    // 로딩 중이거나 데이터가 없으면 null 반환
    if (loading || dashboardData.length === 0 || !segmentData) {
      return null;
    }

    const dataToUse = dashboardData;

    const months = [...new Set(dataToUse.map(d => d.month))].sort();
    const latestMonth = months[months.length - 1];
    const previousMonth = months[months.length - 2];

    const latestData = dataToUse.filter(d => d.month === latestMonth);
    const previousData = dataToUse.filter(d => d.month === previousMonth);

    // segmentData에서 실제 전체 회원 수 가져오기
    const totalMembers = segmentData.total;
    const totalRevenue = latestData.reduce((sum, d) => sum + d.revenue, 0);

    // 전월 회원 수는 계산 (API에서 가져올 수 없음)
    const prevTotalMembers = previousData.reduce((sum, d) => sum + d.members, 0);
    const prevTotalRevenue = previousData.reduce((sum, d) => sum + d.revenue, 0);

    const memberChange = totalMembers - prevTotalMembers;
    const revenueChange = totalRevenue - prevTotalRevenue;
    
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
      latestMonth,
      previousMonth,
      riskList: companyAnalysis.filter(c => c.status === '🔴'),
      totalHistory
    };
  }, [dashboardData, sortConfig, loading, segmentData]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const downloadCSV = () => {
    const headers = ['월', '법인명', '유형', '회원수', '매출'];
    const rows = rawData.map(d => [d.month, d.company, d.type, d.members, d.revenue]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Butfit_판교벤처타운_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
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

    // 모든 법인의 추이 데이터 분석
    const analyzedCompanies = companies.map(company => {
      const history = company.history;
      const startValue = history[0].members;
      const endValue = history[history.length - 1].members;
      const totalChange = ((endValue - startValue) / startValue) * 100;
      
      const recentHistory = history.slice(-3);
      const recentTrend = recentHistory.map((h, i) => i === 0 ? 0 : h.members - recentHistory[i-1].members);
      
      return {
        ...company,
        totalChange,
        trend: totalChange < -5 ? 'decrease' : totalChange > 5 ? 'increase' : 'stable'
      };
    });

    const decreasingCompanies = analyzedCompanies.filter(c => c.trend === 'decrease');
    const increasingCompanies = analyzedCompanies.filter(c => c.trend === 'increase');
    const stableCompanies = analyzedCompanies.filter(c => c.trend === 'stable');

    // Recharts용 데이터 포맷
    const chartData = totalHistory.map((h, idx) => {
      const dataPoint = {
        month: h.month.slice(2),
        Total: h.members
      };
      
      // 각 법인의 데이터 추가
      [...decreasingCompanies, ...increasingCompanies].slice(0, 5).forEach(company => {
        if (company.history[idx]) {
          dataPoint[company.name] = company.history[idx].members;
        }
      });
      
      return dataPoint;
    });

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">전체 회원 추이 (Total) 및 주요 법인 현황</h3>
            <p className="text-sm text-gray-500 mt-1">
              총 {companies.length}개 법인 · 
              <span className="text-red-600 font-medium ml-2">감소 {decreasingCompanies.length}개</span>
              <span className="text-green-600 font-medium ml-2">증가 {increasingCompanies.length}개</span>
              <span className="text-gray-600 font-medium ml-2">안정 {stableCompanies.length}개</span>
            </p>
          </div>
        </div>

        <div className="relative bg-white rounded-lg p-4" style={{ height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 11 }} 
                tickFormatter={(value) => value.toLocaleString()}
                label={{ value: '회원수 (명)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }} 
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                formatter={(value, name) => [value.toLocaleString() + '명', name]}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend 
                wrapperStyle={{ fontSize: 11 }}
                iconType="line"
              />
              
              {/* Total은 막대그래프 */}
              <Bar
                yAxisId="right"
                dataKey="Total"
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

              {/* 감소 법인들 - 굵은 빨간 선 */}
              {decreasingCompanies.slice(0, 3).map((company, idx) => (
                <Line
                  key={`decrease-${idx}`}
                  yAxisId="left"
                  type="monotone"
                  dataKey={company.name}
                  stroke="#dc2626"
                  strokeWidth={3.5}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#dc2626' }}
                />
              ))}

              {/* 증가 법인들 - 초록 선 */}
              {increasingCompanies.slice(0, 2).map((company, idx) => (
                <Line
                  key={`increase-${idx}`}
                  yAxisId="left"
                  type="monotone"
                  dataKey={company.name}
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#059669' }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 범례 */}
        <div className="flex gap-6 mt-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 bg-blue-300 opacity-60 rounded"></div>
            <span className="text-gray-600 font-medium">Total (막대그래프)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500"></div>
            <span className="text-gray-600">감소 추세 법인 (꺾은선)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-green-500"></div>
            <span className="text-gray-600">증가 추세 법인 (꺾은선)</span>
          </div>
        </div>

        {/* 감소 법인 상세 */}
        {decreasingCompanies.length > 0 && (
          <div className="mt-6 bg-red-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ 감소 추세 법인 상세</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {decreasingCompanies.map((company, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium text-red-900">{company.name}</span>
                  <span className="text-red-700 ml-2">
                    {company.totalChange.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 증가 법인 상세 */}
        {increasingCompanies.length > 0 && (
          <div className="mt-4 bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2">📈 증가 추세 법인 상세</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {increasingCompanies.map((company, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium text-green-900">{company.name}</span>
                  <span className="text-green-700 ml-2">
                    +{company.totalChange.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const TrendModal = ({ company, onClose }) => {
    if (!company) return null;

    const members = company.history.map(h => h.members);
    const maxMembers = Math.max(...members);
    const minMembers = Math.min(...members);

    // Recharts용 데이터
    const chartData = company.history.map(h => ({
      month: h.month.slice(5),
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

    // 기존 카테고리
    const existingCompanies = [...hierarchy.existing.wemade, ...hierarchy.existing.wemadeOther, ...hierarchy.existing.nonResident];
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
          {existingCompanies.reduce((sum, c) => sum + c.members, 0).toLocaleString()}명
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
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

    // 신규 회원사 카테고리 (하위 계층 없이 단순화)
    const newCompanies = hierarchy.new;
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
          {newCompanies.reduce((sum, c) => sum + c.members, 0).toLocaleString()}명
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
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
            {unverifiedMembers.reduce((sum, c) => sum + c.members, 0).toLocaleString()}명
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">-</td>
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
            <p className="text-gray-600 text-lg">법인회원 관리 대시보드 · 기준: {processedData.latestMonth}</p>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200 font-medium"
          >
            <Download size={20} />
            CSV 다운로드
          </button>
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
            onClick={() => setActiveTab('hierarchy')}
            className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'hierarchy'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm'
            }`}
          >
            계층별 분석
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

        {activeTab === 'hierarchy' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">계층별 회원 및 매출 현황</h2>
              <p className="text-sm text-gray-500 mt-1">카테고리를 클릭하여 펼치거나 접을 수 있습니다</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">회원수</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">매출</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <HierarchyRow
                    label="기존"
                    members={
                      processedData.hierarchyData.existing.wemade.reduce((s, d) => s + d.members, 0) +
                      processedData.hierarchyData.existing.wemadeOther.reduce((s, d) => s + d.members, 0) +
                      processedData.hierarchyData.existing.nonResident.reduce((s, d) => s + d.members, 0)
                    }
                    revenue={
                      processedData.hierarchyData.existing.wemade.reduce((s, d) => s + d.revenue, 0) +
                      processedData.hierarchyData.existing.wemadeOther.reduce((s, d) => s + d.revenue, 0) +
                      processedData.hierarchyData.existing.nonResident.reduce((s, d) => s + d.revenue, 0)
                    }
                    level={0}
                    category="existing"
                    isExpanded={expandedCategories.existing}
                  />
                  {expandedCategories.existing && (
                    <>
                      <HierarchyRow
                        label="위메이드"
                        data={processedData.hierarchyData.existing.wemade}
                        members={processedData.hierarchyData.existing.wemade.reduce((s, d) => s + d.members, 0)}
                        revenue={processedData.hierarchyData.existing.wemade.reduce((s, d) => s + d.revenue, 0)}
                        level={1}
                        category="wemade"
                        isExpanded={expandedCategories.wemade}
                      />
                      <HierarchyRow
                        label="위메이드 외"
                        data={processedData.hierarchyData.existing.wemadeOther}
                        members={processedData.hierarchyData.existing.wemadeOther.reduce((s, d) => s + d.members, 0)}
                        revenue={processedData.hierarchyData.existing.wemadeOther.reduce((s, d) => s + d.revenue, 0)}
                        level={1}
                        category="wemadeOther"
                        isExpanded={expandedCategories.wemadeOther}
                      />
                      <HierarchyRow
                        label="비입주사"
                        data={processedData.hierarchyData.existing.nonResident}
                        members={processedData.hierarchyData.existing.nonResident.reduce((s, d) => s + d.members, 0)}
                        revenue={processedData.hierarchyData.existing.nonResident.reduce((s, d) => s + d.revenue, 0)}
                        level={1}
                        category="nonResident"
                        isExpanded={expandedCategories.nonResident}
                      />
                    </>
                  )}
                  
                  <HierarchyRow
                    label="신규"
                    members={
                      processedData.hierarchyData.new.b2b.reduce((s, d) => s + d.members, 0) +
                      processedData.hierarchyData.new.b2c.reduce((s, d) => s + d.members, 0)
                    }
                    revenue={
                      processedData.hierarchyData.new.b2b.reduce((s, d) => s + d.revenue, 0) +
                      processedData.hierarchyData.new.b2c.reduce((s, d) => s + d.revenue, 0)
                    }
                    level={0}
                    category="new"
                    isExpanded={expandedCategories.new}
                  />
                  {expandedCategories.new && (
                    <>
                      <HierarchyRow
                        label="B2B"
                        data={processedData.hierarchyData.new.b2b}
                        members={processedData.hierarchyData.new.b2b.reduce((s, d) => s + d.members, 0)}
                        revenue={processedData.hierarchyData.new.b2b.reduce((s, d) => s + d.revenue, 0)}
                        level={1}
                        category="b2b"
                        isExpanded={expandedCategories.b2b}
                      />
                      <HierarchyRow
                        label="B2C"
                        data={processedData.hierarchyData.new.b2c}
                        members={processedData.hierarchyData.new.b2c.reduce((s, d) => s + d.members, 0)}
                        revenue={processedData.hierarchyData.new.b2c.reduce((s, d) => s + d.revenue, 0)}
                        level={1}
                        category="b2c"
                        isExpanded={expandedCategories.b2c}
                      />
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'membership' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">멤버십 판매 현황 (2024년 10월)</h2>
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
                      {[...new Set(membershipData.map(d => d.company))].map((company, compIdx) => {
                        const companyProducts = membershipData.filter(d => d.company === company);
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
                      {['1개월 구독권', '6개월 이용권', '12개월 이용권'].map((product, idx) => {
                        const productData = membershipData.filter(d => d.product === product);
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

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">콘텐츠 & 옵션 판매 현황 (2024년 10월)</h2>
              </div>
              
              {/* 상품별 요약 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {['PT 10회', 'PT 20회', 'PT 30회', '스쿼시', '골프', '1일권'].map((product, idx) => {
                  const productData = contentData.filter(d => d.product === product);
                  const totalCount = productData.reduce((sum, p) => sum + p.count, 0);
                  const totalAmount = productData.reduce((sum, p) => sum + p.amount, 0);
                  
                  if (totalCount === 0) return null;
                  
                  return (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-700 font-medium">{product}</div>
                      <div className="text-2xl font-bold text-gray-900 mt-2">{totalCount}개</div>
                      <div className="text-sm text-gray-600 mt-1">{formatRevenue(totalAmount)}</div>
                    </div>
                  );
                })}
              </div>

              {/* 상품별 상세 테이블 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">총 판매수량</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">총 매출</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">평균 단가</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {['PT 10회', 'PT 20회', 'PT 30회', '스쿼시', '골프', '1일권'].map((product, idx) => {
                      const productData = contentData.filter(d => d.product === product);
                      const totalCount = productData.reduce((sum, p) => sum + p.count, 0);
                      const totalAmount = productData.reduce((sum, p) => sum + p.amount, 0);
                      const avgPrice = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
                      
                      if (totalCount === 0) return null;
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">{totalCount}개</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">{formatRevenue(totalAmount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatRevenue(avgPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 법인별 구매 내역 (참고용) */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">법인별 구매 내역 (상세)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">법인명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">매출</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contentData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.company}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.count}개</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatRevenue(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedCompany && <TrendModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />}
    </div>
  );
};

export default Dashboard;