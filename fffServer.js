/*
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache'
  });

  const cmd = 'rpicam-vid';
  const args = [
    '-t', '0',
    '--inline',
    '--nopreview',
    '--codec', 'h264',            // 권장: --codec 명시
    '--libav-format', 'h264',
    '-o', '-',
    '--width', '640',
    '--height', '480',
    '--framerate', '20'
  ];

  const cameraProcess = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  // ffmpeg stderr를 'pipe'로 받아 원인 파악 가능하도록
  const ffmpegProcess = spawn('ffmpeg', [
    '-fflags', 'nobuffer',
    '-thread_queue_size', '1024',
    '-f', 'h264',
    '-probesize', '32',
    '-analyzeduration', '0',
    '-i', 'pipe:0',
    '-f', 'mjpeg',
    '-q:v', '5',
    'pipe:1'
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  // 파이프 연결
  if (cameraProcess.stdout && ffmpegProcess.stdin) {
    cameraProcess.stdout.pipe(ffmpegProcess.stdin);
  } else {
    res.statusCode = 500;
    return res.end('Pipe setup failed');
  }

  // MJPEG 멀티파트 프레임 경계/헤더를 직접 작성
  ffmpegProcess.stdout.on('data', (chunk) => {
    if (res.destroyed || res.writableEnded) return;
    res.write(`--myboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`);
    res.write(chunk);
    res.write('\r\n');
  });

  // 종료/에러 처리
  const safeClose = () => {
    try { cameraProcess.kill('SIGKILL'); } catch {}
    try { ffmpegProcess.kill('SIGKILL'); } catch {}
    if (!res.writableEnded && !res.destroyed) {
      try { res.end(); } catch {}
    }
  };

  req.on('close', () => {
    console.log('Stream client disconnected.');
    safeClose();
  });

  cameraProcess.stderr?.on('data', d => console.error(`CAMERA STDERR: ${d.toString()}`));
  ffmpegProcess.stderr?.on('data', d => console.error(`FFMPEG STDERR: ${d.toString()}`));

  cameraProcess.on('exit', (c, s) => { console.error(`rpicam-vid exit code=${c} sig=${s}`); safeClose(); });
  ffmpegProcess.on('exit', (c, s) => { console.error(`ffmpeg exit code=${c} sig=${s}`); safeClose(); });
  cameraProcess.on('error', (e) => { console.error('rpicam-vid error:', e); safeClose(); });
  ffmpegProcess.on('error', (e) => { console.error('ffmpeg error:', e); safeClose(); });
});

app.listen(port, () => {
  console.log(`📡 Kido's Universe is ON AIR at http://<YOUR_PI_IP>:${port}`);
});*/
