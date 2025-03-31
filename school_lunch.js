// API URL 설정
const apiKey = '618a629dbd96467897a444349cc3c372';
const atptOfcdcScCode = 'J10';  // 서울특별시 교육청 코드
const sdSchulCode = 'B100000189';  // 세명컴퓨터고등학교 코드
const mlsvYmd = '20250331';  // 원하는 날짜 (2025년 3월 31일)

// API URL 생성
const url = `http://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${apiKey}&Type=json&ATPT_OFCDC_SC_CODE=${atptOfcdcScCode}&SD_SCHUL_CODE=${sdSchulCode}&MLSV_YMD=${mlsvYmd}`;

// fetch API 호출
fetch(url)
  .then(response => response.json())  // 응답을 JSON 형태로 변환
  .then(data => {
    // 성공적으로 데이터를 받아왔을 때
    console.log(data);  // 데이터 콘솔에 출력
    if (data.mealServiceDietInfo && data.mealServiceDietInfo.length > 0) {
      // 급식 정보가 있을 경우 처리
      const mealData = data.mealServiceDietInfo[1];  // 급식 데이터는 배열 형태로 들어옵니다
      console.log(`날짜: ${mealData.date}`);
      console.log('급식 내용:');
      mealData.row.forEach(item => {
        console.log(`- ${item.DDISH_NM}`);
      });
    } else {
      console.log("급식 정보가 없습니다.");
    }
  })
  .catch(error => {
    // 오류가 발생했을 때
    console.error("API 호출 중 오류 발생:", error);
  });
