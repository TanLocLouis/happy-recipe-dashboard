import { useEffect, useState, type FormEvent } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../lib/fetchWithAuth";
import { useAuthStore } from "@/stores/authStore";

interface Author {
  authorName?: string;
  displayName?: string;
  email?: string;
  isActive?: boolean;
  authorImgUrl?: string;
  role?: string;
  userId: string;
}

interface Post {
  author: Author;
  postId: string;
  title: string;
  coverImgUrl?: string;
  authorId: string;
  authorName?: string;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  description?: string;
  createdAt: string;
  isDeleted: boolean;
}

interface Comment {
  commentId: string;
  postId: string;
  userId: string;
  displayName: string;
  commentText: string;
  createdAt: string;
}

interface User {
  userId: string;
  username?: string;
  email: string;
  displayName?: string;
  isActive: boolean;
}

export default function Home() {
  // const { requestNewAccessToken, role, signOut, accessToken } = useAuthContext();
  const role = useAuthStore((state) => state.role);
  const accessToken = useAuthStore((state) => state.accessToken);
  const requestNewAccessToken = useAuthStore((state) => state.requestNewAccessToken);
  const signOut = useAuthStore((state) => state.signOut);

  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "users">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [postPage, setPostPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [postLimit, setPostLimit] = useState(10);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [customRangeStart, setCustomRangeStart] = useState("");
  const [customRangeEnd, setCustomRangeEnd] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [postStatusFilter, setPostStatusFilter] = useState<"all" | "active" | "deleted">("all");

  useEffect(() => {
    requestNewAccessToken();
  }, []);

  useEffect(() => {
    console.log(activeTab);
    if (activeTab === "posts") {
      fetchPosts();
    } else if (activeTab === "comments") {
      fetchComments();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchPosts = async (
    page = postPage,
    limit = postLimit,
    status: "all" | "active" | "deleted" = postStatusFilter
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (useCustomRange && customRangeStart && customRangeEnd) {
        params.append("start", customRangeStart);
        params.append("end", customRangeEnd);
      } else {
        params.append("page", page.toString());
        params.append("limit", limit.toString());
      }

      params.append("status", status);

      console.log(`${import.meta.env.VITE_API_URL}/api/moderator/posts?${params.toString()}`);

      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/posts?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        console.log(data.posts);
        setPosts(data.posts || []);
        if (!useCustomRange) {
          setPostPage(page + 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (page = commentsPage, search = commentSearch) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (search.trim()) {
        params.append("search", search.trim());
      }

      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/comments?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchComments = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCommentsPage(1);
    fetchComments(1, commentSearch);
  };

  const fetchUsers = async (
    page = usersPage,
    search = userSearch,
    status: "all" | "active" | "inactive" = userStatusFilter
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (search.trim()) {
        params.append("search", search.trim());
      }
      if (status !== "all") {
        params.append("isActive", status === "active" ? "true" : "false");
      }

      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/users?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUsersPage(1);
    fetchUsers(1, userSearch, userStatusFilter);
  };

  const handlePostStatusFilterChange = (status: "all" | "active" | "deleted") => {
    setPostStatusFilter(status);
    setPostPage(1);
    fetchPosts(1, postLimit, status);
  };

  const handleStatusFilterChange = (status: "all" | "active" | "inactive") => {
    setUserStatusFilter(status);
    setUsersPage(1);
    fetchUsers(1, userSearch, status);
  };

  const redirect = useNavigate();
  const handleRoleBadgeClick = () => {
    redirect("/profile");
  };

  const handleDeletePost = async (post: Post) => {
    if (post.isDeleted) {
      if (!confirm("Bạn có chắc muốn khôi phục bài viết này?")) return;

      try {
        const res = await fetchWithAuth(
          `${import.meta.env.VITE_API_URL}/api/moderator/posts/${post.postId}/restore`,
          { method: "PATCH" }
        );
        if (res.ok) {
          alert("Đã khôi phục bài viết");
          fetchPosts();
        } else {
          alert("Không thể khôi phục bài viết");
        }
      } catch (error) {
        alert("Lỗi khi khôi phục bài viết");
      }
    } else {
      if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;

      try {
        const res = await fetchWithAuth(
          `${import.meta.env.VITE_API_URL}/api/moderator/posts/${post.postId}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          alert("Đã xóa bài viết");
          fetchPosts();
        } else {
          alert("Không thể xóa bài viết");
        }
      } catch (error) {
        alert("Lỗi khi xóa bài viết");
      }
    }
  };

  const handleNotifyUser = async (post: Post) => {
    const message = prompt("Nhập nội dung thông báo cho tác giả:");
    if (!message) return;

    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/posts/${post.postId}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        }
      );

      if (res.ok) {
        alert("Đã gửi thông báo");
        console.log(accessToken);
        fetchPosts();
      } else {
        alert("Không thể gửi thông báo");
      }
    } catch (error) {
      alert("Lỗi khi gửi thông báo");
    }
  };

  const handleNotifyUserWarned = async (user: User) => {
    const message = prompt("Nhập nội dung thông báo cho người dùng:");
    if (!message) return;

    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/users/${user.userId}/notify-warned`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        }
      );

      if (res.ok) {
        alert("Đã gửi thông báo");
        console.log(accessToken);
        fetchUsers();
      } else {
        alert("Không thể gửi thông báo");
      }
    } catch (error) {
      alert("Lỗi khi gửi thông báo");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        alert("Đã xóa bình luận");
        fetchComments();
      } else {
        alert("Không thể xóa bình luận");
      }
    } catch (error) {
      alert("Lỗi khi xóa bình luận");
    }
  };

  const handleWarnUser = async (userId: string, reason: string) => {
    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/users/${userId}/warn`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );
      if (res.ok) {
        alert("Đã cảnh cáo người dùng");
      } else {
        alert("Không thể cảnh cáo người dùng");
      }
    } catch (error) {
      alert("Lỗi khi cảnh cáo người dùng");
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    if (!confirm("Bạn có chắc muốn khóa tài khoản này?")) return;

    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/users/${userId}/ban`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );
      if (res.ok) {
        alert("Đã khóa tài khoản");
        fetchUsers();
      } else {
        alert("Không thể khóa tài khoản");
      }
    } catch (error) {
      alert("Lỗi khi khóa tài khoản");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn mở khóa tài khoản này?")) return;

    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/moderator/users/${userId}/unban`,
        { method: "POST" }
      );
      if (res.ok) {
        alert("Đã mở khóa tài khoản");
        fetchUsers();
      } else {
        alert("Không thể mở khóa tài khoản");
      }
    } catch (error) {
      alert("Lỗi khi mở khóa tài khoản");
    }
  };

  const handleViewPost = (post: Post) => {
    // setSelectedPost(post);
    window.open(`${import.meta.env.VITE_FRONTEND_URL}/post/${post.postId}`, "_blank");
  };

  // const handleViewPostDetail = (post: Post) => {
  //   setSelectedPost(post);
  // };

  return (
    <div className="home-page">
      <header className="home-hero">
        <div>
          <p className="hero-kicker">Dashboard</p>
          <h1 className="hero-title">Happy Recipe Admin</h1>
          <p className="hero-subtitle">
            Quản lý công thức, nội dung và người dùng trong một nơi duy nhất.
          </p>
        </div>
        <div className="hero-actions">
          <span className="role-badge" onClick={() => handleRoleBadgeClick()}>
            {role ? role.toUpperCase() : "GUEST"}
          </span>
          <button className="ghost-button" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </header>

      <section className="tabs-section">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Bài viết
          </button>
          <button
            className={`tab ${activeTab === "comments" ? "active" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            Bình luận
          </button>
          <button
            className={`tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Người dùng
          </button>
        </div>

        {activeTab === "users" && (
          <div className="user-search-bar">
            <form className="user-search-form" onSubmit={handleSearchUsers}>
              <input
                className="user-search-input"
                type="text"
                placeholder="Tìm kiếm người dùng (email, tên, username)"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <button className="user-search-button" type="submit">
                Tìm kiếm
              </button>
            </form>
            <div className="user-filter-toggle">
              <button
                className={`filter-pill ${userStatusFilter === "all" ? "active" : ""}`}
                onClick={() => handleStatusFilterChange("all")}
              >
                Tất cả
              </button>
              <button
                className={`filter-pill ${userStatusFilter === "active" ? "active" : ""}`}
                onClick={() => handleStatusFilterChange("active")}
              >
                Hoạt động
              </button>
              <button
                className={`filter-pill ${userStatusFilter === "inactive" ? "active" : ""}`}
                onClick={() => handleStatusFilterChange("inactive")}
              >
                Đã khóa
              </button>
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="user-search-bar">
            <form className="user-search-form" onSubmit={handleSearchComments}>
              <input
                className="user-search-input"
                type="text"
                placeholder="Tìm kiếm bình luận (nội dung, người gửi)"
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
              />
              <button className="user-search-button" type="submit">
                Tìm kiếm
              </button>
            </form>
          </div>
        )}

        {activeTab === "posts" && (
          <div className="posts-filter-section">
            <div className="filter-group">
              <label>
                <input
                  type="radio"
                  name="postRange"
                  checked={!useCustomRange}
                  onChange={() => {
                    setUseCustomRange(false);
                    setPostPage(1);
                  }}
                />
                Chọn số lượng bài viết gần nhất
              </label>
              {!useCustomRange && (
                <div className="quick-select">
                  {[10, 20, 50, 100].map((num) => (
                    <button
                      key={num}
                      className={`limit-btn ${postLimit === num ? "active" : ""}`}
                      onClick={() => {
                        setPostLimit(num);
                        setPostPage(1);
                        fetchPosts(1, num, postStatusFilter);
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="filter-group">
              <label>
                <input
                  type="radio"
                  name="postRange"
                  checked={useCustomRange}
                  onChange={() => setUseCustomRange(true)}
                />
                Nhập khoảng bài viết cụ thể
              </label>
              {useCustomRange && (
                <div className="custom-range">
                  <input
                    type="number"
                    placeholder="Từ bài viết thứ"
                    value={customRangeStart}
                    onChange={(e) => setCustomRangeStart(e.target.value)}
                  />
                  <span>đến</span>
                  <input
                    type="number"
                    placeholder="Đến bài viết thứ"
                    value={customRangeEnd}
                    onChange={(e) => setCustomRangeEnd(e.target.value)}
                  />
                  <button
                    className="btn-fetch-range"
                    onClick={() => {
                      if (customRangeStart && customRangeEnd) {
                        fetchPosts();
                      }
                    }}
                  >
                    Tải bài viết
                  </button>
                </div>
              )}
            </div>

            <div className="filter-group">
              <span className="filter-label">Trạng thái bài viết</span>
              <div className="user-filter-toggle">
                <button
                  className={`filter-pill ${postStatusFilter === "all" ? "active" : ""}`}
                  onClick={() => handlePostStatusFilterChange("all")}
                >
                  Tất cả
                </button>
                <button
                  className={`filter-pill ${postStatusFilter === "active" ? "active" : ""}`}
                  onClick={() => handlePostStatusFilterChange("active")}
                >
                  Hoạt động
                </button>
                <button
                  className={`filter-pill ${postStatusFilter === "deleted" ? "active" : ""}`}
                  onClick={() => handlePostStatusFilterChange("deleted")}
                >
                  Đã xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <>
            {activeTab === "posts" && (
              <div className="content-list">
                {posts.map((post) => (
                  <div key={post.postId} className="content-item">
                    {post.coverImgUrl && (
                      <img src={post.coverImgUrl} alt={post.title} className="item-image" />
                    )}
                    <div className="item-content">
                      <div className="flex items-center gap-3 mb-1">
                        {post.author.authorImgUrl && (
                          <img
                            className="author-image rounded-2xl object-cover w-10 h-10"
                            src={post.author.authorImgUrl}
                            alt={post.author.authorName || "Author"}
                          />
                        )}
                        <p className="item-meta">
                          Tác giả: {post.author.authorName || "Unknown"} •{" "}
                          {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <h3>{post.title}</h3>
                      {post.description && (
                        <p className="item-desc">{post.description.slice(0, 150)}...</p>
                      )}
                      <div className="item-actions">
                        {/* <button className="btn-view" onClick={() => handleViewPostDetail(post)}>
													Xem thông tin cơ bản 
												</button> */}

                        <button className="btn-view" onClick={() => handleViewPost(post)}>
                          Mở bài viết gốc
                        </button>

                        <button className="btn-delete" onClick={() => handleDeletePost(post)}>
                          {post.isDeleted ? "Khôi phục bài viết đã xóa" : "Xóa bài viết"}
                        </button>

                        <button className="btn-notify" onClick={() => handleNotifyUser(post)}>
                          Gửi thông báo cho tác giả
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="content-list">
                {comments.map((comment) => (
                  <div key={comment.commentId} className="content-item">
                    <div className="item-content">
                      <p className="item-meta">
                        {comment.displayName} •{" "}
                        {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="comment-content">{comment.commentText}</p>
                      <div className="item-actions">
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteComment(comment.commentId)}
                        >
                          Xóa bình luận
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "users" && (
              <div className="content-list">
                {users.map((user) => (
                  <div key={user.userId} className="content-item">
                    <div className="item-content">
                      <h3>{user.displayName || user.username || "No name"}</h3>
                      <p className="item-meta">{user.email}</p>
                      <p className="user-status">
                        Trạng thái:{" "}
                        <span className={user.isActive ? "status-active" : "status-banned"}>
                          {user.isActive ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </p>
                      <div className="item-actions">
                        <button
                          className="btn-warn"
                          onClick={() => {
                            const reason = prompt("Nhập lý do cảnh cáo:");
                            if (reason) handleWarnUser(user.userId, reason);
                          }}
                        >
                          Cảnh cáo
                        </button>

                        {user.isActive ? (
                          <button
                            className="btn-ban"
                            onClick={() => {
                              const reason = prompt("Nhập lý do khóa tài khoản:");
                              if (reason) handleBanUser(user.userId, reason);
                            }}
                          >
                            Khóa tài khoản
                          </button>
                        ) : (
                          <button
                            className="btn-unban"
                            onClick={() => handleUnbanUser(user.userId)}
                          >
                            Mở khóa
                          </button>
                        )}

                        <button className="btn-notify" onClick={() => handleNotifyUserWarned(user)}>
                          Gửi thông báo qua email
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPost(null)}>
              ×
            </button>
            <h2>{selectedPost.title}</h2>
            {selectedPost.coverImgUrl && (
              <img
                src={selectedPost.coverImgUrl}
                alt={selectedPost.title}
                className="modal-image"
              />
            )}
            <div className="modal-info">
              <p>
                <strong>Tác giả:</strong> {selectedPost.authorName || "Unknown"}
              </p>
              <p>
                <strong>Thời gian nấu:</strong> {selectedPost.cookTime} phút
              </p>
              <p>
                <strong>Khẩu phần:</strong> {selectedPost.servings} người
              </p>
              <p>
                <strong>Độ khó:</strong> {selectedPost.difficulty}
              </p>
            </div>
            {selectedPost.description && (
              <div className="modal-description">
                <h3>Mô tả</h3>
                <p>{selectedPost.description}</p>
              </div>
            )}
            <div className="modal-actions">
              <button
                className="btn-delete"
                onClick={() => {
                  handleDeletePost(selectedPost);
                  setSelectedPost(null);
                }}
              >
                Xóa bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
