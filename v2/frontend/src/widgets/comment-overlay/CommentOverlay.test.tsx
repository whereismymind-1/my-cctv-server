import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommentOverlay from './CommentOverlay';
import { Comment } from '../shared/types/index';

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
    expect(container).toHaveStyle({
      position: 'absolute',
      width: '100%',
      height: '100%',
    });
  });

  it('displays comments when provided', async () => {
    render(<CommentOverlay comments={mockComments} />);
    
    // Should display the latest comment
    await waitFor(() => {
      expect(screen.getByText('Second comment')).toBeInTheDocument();
    });
  });

  it('applies correct styling based on comment style', async () => {
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
    };

    render(<CommentOverlay comments={[comment]} />);
    
    await waitFor(() => {
      const commentElement = screen.getByText('Styled comment');
      expect(commentElement).toHaveStyle({
        color: '#00FF00',
        fontSize: '1.5rem', // big size
      });
    });
  });

  it('positions comments based on position style', async () => {
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

    const bottomComment: Comment = {
      ...mockComments[0],
      id: 'bottom',
      text: 'Bottom comment',
      style: {
        position: 'bottom',
        color: '#FFFFFF',
        size: 'medium',
      },
    };

    const { rerender } = render(<CommentOverlay comments={[topComment]} />);
    
    await waitFor(() => {
      const comment = screen.getByText('Top comment');
      expect(comment.parentElement).toHaveStyle({
        top: expect.stringContaining('%'),
      });
    });

    rerender(<CommentOverlay comments={[bottomComment]} />);
    
    await waitFor(() => {
      const comment = screen.getByText('Bottom comment');
      expect(comment.parentElement).toHaveStyle({
        bottom: expect.stringContaining('%'),
      });
    });
  });

  it('removes comments after duration expires', async () => {
    const shortDurationComment: Comment = {
      ...mockComments[0],
      text: 'Short duration',
      duration: 1000,
    };

    render(<CommentOverlay comments={[shortDurationComment]} />);
    
    // Comment should be visible initially
    await waitFor(() => {
      expect(screen.getByText('Short duration')).toBeInTheDocument();
    });

    // Fast-forward time past the duration
    vi.advanceTimersByTime(1100);

    // Comment should be removed
    await waitFor(() => {
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
    expect(overlay.parentElement).toHaveStyle({
      width: '1920px',
      height: '1080px',
    });
  });

  it('handles multiple comments simultaneously', async () => {
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
    await waitFor(() => {
      expect(screen.getByText('Comment 3')).toBeInTheDocument();
    });
  });

  it('applies correct font weight and shadow', async () => {
    render(<CommentOverlay comments={mockComments} />);
    
    await waitFor(() => {
      const comment = screen.getByText('Second comment');
      expect(comment).toHaveStyle({
        fontWeight: 'bold',
        textShadow: expect.stringContaining('rgba(0, 0, 0'),
      });
    });
  });
});