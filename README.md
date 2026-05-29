# futuring v0.2 — 통합 버전 (고래 전용 놀이터 포함)

모바일과 PC 환경을 자동으로 감지해서 최적화된 레이아웃으로 실행됩니다.

- **모바일 (< 768px)**: 하단 탭바, 단열 카드
- **PC (≥ 768px)**: 상단 GNB, 3열 그리드, 사이드패널

## 실행 방법
1. `npm install`
2. `npm run dev`
3. http://localhost:3000 접속
4. 아이디/비밀번호 아무 값이나 입력 후 로그인

## 주요 변경 (v0.2)
- 🐋 고래 전용 놀이터 `/whale` — 군주 경매, 현상금, LP 예치
- 🔔 베팅 결과 alert → 인앱 Toast로 교체
- 📊 마켓 차트: 랜덤 → ledger 실제 데이터 기반
- 🔐 관리자 하드코딩 제거 → store.isAdmin으로 통일
- 📱 Explore 더보기 버튼 (모바일 3개씩)
- 📋 Activity 히스토리 개선 (미실현 PnL, 완료 포지션)
- ✅ BottomNav/PCNav 고래 탭 추가

## 계정
| 구분 | 설명 |
|------|------|
| 관리자 | cjdmadldpdy123 / dnjsanrhk1! |
| 일반 | 회원가입 후 사용 |
