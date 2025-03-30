const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js'); // xml2js를 이용하여 XML 파싱
const path = require('path');
const cors = require('cors');
const moment = require('moment'); // 날짜/시간 관련 라이브러리 추가

const app = express();
const PORT = 3000;

// 정적 파일 제공 (public 폴더 내 파일 제공)
app.use(express.static(path.join(__dirname)));

// CORS 설정
app.use(cors({
  origin: '*',  // 모든 도메인 허용 (특정 도메인만 허용하려면 여기에 URL 넣기)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // 허용할 메서드
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],  // 허용할 헤더
  preflightContinue: false, // OPTIONS 요청에 대한 응답을 즉시 전송
  optionsSuccessStatus: 204 // 일부 브라우저에서 OPTIONS 요청 후 상태 코드 204를 반환하게 설정
}));

// POST 요청을 위한 body-parser 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

// 특정 역에 대한 실시간 도착 정보를 가져오는 POST 요청 처리
app.post("/station_name", (req, res) => {
  const stationName = req.body.stationName;

  if (!stationName) {
    return res.status(400).send("역 이름을 입력해주세요.");
  }

  // 수정된 API URL
  const apiUrl = `http://swopenapi.seoul.go.kr/api/subway/sample/xml/realtimeStationArrival/1/5/${encodeURIComponent(stationName)}`;

  axios.get(apiUrl)
    .then(response => {
      const xmlData = response.data;
      const parser = new xml2js.Parser();
      parser.parseString(xmlData, (err, result) => {
        if (err) {
          console.error('XML Parsing error:', err);
          return res.status(500).send('API 응답 처리 중 오류가 발생했습니다.');
        }

        const rows = result.realtimeStationArrival.row;
        if (!rows || rows.length === 0) {
          return res.status(404).send('해당 역에 대한 실시간 정보가 없습니다.');
        }

        const stationData = rows.map(row => {
          const arrivalMsg = row.arvlMsg2 ? row.arvlMsg2[0] : "예정 시간이 없습니다."; // arvlMsg2가 있는 경우 사용
          
          // 도착 예정 시간이 "10분 후" 같은 형식으로 제공되면 그 값을 그대로 사용할 수 있음
          const arrivalInMinutes = arrivalMsg.includes("후") 
            ? parseInt(arrivalMsg.split(" ")[0]) // "10분 후" -> 10 추출
            : "예정 시간이 없습니다.";  // 예외 처리

          return {
            subwayId: row.subwayId[0],
            updnLine: row.updnLine[0],
            trainLineNm: row.trainLineNm[0],
            stationNm: row.statnNm[0],
            arrivalTime: row.recptnDt[0], // 기본 도착 시간
            status: row.btrainSttus[0],
            arrivalInMinutes: arrivalInMinutes // 도착 시간 (분 단위)
          };
        });

        res.json(stationData); // 응답 데이터 전송
      });
    })
    .catch(err => {
      console.error('Error fetching API:', err);
      res.status(500).send('API 요청 중 오류가 발생했습니다.');
    });
});
