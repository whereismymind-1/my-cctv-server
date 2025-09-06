const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = 3000;
const MAX_CLIENTS = 15; // 최대 동시 시청자 수
let cameraProcess = null; // 처음 카메라 세팅
const clients = new Set(); // 현재 연결된 모든 클라이언트를 저장, 한 클라이언트 중복 실행 방지


app.use(express.static(path.join(__dirname, 'public')));
app.use('/three', express.static(path.join(__dirname, 'node_modules/three')));

// 전역 변수 초기화 ---


// --- 카메라를 켜고 스트리밍을 시작하는 '핵심' 함수 ---
function startCameraStream() {
  // 이미 켜져 있다면, 또 켜지 않도록 방지
  if (cameraProcess) {
    return;
  }
  
  console.log('First client connected. Starting camera...');
  
  const camArgs = [
    '-t', '0', '--codec', 'mjpeg', '--inline',
    '--width', '640', '--height', '480', '--framerate', '20', '-o', '-'
  ];
  cameraProcess = spawn('rpicam-vid', camArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  // ... (카메라 프로세스 이벤트 핸들러는 이전과 동일)
  cameraProcess.stderr.on('data', (d) => console.error(`CAMERA STDERR: ${d.toString()}`));
  cameraProcess.on('exit', (c, s) => {
     if (s) {
        console.error(`rpicam-vid was killed by signal: ${s}`);
    } else if (c !== 0) {
        console.error(`rpicam-vid exited with error code: ${c}`);
    } else {
        console.log(`rpicam-vid exited successfully.`);
    }
    cameraProcess = null; // 상태를 정확히 업데이트
  });
  
  // --- 데이터 파싱 및 브로드캐스팅 로직 ---
  let buffer = Buffer.alloc(0); //빈 버퍼 설정
  const SOI = Buffer.from([0xff, 0xd8]);//JPEG 파일 규칙, 이미지 정보 탐지
  const EOI = Buffer.from([0xff, 0xd9]);

  cameraProcess.stdout.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const start = buffer.indexOf(SOI);//바이트 단위로 버퍼 잘라서 보내주는 로직, 아직 더 이해해야함.
      if (start === -1) break;
      const end = buffer.indexOf(EOI, start + 2);//찾을 패턴, 검색위치
      if (end === -1) break;
      const frame = buffer.slice(start, end + 2);
      buffer = buffer.slice(end + 2);//앞선 정보 잘라서 버퍼가 필요 이상으로 커지는 것 방지

      // 모든 클라이언트에게 프레임 전송
      for (const res of [...clients]) {
        try {
          res.write(`--myboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);//프레임 헤더, jpeg의 경계선, 헤더와 본문을 나누는 빈줄을 만들어줘야하는 통신규약 
          res.write(frame);//아까 자른 버퍼
          res.write('\r\n');//한 개의 프레임이 끝났다는 알림, 줄바꿔줘야 다시 헤더 시작 
        } catch {     //try에서 발생할 오류 상황 핸들(보낼 클라이언트가 떠날을 때 ) 
          clients.delete(res); ////보낼 클라이언트 없어졌을 때  그 res를 삭제 시켜라
        }
      }
    }
  });
}

// --- 카메라를 종료 로직(모두 없어졌을때, 좀비프로세스) ---
function checkAndStopCameraIfNeeded() {
  // 조건: 시청자가 아무도 없고, 카메라 프로세스가 살아있다면
  if (clients.size === 0 && cameraProcess) {
    console.log('💤 No clients left (or zombie detected). Stopping camera...');
    cameraProcess.kill('SIGKILL');
    // cameraProcess = null; // on('exit') 핸들러가 이 역할을 할 것이므로 여기서 제거해도 됨
  }
}


// --- 스트림 엔드포인트 수정 ---
app.get('/stream', (req, res) => {
  
    if (clients.size >= MAX_CLIENTS) {
    console.log(`🚫 Connection rejected. Maximum clients (${MAX_CLIENTS}) reached.`); //최대 시청자 제한을 위한 코드
    res.status(503).send('Sorry, the broadcast is full. Please try again later.'); // 503 Service Unavailable, 정보 전송
    return;
  }
  
  
  
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
    'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Pragma': 'no-cache' //캐시 제어, TCP 열어 놓기 
  });

  // 1. 새로운 클라이언트를 명단에 추가
  clients.add(res);
  console.log(`+ Client connected. Total clients: ${clients.size}`);

  // 2. 카메라 스트림 시작 (만약 꺼져있었다면 이 함수가 카메라를 켤 것임)
  startCameraStream();

  // 3. 클라이언트 연결이 끊겼을 때
  req.on('close', () => {
    clients.delete(res);
    console.log(`- Client disconnected. Total clients: ${clients.size}`);
    // 클라이언트가 나갈 때마다, '상태 점검'을 요청한다.
    checkAndStopCameraIfNeeded();
  });
});

// --- 서버 시작 ---
app.listen(port, () => {
  console.log(`📡 Kido's Universe is ON AIR at http://<YOUR_PI_IP>:${port}`);
   //헬스 체크 인터벌 
  setInterval(checkAndStopCameraIfNeeded, 10000); // 10초마다
});
