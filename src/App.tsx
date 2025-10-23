import { useState, useEffect, useOptimistic } from "react";
import "./App.css";
import cubeIcon from "./assets/cube.svg";

interface CommentData {
  id: number;
  content: string;
  position_x: number;
  position_y: number;
  username: string;
  created_at: string;
}

function App() {
  const [comments, setComments] = useState<CommentData[]>([]);

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: CommentData) => [newComment, ...state]
  );

  const [currentUser, setCurrentUser] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/user");
        const data = await response.json();
        setCurrentUser(data.username);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/comments");
      const data = await response.json();
      setComments(data.comments);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setError("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }

  function handlePageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;

    const x = e.clientX;
    const y = e.clientY;

    setModalPosition({ x, y });
    setIsModalOpen(true);
  }

  async function handleSubmitComment() {
    if (!commentText.trim()) return;

    const optimisticComment: CommentData = {
      id: Date.now(),
      content: commentText,
      position_x: modalPosition.x,
      position_y: modalPosition.y,
      username: currentUser || "Anonymous",
      created_at: new Date().toISOString(),
    };

    const contentToSubmit = commentText;
    setCommentText("");
    setIsModalOpen(false);

    addOptimisticComment(optimisticComment);

    try {
      setIsLoading(true);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: contentToSubmit,
          position_x: modalPosition.x,
          position_y: modalPosition.y,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create comment");
      }

      const serverComment = await response.json();
      setComments((prev) => [serverComment, ...prev]);
      setError(null);
    } catch (err) {
      console.error("Failed to create comment:", err);
      setError("Failed to create comment");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-container" onClick={handlePageClick}>
      <img src={cubeIcon} alt="Cube" className="cube-icon" />

      <header className="app-header">
        <h1>Click to Comment</h1>
        {currentUser && (
          <p className="user-info">
            You are: <strong>{currentUser}</strong>
          </p>
        )}
        <p className="instructions">Click anywhere to leave a comment</p>
      </header>

      {optimisticComments.map((comment) => (
        <div
          key={comment.id}
          className="comment-marker"
          style={{
            left: `${comment.position_x}px`,
            top: `${comment.position_y}px`,
          }}
          title={`${comment.username}: ${comment.content}`}
        >
          {comment.id}
        </div>
      ))}

      <aside className="comments-panel">
        <h2>Comments ({optimisticComments.length})</h2>

        {error && <div className="error-message">{error}</div>}

        {isLoading && <div className="loading">Loading...</div>}

        <div className="comments-list">
          {optimisticComments.length === 0 && !isLoading && (
            <p className="empty-state">
              No comments yet. Click anywhere to add one!
            </p>
          )}

          {optimisticComments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-username">{comment.username}</span>
                <span className="comment-position">
                  @({comment.position_x}, {comment.position_y})
                </span>
              </div>
              <div className="comment-content">{comment.content}</div>
              <div className="comment-time">
                {new Date(comment.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
            }}
          >
            <h3>Add Comment</h3>
            <textarea
              className="comment-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="What's on your mind?"
              autoFocus
              rows={4}
            />
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-submit"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isLoading}
              >
                {isLoading ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
