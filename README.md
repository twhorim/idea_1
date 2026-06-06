# 🎓 성취기준 분석기 (2022 개정) - GitHub 연동 및 Vercel 배포 가이드

본 애플리케이션은 **Google Cloud Run(컨테이너)** 및 **Vercel(서버리스)** 두 플랫폼에 모두 호환되도록 완벽히 튜닝되었습니다. 아래 가이드를 따라 GitHub에 업로드하고 Vercel로 편리하게 배포 및 운용하실 수 있습니다.

---

## 🛠️ 설계 특징 (Double-Compatibility)
* **로컬 및 Cloud Run (컨테이너)**: `server.ts`가 구동되어 Express 상에서 Vite 개발 서버와 API 핸들러를 바인딩하여 안정적으로 작동합니다.
* **Vercel (서버리스 함수)**: `/api/analyze.ts` 구조로 분리되어 있어, Vercel 배포 시스템이 추가적인 인프라 설정 없이 `/api/analyze` 경로를 구글 람다(Lambda) 기반의 Node.js 서버리스 API로 자동 컴파일 및 서빙합니다.

---

## 🌐 1단계: GitHub 저장소 연동 및 동기화

Vite 및 Express 코드를 GitHub에 업로드하는 방법은 크게 두 가지가 있습니다.

### 방법 A: AI Studio 내보내기 기능 사용 (가장 간단하고 직관적)
1. 화면 우측 상단의 **설정(Settings)** 메뉴를 누릅니다.
2. **Export to GitHub(GitHub로 내보내기)** 아이콘 또는 버튼을 선택합니다.
3. 구글 계정과 본인의 GitHub 계정을 연동한 후, 저장소 이름을 입력하여 바로 비공개(Private) 또는 공개(Public) 레포지토리로 내보냅니다.

### 방법 B: Git CLI를 이용한 수동 업로드
로컬 터미널을 이용하실 경우, 아래 명령어를 실행하여 GitHub 새 저장소에 업로드할 수 있습니다:
```bash
# 로컬 Git 초기화
git init

# 전체 파일 추가 및 커밋
git add .
git commit -m "feat: Vercel serverless dual-compatibility setup"

# github 원격지 연결 및 푸시
git branch -M main
git remote add origin https://github.com/사용자이름/저장소이름.git
git push -u origin main
```

---

## 🚀 2단계: Vercel 서비스에 가져오기 및 원클릭 배포

1. **[Vercel 대시보드](https://vercel.com)**에 로그인합니다. (GitHub 계정으로 가입하는 것을 권장합니다.)
2. 우측 상단의 **Add New...** -> **Project** 버튼을 누릅니다.
3. 방금 동기화/업로드한 GitHub 저장소(예: `성취기준 분석기`)를 목록에서 찾아 **Import** 버튼을 클릭합니다.
4. **Project Settings(프로젝트 설정)**이 나타나면 아래 항목을 확인합니다:
   * **Framework Preset**: 자동으로 `Vite`가 감지됩니다. (그대로 유지)
   * **Root Directory**: `./` (기본값 그대로 유지)
   * **Build and Output Settings**: 설정 수정할 필요 없이 기본값으로 작동합니다.

---

## 🔑 3단계: Gemini API key 환경 변수 설정 (매우 중요)

Gemini 분석 모델이 Vercel 환경에서 안전하게 동작하려면 API Key가 등록되어 있어야 합니다. (브라우저나 프론트엔드 코드에는 노출되지 않고, Vercel 클라우드 서버 내부에 비밀리로 저장됩니다.)

1. Vercel 배포 설정 화면 하단의 **Environment Variables (환경 변수)** 탭을 확장합니다.
2. 아래와 같이 입력하여 추가합니다:
   * **Key (이름)**: `GEMINI_API_KEY`
   * **Value (값)**: 본인의 Google AI Studio에서 발급받은 Gemini API 키 입력 (`AIzaSy...`로 시작하는 키)
3. **Add** 버튼을 눌러 등록을 완료합니다.

---

## 🎉 4단계: 배포 완료 및 접속

1. 모든 설정이 끝났다면 제일 하단의 **Deploy** 버튼을 클릭합니다.
2. 약 1분간 빌드가 실행된 후 가상 폭죽과 함께 **Congratulations!** 화면이 나타납니다.
3. 부여받은 Vercel 주소(예: `https://your-project.vercel.app`)를 사용하여 언제 어느 기기에서나 즉시 접속하고 학교 수업 설계 솔루션으로 활용하실 수 있습니다!

---

### 📝 수정 및 재개발 가이드
* 프론트엔드 분석 폼이나 화면 디자인을 변경하려면: `/src/App.tsx` 파일 또는 `/src/` 안의 컴포넌트들을 수정 후 GitHub에 push하면 **Vercel이 이를 감지하여 무중단 자동 재배포**를 수행합니다.
* Gemini의 교과 전문 분석 지침을 커스텀하거나 알고리즘을 변경하려면: `/api/analyze.ts` 내부에 정의된 프롬프트와 시스템 인스트럭션(`systemInstruction`) 문장을 커스텀하시면 바로 반영됩니다.
