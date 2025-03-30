const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js'); // xml2js를 이용하여 XML 파싱
const app = express();
const PORT = 3000;

const cors = require('cors'); 
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

        const stationData = rows.map(row => ({
          subwayId: row.subwayId[0],
          updnLine: row.updnLine[0],
          trainLineNm: row.trainLineNm[0],
          stationNm: row.statnNm[0],
          arrivalTime: row.recptnDt[0],
          status: row.btrainSttus[0],
          trainNo: row.btrainNo[0],
        }));

        res.json(stationData); // 응답 데이터 전송
      });
    })
    .catch(err => {
      console.error('Error fetching API:', err);
      res.status(500).send('API 요청 중 오류가 발생했습니다.');
    });
});
