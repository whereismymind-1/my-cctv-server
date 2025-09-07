import React, { useEffect, useRef, useCallback } from 'react';
import { Comment } from '../shared/types';

interface CanvasComment {
  id: string;
  text: string;
  x: number;
  y: number;
  speed: number;
  color: string;
  fontSize: number;
  opacity: number;
  position: 'scroll' | 'top' | 'bottom';
  createdAt: number;
  duration: number;
}

interface CanvasCommentOverlayProps {
  comments: Comment[];
  width?: number;
  height?: number;
  isPaused?: boolean;
}

const CanvasCommentOverlay: React.FC<CanvasCommentOverlayProps> = ({
  comments,
  width = 1280,
  height = 720,
  isPaused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const canvasCommentsRef = useRef<CanvasComment[]>([]);
  const lastTimeRef = useRef<number>(0);
  const processedCommentsRef = useRef<Set<string>>(new Set());

  // Convert Comment to CanvasComment
  const convertToCanvasComment = useCallback((comment: Comment): CanvasComment => {
    const sizeMap = {
      small: 14,
      medium: 18,
      big: 24,
    };

    return {
      id: comment.id,
      text: comment.text,
      x: comment.style.position === 'scroll' ? width : width / 2,
      y: comment.y || Math.random() * (height - 50) + 25,
      speed: comment.speed || 200,
      color: comment.style.color,
      fontSize: sizeMap[comment.style.size],
      opacity: 1,
      position: comment.style.position,
      createdAt: Date.now(),
      duration: comment.duration,
    };
  }, [width, height]);

  // Add new comments to canvas
  useEffect(() => {
    comments.forEach(comment => {
      if (!processedCommentsRef.current.has(comment.id)) {
        const canvasComment = convertToCanvasComment(comment);
        canvasCommentsRef.current.push(canvasComment);
        processedCommentsRef.current.add(comment.id);
        
        // Remove comment ID from processed set after duration
        setTimeout(() => {
          processedCommentsRef.current.delete(comment.id);
        }, comment.duration + 1000);
      }
    });
  }, [comments, convertToCanvasComment]);

  // Main animation loop
  const animate = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate delta time
    const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = currentTime;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Update and draw comments
    canvasCommentsRef.current = canvasCommentsRef.current.filter(comment => {
      const age = currentTime - comment.createdAt;
      
      // Remove expired comments
      if (age > comment.duration) {
        return false;
      }

      // Update position for scrolling comments
      if (comment.position === 'scroll' && !isPaused) {
        comment.x -= comment.speed * deltaTime;
      }

      // Update opacity for fixed comments
      if (comment.position !== 'scroll') {
        const fadeInDuration = 300;
        const fadeOutDuration = 300;
        
        if (age < fadeInDuration) {
          comment.opacity = age / fadeInDuration;
        } else if (age > comment.duration - fadeOutDuration) {
          comment.opacity = (comment.duration - age) / fadeOutDuration;
        } else {
          comment.opacity = 1;
        }
      }

      // Set text properties
      ctx.font = `${comment.fontSize}px "Hiragino Sans", "Meiryo", sans-serif`;
      ctx.fillStyle = comment.color;
      ctx.globalAlpha = comment.opacity;
      
      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Draw text
      if (comment.position === 'scroll') {
        ctx.fillText(comment.text, comment.x, comment.y);
      } else {
        // Center text for fixed positions
        const textWidth = ctx.measureText(comment.text).width;
        const x = (width - textWidth) / 2;
        const y = comment.position === 'top' ? 50 : height - 50;
        ctx.fillText(comment.text, x, y);
      }

      // Reset shadow and alpha
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = 1;

      // Keep comment if still visible
      return comment.position !== 'scroll' || comment.x > -200;
    });

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [width, height, isPaused]);

  // Start animation loop
  useEffect(() => {
    if (!isPaused) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate, isPaused]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution
    canvas.width = width;
    canvas.height = height;

    // Apply CSS size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: '100%', 
        height: '100%',
        imageRendering: 'crisp-edges'
      }}
    />
  );
};

export default CanvasCommentOverlay;