// recentSearch.js
const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

function updateRecentSearches(stationName) {
  if (!recentSearches.includes(stationName)) {
    recentSearches.push(stationName);
    if (recentSearches.length > 5) { // 최근 5개만 저장
      recentSearches.shift();
    }
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }
  displayRecentSearches();
}

function displayRecentSearches() {
  const recentSearchDiv = document.getElementById('recent-searches');
  recentSearchDiv.innerHTML = '';
  recentSearches.forEach(station => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `<strong>${station}</strong>`;
    recentSearchDiv.appendChild(div);
  });
}

document.getElementById('search-btn').addEventListener('click', () => {
  const stationName = document.getElementById('station-input').value;
  if (!stationName) {
    alert('역 이름을 입력해주세요!');
    return;
  }

  updateRecentSearches(stationName);  // 최근 검색에 추가
  fetchStationData('all');  // 전체 데이터 다시 가져오기
});

// 최근 검색 목록 표시
displayRecentSearches();
