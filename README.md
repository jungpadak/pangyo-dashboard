# 판교 벤처타운 대시보드

법인회원 관리 대시보드

## 🚀 Railway 배포 가이드

### 1단계: GitHub Repository 생성

1. GitHub (https://github.com) 접속 후 로그인
2. 오른쪽 상단 `+` 클릭 → `New repository` 선택
3. Repository 정보 입력:
   - Repository name: `pangyo-dashboard` (원하는 이름)
   - Public 또는 Private 선택
   - ⚠️ **"Initialize this repository" 옵션들은 체크 해제** (README, .gitignore 등)
4. `Create repository` 클릭

### 2단계: GitHub에 코드 푸시

터미널에서 다음 명령어 실행 (YOUR_USERNAME을 본인 GitHub 아이디로 변경):

```bash
git remote add origin https://github.com/YOUR_USERNAME/pangyo-dashboard.git
git branch -M main
git push -u origin main
```

### 3단계: Railway 배포

1. **Railway 가입 및 로그인**
   - https://railway.app 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - 대시보드에서 `New Project` 클릭
   - `Deploy from GitHub repo` 선택
   - `pangyo-dashboard` repository 선택

3. **PostgreSQL 데이터베이스 추가**
   - 프로젝트 대시보드에서 `+ New` 클릭
   - `Database` → `Add PostgreSQL` 선택

4. **환경변수 설정**
   - 프로젝트의 `Variables` 탭 클릭
   - 다음 환경변수 추가:

   ```
   NODE_ENV=production
   DB_HOST=<Railway PostgreSQL Host>
   DB_PORT=<Railway PostgreSQL Port>
   DB_USER=<Railway PostgreSQL User>
   DB_PASSWORD=<Railway PostgreSQL Password>
   DB_NAME=<Railway PostgreSQL Database>
   ```

   💡 **Tip**: PostgreSQL 서비스의 `Connect` 탭에서 연결 정보 확인 가능

5. **배포 완료!**
   - Railway가 자동으로 빌드 & 배포
   - `Settings` → `Domains`에서 Public URL 확인
   - 생성된 URL로 접속하여 대시보드 확인

## 📝 환경변수 설정 상세

Railway PostgreSQL 연결 정보는 다음과 같이 매핑됩니다:

| 환경변수 | 설명 |
|---------|------|
| `NODE_ENV` | production |
| `DB_HOST` | Railway PostgreSQL의 PGHOST |
| `DB_PORT` | Railway PostgreSQL의 PGPORT |
| `DB_USER` | Railway PostgreSQL의 PGUSER |
| `DB_PASSWORD` | Railway PostgreSQL의 PGPASSWORD |
| `DB_NAME` | Railway PostgreSQL의 PGDATABASE |

## 🔧 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (프론트엔드 + 백엔드 별도)
npm run dev          # 프론트엔드 (포트 3002)
node server.js       # 백엔드 (포트 3003)

# 프로덕션 빌드
npm run build
npm start
```

## 📊 구조

```
├── src/              # React 프론트엔드
├── server.js         # Express 백엔드 API
├── railway.json      # Railway 배포 설정
└── .env             # 로컬 환경변수 (Git에 포함 안 됨)
```

## 🎯 기능

- ✅ 기존/신규/미인증 회원 MECE 분류
- ✅ 법인별 회원 통계 및 추이
- ✅ 월별 변화 추적
- ✅ Google Sheets 연동
- ✅ PostgreSQL 데이터베이스 연동
