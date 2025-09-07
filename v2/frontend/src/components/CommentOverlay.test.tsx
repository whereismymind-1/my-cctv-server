import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommentOverlay from './CommentOverlay';
import { Comment } from '../shared/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, ...props }: any) => (
      <div style={style} {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CommentOverlay', () => {
  const mockComments: Comment[] = [
    {
      id: '1',
      text: 'First comment',
      userId: 'user1',
      username: 'User1',
      userLevel: 1,
      style: {
        position: 'scroll',
        color: '#FFFFFF',
        size: 'medium',
      },
      vpos: 1000,
      duration: 5000,
      createdAt: new Date().toISOString(),
      x: 0,
      y: 50,
      lane: 1,
      speed: 100,
    },
    {
      id: '2',
      text: 'Second comment',
      userId: 'user2',
      username: 'User2',
      userLevel: 2,
      style: {
        position: 'top',
        color: '#FF0000',
        size: 'big',
      },
      vpos: 2000,
      duration: 5000,
      createdAt: new Date().toISOString(),
      x: 0,
      y: 100,
      lane: 2,
      speed: 100,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders comment overlay container', () => {
    render(<CommentOverlay comments={[]} />);
    
    const container = screen.getByTestId('comment-overlay');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('absolute', 'inset-0', 'overflow-hidden', 'pointer-events-none');
  });

  it('displays comments when provided', () => {
    render(<CommentOverlay comments={mockComments} />);
    
    // Should display the latest comment immediately
    expect(screen.getByText('Second comment')).toBeInTheDocument();
  });

  it('applies correct styling based on comment style', () => {
    const comment: Comment = {
      id: '3',
      text: 'Styled comment',
      userId: 'user3',
      username: 'User3',
      userLevel: 1,
      style: {
        position: 'scroll',
        color: '#00FF00',
        size: 'big',
      },
      vpos: 3000,
      duration: 5000,
      createdAt: new Date().toISOString(),
      x: 0,
      y: 50,
      lane: 1,
      speed: 100,
    };

    render(<CommentOverlay comments={[comment]} />);
    
    const commentElement = screen.getByText('Styled comment');
    expect(commentElement).toHaveStyle({
      color: '#00FF00',
      fontSize: '1.5rem', // big size
    });
  });

  it('positions comments based on position style', () => {
    const topComment: Comment = {
      ...mockComments[0],
      id: 'top',
      text: 'Top comment',
      style: {
        position: 'top',
        color: '#FFFFFF',
        size: 'medium',
      },
    };

    render(<CommentOverlay comments={[topComment]} />);
    
    const comment = screen.getByText('Top comment');
    expect(comment).toBeInTheDocument();
  });

  it('removes comments after duration expires', () => {
    const shortDurationComment: Comment = {
      ...mockComments[0],
      text: 'Short duration',
      duration: 1000,
    };

    render(<CommentOverlay comments={[shortDurationComment]} />);
    
    // Comment should be visible initially
    expect(screen.getByText('Short duration')).toBeInTheDocument();

    // Fast-forward time past the duration
    vi.advanceTimersByTime(1100);

    // Comment should be removed
    waitFor(() => {
      expect(screen.queryByText('Short duration')).not.toBeInTheDocument();
    });
  });

  it('pauses animations when isPaused is true', () => {
    render(<CommentOverlay comments={mockComments} isPaused={true} />);
    
    const overlay = screen.getByTestId('comment-overlay');
    const commentElements = overlay.querySelectorAll('[style*="animation-play-state"]');
    
    commentElements.forEach(element => {
      expect(element).toHaveStyle({
        animationPlayState: 'paused',
      });
    });
  });

  it('handles empty comments array', () => {
    render(<CommentOverlay comments={[]} />);
    
    const overlay = screen.getByTestId('comment-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay.children).toHaveLength(0);
  });

  it('applies custom width and height', () => {
    render(<CommentOverlay comments={[]} width={1920} height={1080} />);
    
    const overlay = screen.getByTestId('comment-overlay');
    expect(overlay).toHaveStyle({
      width: '1920px',
      height: '1080px',
    });
  });

  it('handles multiple comments simultaneously', () => {
    const simultaneousComments: Comment[] = [
      {
        ...mockComments[0],
        id: 'sim1',
        text: 'Comment 1',
      },
      {
        ...mockComments[0],
        id: 'sim2',
        text: 'Comment 2',
      },
      {
        ...mockComments[0],
        id: 'sim3',
        text: 'Comment 3',
      },
    ];

    render(<CommentOverlay comments={simultaneousComments} />);
    
    // Should display the latest comment (last in array)
    expect(screen.getByText('Comment 3')).toBeInTheDocument();
  });

  it('applies correct font weight and shadow', () => {
    render(<CommentOverlay comments={mockComments} />);
    
    const comment = screen.getByText('Second comment');
    expect(comment).toHaveStyle({
      fontWeight: 'bold',
      textShadow: expect.stringContaining('rgba(0, 0, 0'),
    });
  });
});