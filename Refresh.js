const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const xml2js = require('xml2js');

// 데이터베이스 파일 연결
const db = new sqlite3.Database('./subway_data.db');

// 테이블의 모든 데이터를 삭제
db.serialize(() => {
  db.run("DELETE FROM subway_arrivals", function(err) {
    if (err) {
      console.error("Error deleting data:", err.message);
    } else {
      console.log("All data deleted from subway_arrivals table.");
      
      // API 요청
      const apiUrl = 'http://swopenapi.seoul.go.kr/api/subway/sample/xml/realtimeStationArrival/1/5/%EC%97%B0%EC%8B%A0%EB%82%B4';
      axios.get(apiUrl)
        .then(response => {
          const xmlData = response.data;
          const parser = new xml2js.Parser();
          parser.parseString(xmlData, (err, result) => {
            if (err) {
              console.error('XML Parsing error:', err);
              return;
            }

            const rows = result.realtimeStationArrival.row;

            rows.forEach(row => {
              const subwayId = row.subwayId[0];
              const updnLine = row.updnLine[0];
              const trainLineNm = row.trainLineNm[0];
              const stationNm = row.statnNm[0];
              const arrivalTime = row.recptnDt[0];
              const status = row.btrainSttus[0];
              const trainNo = row.btrainNo[0];

              // 새 데이터 삽입
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
    }
  });
});
