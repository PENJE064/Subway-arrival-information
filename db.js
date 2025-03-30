const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const xml2js = require('xml2js');  // xml2js 추가

// 데이터베이스 파일 연결 (없으면 생성됨)
const db = new sqlite3.Database('./subway_data.db');

// 테이블 생성
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS subway_arrivals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subway_id INTEGER,
    updn_line TEXT,
    train_line_nm TEXT,
    station_nm TEXT,
    arrival_time TEXT,
    status TEXT,
    train_no TEXT,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API URL (지하철 실시간 도착 정보)
const apiUrl = 'http://swopenapi.seoul.go.kr/api/subway/sample/xml/realtimeStationArrival/1/5/%EC%97%B0%EC%8B%A0%EB%82%B4';

// 데이터를 새로고침하는 함수
const fetchSubwayData = () => {
  // API 요청
  axios.get(apiUrl)
    .then(response => {
      const xmlData = response.data;
      const parser = new xml2js.Parser();  // xml2js.Parser 사용
      parser.parseString(xmlData, (err, result) => {
        if (err) {
          console.error('XML Parsing error:', err);
          return;
        }

        const rows = result.realtimeStationArrival.row;  // 파싱된 데이터에서 row 접근

        rows.forEach(row => {
          const subwayId = row.subwayId[0];
          const updnLine = row.updnLine[0];
          const trainLineNm = row.trainLineNm[0];
          const stationNm = row.statnNm[0];
          const arrivalTime = row.recptnDt[0];
          const status = row.btrainSttus[0];
          const trainNo = row.btrainNo[0];

          // SQLite 데이터베이스에 삽입
          db.run(`INSERT INTO subway_arrivals (subway_id, updn_line, train_line_nm, station_nm, arrival_time, status, train_no)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [subwayId, updnLine, trainLineNm, stationNm, arrivalTime, status, trainNo], 
            function(err) {
              if (err) {
                console.error('Error inserting data:', err.message);
              } else {
                console.log(`Inserted row with id: ${this.lastID}`);
              }
          });
        });
      });
    })
    .catch(err => {
      console.error('Error fetching API:', err);
    });
};

// 이 모듈을 export 하여 다른 파일에서 가져올 수 있도록
module.exports = {
  fetchSubwayData
};

// 예시로 콘솔에서 수동으로 호출하여 새로고침 해보는 코드
fetchSubwayData();  // 수동으로 호출

// 이후, 사용자 인터페이스나 다른 이벤트에 따라 fetchSubwayData()를 호출하면 됩니다.
