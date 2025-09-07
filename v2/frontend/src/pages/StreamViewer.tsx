import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Users, Heart, MessageCircle } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import { useStreamStore } from '../stores/streamStore';
import { useAuthStore } from '../stores/authStore';

const StreamViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [commentText, setCommentText] = useState('');
  const [commentCommand, setCommentCommand] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const {
    currentStream,
    comments,
    viewerCount,
    isConnected,
    fetchStream,
    connectToStream,
    disconnectFromStream,
    sendComment,
  } = useStreamStore();

  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (id) {
      fetchStream(id);
      connectToStream(id, token || undefined);
    }

    return () => {
      disconnectFromStream();
    };
  }, [id, token]);

  useEffect(() => {
    // Auto-scroll chat to bottom
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    sendComment(commentText, commentCommand || undefined);
    setCommentText('');
    setCommentCommand('');
  };

  const handleCommandSelect = (command: string) => {
    setCommentCommand(command);
    setShowCommands(false);
  };

  const commandPresets = [
    { label: 'Top Red', value: 'ue red' },
    { label: 'Top Blue', value: 'ue blue' },
    { label: 'Bottom Green', value: 'shita green' },
    { label: 'Big Yellow', value: 'yellow big' },
    { label: 'Small White', value: 'white small' },
  ];

  if (!currentStream) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <VideoPlayer
              streamUrl={currentStream.streamUrl}
              thumbnail={currentStream.thumbnail}
              comments={comments}
              isLive={currentStream.status === 'live'}
            />

            {/* Stream Info */}
            <div className="bg-white rounded-lg p-6 mt-4">
              <h1 className="text-2xl font-bold mb-2">{currentStream.title}</h1>
              <p className="text-gray-600 mb-4">{currentStream.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentStream.owner.avatar || '/default-avatar.png'}
                      alt={currentStream.owner.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="font-semibold">{currentStream.owner.username}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={20} />
                    <span>{viewerCount} viewers</span>
                  </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                  <Heart size={20} />
                  <span>Like</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-white rounded-lg flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageCircle size={20} />
                  Live Chat
                </h2>
                <span className={`px-2 py-1 rounded text-sm ${
                  isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto p-4 space-y-2"
            >
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <span className="font-semibold text-sm">
                    {comment.user.username}:
                  </span>
                  <span className="text-sm break-words flex-1">
                    {comment.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            {isAuthenticated ? (
              <form onSubmit={handleSendComment} className="p-4 border-t">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setShowCommands(!showCommands)}
                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 transition"
                  >
                    {commentCommand || 'Style'}
                  </button>
                  {showCommands && (
                    <div className="absolute bottom-20 bg-white border rounded-lg shadow-lg p-2">
                      {commandPresets.map((cmd) => (
                        <button
                          key={cmd.value}
                          type="button"
                          onClick={() => handleCommandSelect(cmd.value)}
                          className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded"
                        >
                          {cmd.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !commentText.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t text-center text-gray-500">
                <p>Please login to chat</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamViewer;