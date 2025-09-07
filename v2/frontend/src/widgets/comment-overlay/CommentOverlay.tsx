import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '../shared/types';

interface CommentOverlayProps {
  comments: Comment[];
  width?: number;
  height?: number;
  isPaused?: boolean;
}

interface AnimatedComment extends Comment {
  key: string;
}

const CommentOverlay: React.FC<CommentOverlayProps> = ({
  comments,
  width = 1280,
  height = 720,
  isPaused = false,
}) => {
  const [animatedComments, setAnimatedComments] = useState<AnimatedComment[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add new comments to animation queue
    const newComments = comments.slice(-1); // Get latest comment
    if (newComments.length > 0) {
      const comment = newComments[0];
      const animatedComment: AnimatedComment = {
        ...comment,
        key: `${comment.id}-${Date.now()}`,
      };
      
      setAnimatedComments((prev) => [...prev, animatedComment]);
      
      // Remove comment after animation completes
      setTimeout(() => {
        setAnimatedComments((prev) => 
          prev.filter((c) => c.key !== animatedComment.key)
        );
      }, comment.duration);
    }
  }, [comments]);

  const getCommentStyle = (comment: Comment) => {
    const sizeMap = {
      small: '0.875rem',
      medium: '1.125rem',
      big: '1.5rem',
    };

    return {
      fontSize: sizeMap[comment.style.size],
      color: comment.style.color,
      fontWeight: comment.style.size === 'big' ? 'bold' : 'normal',
      textShadow: `
        1px 1px 2px rgba(0, 0, 0, 0.8),
        -1px -1px 2px rgba(0, 0, 0, 0.8),
        1px -1px 2px rgba(0, 0, 0, 0.8),
        -1px 1px 2px rgba(0, 0, 0, 0.8)
      `,
    };
  };

  const getAnimationVariants = (comment: Comment) => {
    if (comment.style.position === 'scroll') {
      return {
        initial: { x: width, y: comment.y },
        animate: { x: -200, y: comment.y },
        exit: { opacity: 0 },
      };
    } else if (comment.style.position === 'top') {
      return {
        initial: { x: width / 2, y: comment.y, opacity: 0 },
        animate: { x: width / 2, y: comment.y, opacity: 1 },
        exit: { opacity: 0 },
      };
    } else {
      // bottom
      return {
        initial: { x: width / 2, y: height - 50 - comment.y, opacity: 0 },
        animate: { x: width / 2, y: height - 50 - comment.y, opacity: 1 },
        exit: { opacity: 0 },
      };
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ width, height }}
      data-testid="comment-overlay"
    >
      <AnimatePresence>
        {animatedComments.map((comment) => (
          <motion.div
            key={comment.key}
            className="absolute whitespace-nowrap"
            style={getCommentStyle(comment)}
            variants={getAnimationVariants(comment)}
            initial="initial"
            animate={isPaused ? "initial" : "animate"}
            exit="exit"
            transition={{
              duration: comment.duration / 1000,
              ease: 'linear',
            }}
          >
            {comment.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CommentOverlay;