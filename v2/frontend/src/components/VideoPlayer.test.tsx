import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VideoPlayer from './VideoPlayer';
import { Comment } from '../shared/types';

// Mock the CanvasCommentOverlay component
vi.mock('./CanvasCommentOverlay', () => ({
  default: vi.fn(() => <div data-testid="canvas-overlay">Canvas Overlay</div>),
}));

describe('VideoPlayer', () => {
  const mockComments: Comment[] = [
    {
      id: '1',
      text: 'Test comment',
      userId: 'user1',
      username: 'TestUser',
      userLevel: 1,
      style: {
        position: 'scroll',
        color: '#FFFFFF',
        size: 'medium'
      },
      vpos: 1000,
      createdAt: new Date().toISOString(),
    },
  ];

  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    // Mock HTMLVideoElement methods
    mockVideoElement = document.createElement('video');
    Object.defineProperty(mockVideoElement, 'play', {
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(mockVideoElement, 'pause', {
      value: vi.fn(),
    });
    Object.defineProperty(mockVideoElement, 'requestFullscreen', {
      value: vi.fn().mockResolvedValue(undefined),
    });
    
    // Mock document fullscreen methods
    Object.defineProperty(document, 'exitFullscreen', {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders video player with controls', () => {
    render(<VideoPlayer comments={mockComments} />);
    
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    expect(screen.getByTestId('canvas-overlay')).toBeInTheDocument();
  });

  it('renders with thumbnail when provided', () => {
    const thumbnailUrl = 'https://example.com/thumbnail.jpg';
    render(<VideoPlayer comments={mockComments} thumbnail={thumbnailUrl} />);
    
    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    expect(video.poster).toBe(thumbnailUrl);
  });

  it('renders with stream URL when provided', () => {
    const streamUrl = 'https://example.com/stream.m3u8';
    render(<VideoPlayer comments={mockComments} streamUrl={streamUrl} />);
    
    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    expect(video.src).toBe(streamUrl);
  });

  it('toggles play/pause when button is clicked', async () => {
    render(<VideoPlayer comments={mockComments} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    
    // Click play
    fireEvent.click(playButton);
    await waitFor(() => {
      expect(video.play).toHaveBeenCalled();
    });
    
    // Should now show pause button
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    expect(pauseButton).toBeInTheDocument();
    
    // Click pause
    fireEvent.click(pauseButton);
    expect(video.pause).toHaveBeenCalled();
  });

  it('toggles mute when volume button is clicked', () => {
    render(<VideoPlayer comments={mockComments} />);
    
    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    const volumeButton = screen.getByRole('button', { name: /volume/i });
    
    // Initially not muted
    expect(video.muted).toBe(false);
    
    // Click to mute
    fireEvent.click(volumeButton);
    expect(video.muted).toBe(true);
    
    // Click to unmute
    fireEvent.click(volumeButton);
    expect(video.muted).toBe(false);
  });

  it('changes volume when slider is moved', () => {
    render(<VideoPlayer comments={mockComments} />);
    
    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    const volumeSlider = screen.getByRole('slider', { name: /volume/i });
    
    // Change volume to 0.5
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    expect(video.volume).toBe(0.5);
    
    // Change volume to 0
    fireEvent.change(volumeSlider, { target: { value: '0' } });
    expect(video.volume).toBe(0);
    expect(video.muted).toBe(true);
  });

  it('toggles fullscreen when button is clicked', async () => {
    render(<VideoPlayer comments={mockComments} />);
    
    const container = screen.getByTestId('video-container');
    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    
    // Enter fullscreen
    fireEvent.click(fullscreenButton);
    await waitFor(() => {
      expect(container.requestFullscreen).toHaveBeenCalled();
    });
  });

  it('calls onTimeUpdate callback when video time updates', () => {
    const onTimeUpdate = vi.fn();
    render(
      <VideoPlayer comments={mockComments} onTimeUpdate={onTimeUpdate} />
    );
    
    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    
    // Simulate time update with mock current time
    (video as any).currentTime = 5;
    
    fireEvent.timeUpdate(video);
    
    expect(onTimeUpdate).toHaveBeenCalledWith(5000); // Converts to milliseconds
  });

  it('shows live indicator when isLive is true', () => {
    render(<VideoPlayer comments={mockComments} isLive={true} />);
    
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toHaveClass('bg-red-600');
  });

  it('shows current time and duration for non-live videos', () => {
    render(<VideoPlayer comments={mockComments} isLive={false} />);
    
    // Should show time display
    expect(screen.getByText(/0:00 \/ 0:00/)).toBeInTheDocument();
  });

  it('updates progress bar as video plays', () => {
    render(<VideoPlayer comments={mockComments} />);
    
    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    const progressBar = screen.getByRole('progressbar');
    
    // Set video duration and current time using property assignment
    (video as any).duration = 100;
    (video as any).currentTime = 25;
    
    // Trigger time update
    fireEvent.loadedMetadata(video);
    fireEvent.timeUpdate(video);
    
    // Progress should be 25%
    const progressFill = progressBar.querySelector('.bg-blue-600');
    expect(progressFill).toHaveStyle({ width: '25%' });
  });

  it('seeks to position when progress bar is clicked', () => {
    render(<VideoPlayer comments={mockComments} />);
    
    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    const progressBar = screen.getByRole('progressbar');
    
    // Set video duration
    (video as any).duration = 100;
    fireEvent.loadedMetadata(video);
    
    // Find the clickable div inside progressbar
    const clickableBar = progressBar.querySelector('.relative.h-1.bg-gray-600');
    if (clickableBar) {
      // Mock getBoundingClientRect
      (clickableBar as any).getBoundingClientRect = vi.fn(() => ({
        left: 0,
        width: 400,
        top: 0,
        right: 400,
        bottom: 20,
        height: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));
      
      // Click at 50% position
      fireEvent.click(clickableBar, { clientX: 200 });
      
      // Should seek to 50% of duration
      expect(video.currentTime).toBe(50);
    }
  });
});