import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import CanvasCommentOverlay from './CanvasCommentOverlay';
import type { Comment } from '../shared/types/index';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  streamUrl?: string;
  thumbnail?: string;
  comments: Comment[];
  isLive?: boolean;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  thumbnail,
  comments,
  isLive = false,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Wire up time/metadata handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime * 1000); // Convert to milliseconds
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate]);

  // HLS playback setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // If it's an HLS URL
    const isHls = streamUrl.endsWith('.m3u8');
    let hls: Hls | null = null;

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = streamUrl;
      }
    } else {
      // Non-HLS sources (e.g., MP4, etc.)
      video.src = streamUrl;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      data-testid="video-container"
    >
      {/* Video Element */}
      <div className="relative aspect-video">
        {streamUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full"
            src={streamUrl}
            poster={thumbnail}
            onClick={togglePlay}
            data-testid="video-element"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <p className="text-gray-400">No stream available</p>
          </div>
        )}

        {/* Comment Overlay - Using Canvas for better performance */}
        <CanvasCommentOverlay
          comments={comments}
          width={containerRef.current?.clientWidth || 1280}
          height={containerRef.current?.clientHeight || 720}
          isPaused={!isPlaying}
        />

        {/* Live Indicator */}
        {isLive && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
            LIVE
          </div>
        )}
      </div>

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="text-white hover:text-gray-300 transition"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {/* Time Display */}
          {!isLive && (
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          )}

          {/* Progress Bar */}
          {!isLive && (
            <div className="flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={currentTime}>
              <div className="relative h-1 bg-gray-600 rounded-full cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const clickedValue = (x / rect.width) * duration;
                const video = videoRef.current;
                if (video) {
                  video.currentTime = clickedValue;
                  setCurrentTime(clickedValue);
                }
              }}>
                <div className="absolute h-full bg-blue-600 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Volume Controls */}
          <button
            onClick={toggleMute}
            className="text-white hover:text-gray-300 transition"
            aria-label="Volume"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20"
            aria-label="Volume"
          />

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-gray-300 transition"
            aria-label="Fullscreen"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoPlayer);
