import { create } from 'zustand';
import { Stream, Comment } from '../shared/types';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';

interface StreamState {
  // Stream data
  streams: Stream[];
  currentStream: Stream | null;
  isLoadingStreams: boolean;
  isLoadingStream: boolean;
  error: string | null;
  
  // Comments
  comments: Comment[];
  isConnected: boolean;
  viewerCount: number;
  
  // Actions
  fetchStreams: (params?: any) => Promise<void>;
  fetchStream: (id: string) => Promise<void>;
  createStream: (data: any) => Promise<Stream>;
  startStream: (id: string) => Promise<void>;
  endStream: (id: string) => Promise<void>;
  deleteStream: (id: string) => Promise<void>;
  
  // WebSocket actions
  connectToStream: (streamId: string, token?: string) => void;
  disconnectFromStream: () => void;
  sendComment: (text: string, command?: string) => void;
  addComment: (comment: Comment) => void;
  updateViewerCount: (count: number) => void;
  
  clearError: () => void;
  reset: () => void;
}

export const useStreamStore = create<StreamState>((set, get) => ({
  streams: [],
  currentStream: null,
  isLoadingStreams: false,
  isLoadingStream: false,
  error: null,
  comments: [],
  isConnected: false,
  viewerCount: 0,

  fetchStreams: async (params) => {
    set({ isLoadingStreams: true, error: null });
    try {
      const response = await apiService.getStreams(params);
      set({ streams: response.streams, isLoadingStreams: false });
    } catch (error: any) {
      set({
        isLoadingStreams: false,
        error: error.response?.data?.message || 'Failed to fetch streams',
      });
    }
  },

  fetchStream: async (id: string) => {
    set({ isLoadingStream: true, error: null });
    try {
      const stream = await apiService.getStream(id);
      set({ currentStream: stream, isLoadingStream: false });
    } catch (error: any) {
      set({
        isLoadingStream: false,
        error: error.response?.data?.message || 'Failed to fetch stream',
      });
    }
  },

  createStream: async (data) => {
    try {
      const stream = await apiService.createStream(data);
      set((state) => ({ streams: [stream, ...state.streams] }));
      return stream;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create stream' });
      throw error;
    }
  },

  startStream: async (id: string) => {
    try {
      await apiService.startStream(id);
      set((state) => ({
        currentStream: state.currentStream
          ? { ...state.currentStream, status: 'live' }
          : null,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to start stream' });
      throw error;
    }
  },

  endStream: async (id: string) => {
    try {
      await apiService.endStream(id);
      set((state) => ({
        currentStream: state.currentStream
          ? { ...state.currentStream, status: 'ended' }
          : null,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to end stream' });
      throw error;
    }
  },

  deleteStream: async (id: string) => {
    try {
      await apiService.deleteStream(id);
      set((state) => ({
        streams: state.streams.filter((s) => s.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete stream' });
      throw error;
    }
  },

  connectToStream: (streamId: string, token?: string) => {
    // Connect WebSocket
    wsService.connect(token);
    
    // Set up callbacks
    wsService.setCallbacks({
      onConnect: () => {
        set({ isConnected: true });
        wsService.joinRoom(streamId);
      },
      onDisconnect: () => {
        set({ isConnected: false, comments: [] });
      },
      onRoomJoined: (data) => {
        set({ viewerCount: data.viewerCount });
      },
      onNewComment: (comment) => {
        get().addComment(comment);
      },
      onViewerCount: (data) => {
        set({ viewerCount: data.count });
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        set({ error: error.message });
      },
    });
  },

  disconnectFromStream: () => {
    const currentStreamId = wsService.getCurrentStreamId();
    if (currentStreamId) {
      wsService.leaveRoom(currentStreamId);
    }
    wsService.disconnect();
    set({ isConnected: false, comments: [], viewerCount: 0 });
  },

  sendComment: (text: string, command?: string) => {
    const currentStreamId = wsService.getCurrentStreamId();
    if (currentStreamId) {
      wsService.sendComment(currentStreamId, text, command);
    }
  },

  addComment: (comment: Comment) => {
    set((state) => {
      // Keep only last 100 comments to prevent memory issues
      const newComments = [...state.comments, comment];
      if (newComments.length > 100) {
        newComments.shift();
      }
      return { comments: newComments };
    });
  },

  updateViewerCount: (count: number) => {
    set({ viewerCount: count });
  },

  clearError: () => set({ error: null }),

  reset: () => {
    get().disconnectFromStream();
    set({
      streams: [],
      currentStream: null,
      comments: [],
      isConnected: false,
      viewerCount: 0,
      error: null,
    });
  },
}));