const express = require('express'); // Express 웹 프레임워크 불러오기
const axios = require('axios'); // HTTP 요청을 위한 axios 라이브러리 불러오기
const xml2js = require('xml2js'); // XML을 JSON으로 변환하기 위한 xml2js 라이브러리 불러오기
const path = require('path'); // 파일 및 디렉토리 경로 설정을 위한 path 모듈 불러오기
const cors = require('cors'); // CORS 설정을 위한 cors 라이브러리 불러오기
const moment = require('moment'); // 날짜 및 시간 처리를 위한 moment 라이브러리 불러오기

const app = express(); // Express 애플리케이션 생성
const PORT = 3000; // 서버가 실행될 포트 설정

// 정적 파일 제공 (현재 디렉토리에서 정적 파일 제공)
app.use(express.static(path.join(__dirname)));

// CORS 설정 (모든 도메인 허용 및 허용할 HTTP 메서드와 헤더 지정)
app.use(cors({
  origin: '*', // 모든 도메인 허용 (특정 도메인만 허용하려면 URL 지정)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드 지정
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // 허용할 헤더 지정
  preflightContinue: false, // OPTIONS 요청에 대한 응답을 즉시 전송
  optionsSuccessStatus: 204 // OPTIONS 요청에 대한 응답 코드 204 반환
}));

// JSON 및 URL-encoded 데이터 파싱을 위한 미들웨어
app.use(express.json()); // JSON 형식의 요청 본문을 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 형식의 요청 본문을 파싱

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

// 특정 지하철 역의 실시간 도착 정보를 가져오는 POST 요청 처리
app.post("/station_name", (req, res) => {
  const stationName = req.body.stationName; // 요청 본문에서 역 이름을 가져오기

  if (!stationName) { // 역 이름이 제공되지 않은 경우 오류 응답 반환
    return res.status(400).send("역 이름을 입력해주세요.");
  }

  // 서울 열린데이터 광장의 실시간 지하철 도착 정보 API 호출 URL (예제 API 키 사용)
  const apiUrl = `http://swopenapi.seoul.go.kr/api/subway/sample/xml/realtimeStationArrival/1/5/${encodeURIComponent(stationName)}`;

  // API 호출 (XML 데이터를 가져옴)
  axios.get(apiUrl)
    .then(response => {
      const xmlData = response.data; // API 응답 데이터(XML 형식)
      const parser = new xml2js.Parser(); // XML을 JSON으로 변환할 파서 생성

      // XML을 JSON으로 변환
      parser.parseString(xmlData, (err, result) => {
        if (err) { // 변환 중 오류 발생 시 처리
          console.error('XML Parsing error:', err);
          return res.status(500).send('API 응답 처리 중 오류가 발생했습니다.');
        }

        const rows = result.realtimeStationArrival.row; // 변환된 JSON 데이터에서 도착 정보 추출
        if (!rows || rows.length === 0) { // 도착 정보가 없을 경우 응답 처리
          return res.status(404).send('해당 역에 대한 실시간 정보가 없습니다.');
        }

        // JSON 데이터를 필요한 형식으로 변환하여 응답
        const stationData = rows.map(row => {
          const arrivalMsg = row.arvlMsg2 ? row.arvlMsg2[0] : "예정 시간이 없습니다."; // 도착 메시지 추출
          
          // "10분 후" 같은 형식의 도착 메시지를 숫자로 변환
          const arrivalInMinutes = arrivalMsg.includes("후") 
            ? parseInt(arrivalMsg.split(" ")[0]) // "10분 후" -> 10 추출
            : "예정 시간이 없습니다.";  // 예외 처리

          return {
            subwayId: row.subwayId[0], // 지하철 ID
            updnLine: row.updnLine[0], // 상행/하행 정보
            trainLineNm: row.trainLineNm[0], // 열차 노선명
            stationNm: row.statnNm[0], // 역 이름
            arrivalTime: row.recptnDt[0], // 기본 도착 시간
            status: row.btrainSttus[0], // 열차 상태 정보
            arrivalInMinutes: arrivalInMinutes // 도착까지 남은 시간 (분 단위)
          };
        });

        res.json(stationData); // 변환된 데이터 JSON 형식으로 응답 전송
      });
    })
    .catch(err => { // API 호출 중 오류 발생 시 처리
      console.error('Error fetching API:', err);
      res.status(500).send('API 요청 중 오류가 발생했습니다.');
    });
});
