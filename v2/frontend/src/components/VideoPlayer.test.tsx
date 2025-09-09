import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoPlayer from './VideoPlayer';
import { Comment } from '../shared/types';

// Mock Hls.js
vi.mock('hls.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    loadSource: vi.fn(),
    attachMedia: vi.fn(),
    destroy: vi.fn(),
  })),
  isSupported: vi.fn(() => true),
}));

describe('VideoPlayer', () => {
  const mockComments: Comment[] = [
    {
      id: '1',
      text: 'Test comment 1',
      command: 'ue red',
      user: {
        id: 'user1',
        username: 'testuser1',
        level: 1,
      },
      style: {
        position: 'top',
        color: '#ff0000',
        size: 'medium',
      },
      lane: 0,
      x: 0,
      y: 30,
      speed: 100,
      duration: 5000,
      vpos: 1000,
      createdAt: new Date(),
    },
    {
      id: '2',
      text: 'Test comment 2',
      command: '',
      user: {
        id: 'user2',
        username: 'testuser2',
        level: 2,
      },
      style: {
        position: 'scroll',
        color: '#ffffff',
        size: 'medium',
      },
      lane: 1,
      x: 800,
      y: 60,
      speed: 200,
      duration: 4000,
      vpos: 2000,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video player with controls', () => {
    render(
      <VideoPlayer
        streamUrl="http://example.com/stream.m3u8"
        comments={[]}
      />
    );

    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
  });

  it('toggles play/pause state', async () => {
    render(
      <VideoPlayer
        streamUrl="http://example.com/stream.m3u8"
        comments={[]}
      />
    );

    const playButton = screen.getByRole('button', { name: /play/i });
    
    // Mock video element
    const video = document.querySelector('video');
    if (video) {
      video.play = vi.fn().mockResolvedValue(undefined);
      video.pause = vi.fn();
    }

    fireEvent.click(playButton);
    await waitFor(() => {
      expect(video?.play).toHaveBeenCalled();
    });

    fireEvent.click(playButton);
    expect(video?.pause).toHaveBeenCalled();
  });

  it('handles volume change', () => {
    render(
      <VideoPlayer
        streamUrl="http://example.com/stream.m3u8"
        comments={[]}
      />
    );

    const volumeSlider = screen.getByRole('slider', { name: /volume/i });
    const video = document.querySelector('video');

    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    
    expect(video?.volume).toBe(0.5);
  });

  it('toggles mute state', () => {
    render(
      <VideoPlayer
        streamUrl="http://example.com/stream.m3u8"
        comments={[]}
      />
    );

    const muteButton = screen.getByRole('button', { name: /mute/i });
    const video = document.querySelector('video');

    fireEvent.click(muteButton);
    expect(video?.muted).toBe(true);

    fireEvent.click(muteButton);
    expect(video?.muted).toBe(false);
  });

  it('renders comment overlay with comments', () => {
    render(
      <VideoPlayer
        streamUrl="http://example.com/stream.m3u8"
        comments={mockComments}
      />
    );

    // Check if CanvasCommentOverlay is rendered (canvas element)
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles HLS stream URL', () => {
    const hlsUrl = 'http://example.com/stream.m3u8';
    
    render(
      <VideoPlayer
        streamUrl={hlsUrl}
        comments={[]}
      />
    );

    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    
    // Since we mocked Hls.js, we can check if it was called
    const Hls = require('hls.js').default;
    expect(Hls).toHaveBeenCalled();
  });

  it('handles non-HLS stream URL', () => {
    const mp4Url = 'http://example.com/video.mp4';
    
    render(
      <VideoPlayer
        streamUrl={mp4Url}
        comments={[]}
      />
    );

    const video = document.querySelector('video');
    expect(video?.src).toBe(mp4Url);
  });

  it('updates progress bar on time update', () => {
    render(
      <VideoPlayer
        streamUrl="http://example.com/stream.m3u8"
        comments={[]}
      />
    );

    const video = document.querySelector('video');
    const progressBar = screen.getByRole('progressbar');

    if (video) {
      Object.defineProperty(video, 'currentTime', { value: 30, writable: true });
      Object.defineProperty(video, 'duration', { value: 100, writable: true });
      
      const event = new Event('timeupdate');
      video.dispatchEvent(event);
    }

    expect(progressBar.getAttribute('aria-valuenow')).toBe('30');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('handles fullscreen toggle', () => {
    render(
      <VideoPlayer
        streamUrl="http://example.com/stream.m3u8"
        comments={[]}
      />
    );

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    const playerContainer = document.querySelector('.video-player-container');

    // Mock fullscreen API
    if (playerContainer) {
      playerContainer.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    }

    fireEvent.click(fullscreenButton);
    expect(playerContainer?.requestFullscreen).toHaveBeenCalled();
  });

  it('displays loading state when no stream URL', () => {
    render(
      <VideoPlayer
        streamUrl=""
        comments={[]}
      />
    );

    expect(screen.getByText(/no stream available/i)).toBeInTheDocument();
  });
});