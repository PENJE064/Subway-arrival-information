// pushNotification.js
if ('Notification' in window && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker 등록됨:', registration);
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('알림 권한이 부여되었습니다.');
            } else {
              console.log('알림 권한이 거부되었습니다.');
            }
          });
        }
      })
      .catch(err => {
        console.error('Service Worker 등록 실패:', err);
      });
  }
  