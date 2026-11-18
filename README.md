# 꾸준히 학습지

[학습지 자료실 열기](https://zxc3285123-web.github.io/kkujunhi-worksheets/)

특수교육 수업용 국어·수학·일상생활 PDF를 교과와 학년군으로 찾아 내려받을 수 있습니다. 처음 등록한 학습지는 초등 1~2학년 1단원 9개입니다. 단원과 파트 번호는 꾸준히 학습지의 편집 순서입니다.

## 수업자료 공유

1. 사이트에서 **자료 올리기**를 누르고 제목·교과·학년군·소개를 작성합니다.
2. **GitHub에서 PDF 첨부하기**를 누릅니다. GitHub 로그인 후, 글의 **PDF 첨부** 아래에 PDF 한 개를 끌어다 놓고 **Create**로 등록합니다. 작성창에 입력된 교과와 학년군은 그대로 유지합니다.
3. 글과 첨부는 GitHub에 공개됩니다. 학생 개인정보를 제거하고 공유 권한이 있는 자료만 제출합니다.
4. 운영자가 파일이 PDF인지, 아이들에게 바로 사용할 수 있는지, 개인정보나 저작권 문제가 없는지 확인하고 **published** 라벨을 붙이면 사이트의 교사 공유 게시판에 표시됩니다. 숨기려면 이 라벨을 제거합니다.

## 꾸준히 학습지 추가

운영자도 같은 사이트 양식으로 PDF를 첨부합니다. 글에 **published**와 **official** 두 라벨을 붙이면 **학습지 자료실**에 올라갑니다. 다른 선생님의 글에는 **published**만 붙입니다. 라벨은 GitHub 저장소의 **Issues → Labels**에서 관리합니다.

초기 자료처럼 활동지 2쪽의 이미지 미리보기를 제공할 때는 PDF와 JPG를 저장소에 올린 뒤 `catalog.js`에 항목을 추가합니다. 자료마다 다른 학년군·단원인 경우, 파일명과 `grade`·`unit`을 항목 별로 지정합니다. 각 교과의 키는 `korean`, `math`, `daily`이며 학년군 키는 `e12`, `e34`, `e56`, `m13`, `h13`입니다.

사이트는 GitHub Pages의 **main / (root)**에서 게시합니다. 기본 PDF는 저장소에서 제공되며, 제출한 자료는 공개 GitHub Issues를 통해 표시합니다. 로컬에서 확인하려면 저장소 폴더에서 `python3 -m http.server 8000`을 실행하고 [localhost:8000](http://localhost:8000/)을 엽니다.

## 자료 출처

- 학습지와 미리보기 속 그림은 [OpenMoji](https://openmoji.org/)의 아이콘을 사용했습니다. OpenMoji 그림은 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)으로 제공되며 일부 파일을 래스터 이미지로 변환해 배치했습니다.
- 학습지 글꼴은 [나눔스퀘어라운드](https://hangeul.naver.com/font)와 [주아체](https://github.com/google/fonts/tree/main/ofl/jua)를 사용했습니다.
