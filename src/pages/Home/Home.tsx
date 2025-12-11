import { useEffect, useState } from 'react';
import './Home.css';
import { useAuthContext } from '../../contexts/AuthContext';

interface Post {
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
	const { requestNewAccessToken, role, signOut, accessToken } = useAuthContext();
	const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'users'>('posts');
	const [posts, setPosts] = useState<Post[]>([]);
	const [comments, setComments] = useState<Comment[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    useEffect(() => {
        requestNewAccessToken();
    }, [])

	useEffect(() => {
		if (activeTab === 'posts') {
			fetchPosts();
		} else if (activeTab === 'comments') {
			fetchComments();
		} else if (activeTab === 'users') {
			fetchUsers();
		}
	}, [activeTab]);

	const fetchPosts = async () => {
		setLoading(true);
		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/moderator/posts?limit=50`, {
				headers: {
					authorization: `Bearer ${accessToken}`,
					'ngrok-skip-browser-warning': 'true',
				},
			});
			if (res.ok) {
				const data = await res.json();
				setPosts(data.posts || []);
			}
		} catch (error) {
			console.error('Failed to fetch posts:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchComments = async () => {
		setLoading(true);
		try {
			// Fetch comments from all posts - you may need a dedicated admin endpoint
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/moderator/comments?limit=50`, {
				headers: {
					authorization: `Bearer ${accessToken}`,
					'ngrok-skip-browser-warning': 'true',
				},
			});
			if (res.ok) {
				const data = await res.json();
				setComments(data.comments || []);
			}
		} catch (error) {
			console.error('Failed to fetch comments:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/moderator/users?limit=50`, {
				headers: {
					authorization: `Bearer ${accessToken}`,
					'ngrok-skip-browser-warning': 'true',
				},
			});
			if (res.ok) {
				const data = await res.json();
				setUsers(data.users || []);
			}
		} catch (error) {
			console.error('Failed to fetch users:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeletePost = async (postId: string) => {
		if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/moderator/posts/${postId}`, {
				method: 'DELETE',
				headers: {
					authorization: `Bearer ${accessToken}`,
					'ngrok-skip-browser-warning': 'true',
				},
			});
			if (res.ok) {
				alert('Đã xóa bài viết');
				fetchPosts();
			} else {
				alert('Không thể xóa bài viết');
			}
		} catch (error) {
			alert('Lỗi khi xóa bài viết');
		}
	};

	const handleDeleteComment = async (commentId: string) => {
		if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/moderator/comments/${commentId}`, {
				method: 'DELETE',
				headers: {
					authorization: `Bearer ${accessToken}`,
					'ngrok-skip-browser-warning': 'true',
				},
			});
			if (res.ok) {
				alert('Đã xóa bình luận');
				fetchComments();
			} else {
				alert('Không thể xóa bình luận');
			}
		} catch (error) {
			alert('Lỗi khi xóa bình luận');
		}
	};

	const handleWarnUser = async (userId: string, reason: string) => {
		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/moderator/users/${userId}/warn`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: `Bearer ${accessToken}`,
					'ngrok-skip-browser-warning': 'true',
				},
				body: JSON.stringify({ reason }),
			});
			if (res.ok) {
				alert('Đã cảnh cáo người dùng');
			} else {
				alert('Không thể cảnh cáo người dùng');
			}
		} catch (error) {
			alert('Lỗi khi cảnh cáo người dùng');
		}
	};

	const handleBanUser = async (userId: string, reason: string) => {
		if (!confirm('Bạn có chắc muốn khóa tài khoản này?')) return;

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/moderator/users/${userId}/ban`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: `Bearer ${accessToken}`,
					'ngrok-skip-browser-warning': 'true',
				},
				body: JSON.stringify({ reason }),
			});
			if (res.ok) {
				alert('Đã khóa tài khoản');
				fetchUsers();
			} else {
				alert('Không thể khóa tài khoản');
			}
		} catch (error) {
			alert('Lỗi khi khóa tài khoản');
		}
	};

	const handleUnbanUser = async (userId: string) => {
		if (!confirm('Bạn có chắc muốn mở khóa tài khoản này?')) return;

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/moderator/users/${userId}/unban`, {
				method: 'POST',
				headers: {
					authorization: `Bearer ${accessToken}`,
					'ngrok-skip-browser-warning': 'true',
				},
			});
			if (res.ok) {
				alert('Đã mở khóa tài khoản');
				fetchUsers();
			} else {
				alert('Không thể mở khóa tài khoản');
			}
		} catch (error) {
			alert('Lỗi khi mở khóa tài khoản');
		}
	};

	const handleViewPost = (post: Post) => {
		setSelectedPost(post);
	};

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
					<span className="role-badge">{role ? role.toUpperCase() : 'GUEST'}</span>
					<button className="ghost-button" onClick={signOut}>
						Đăng xuất
					</button>
				</div>
			</header>

			<section className="tabs-section">
				<div className="tabs">
					<button
						className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
						onClick={() => setActiveTab('posts')}
					>
						Bài viết
					</button>
					<button
						className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
						onClick={() => setActiveTab('comments')}
					>
						Bình luận
					</button>
					<button
						className={`tab ${activeTab === 'users' ? 'active' : ''}`}
						onClick={() => setActiveTab('users')}
					>
						Người dùng
					</button>
				</div>

				{loading ? (
					<div className="loading">Đang tải...</div>
				) : (
					<>
						{activeTab === 'posts' && (
							<div className="content-list">
								{posts.map((post) => (
									<div key={post.postId} className="content-item">
										{post.coverImgUrl && (
											<img src={post.coverImgUrl} alt={post.title} className="item-image" />
										)}
										<div className="item-content">
											<h3>{post.title}</h3>
											<p className="item-meta">
												Tác giả: {post.authorName || 'Unknown'} • {new Date(post.createdAt).toLocaleDateString('vi-VN')}
											</p>
											{post.description && <p className="item-desc">{post.description.slice(0, 150)}...</p>}
											<div className="item-actions">
												<button className="btn-view" onClick={() => handleViewPost(post)}>
													Xem chi tiết
												</button>
												<button className="btn-delete" onClick={() => handleDeletePost(post.postId)}>
													Xóa
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						{activeTab === 'comments' && (
							<div className="content-list">
								{comments.map((comment) => (
									<div key={comment.commentId} className="content-item">
										<div className="item-content">
											<p className="item-meta">
												{comment.displayName} • {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
											</p>
											<p className="comment-content">{comment.commentText}</p>
											<div className="item-actions">
												<button className="btn-delete" onClick={() => handleDeleteComment(comment.commentId)}>
													Xóa bình luận
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						{activeTab === 'users' && (
							<div className="content-list">
								{users.map((user) => (
									<div key={user.userId} className="content-item">
										<div className="item-content">
											<h3>{user.displayName || user.username || 'No name'}</h3>
											<p className="item-meta">{user.email}</p>
											<p className="user-status">
												Trạng thái: <span className={user.isActive ? 'status-active' : 'status-banned'}>{user.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
											</p>
											<div className="item-actions">
												<button
													className="btn-warn"
													onClick={() => {
														const reason = prompt('Nhập lý do cảnh cáo:');
														if (reason) handleWarnUser(user.userId, reason);
													}}
												>
													Cảnh cáo
												</button>
												{user.isActive ? (
													<button
														className="btn-ban"
														onClick={() => {
															const reason = prompt('Nhập lý do khóa tài khoản:');
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
							<img src={selectedPost.coverImgUrl} alt={selectedPost.title} className="modal-image" />
						)}
						<div className="modal-info">
							<p><strong>Tác giả:</strong> {selectedPost.authorName || 'Unknown'}</p>
							<p><strong>Thời gian nấu:</strong> {selectedPost.cookTime} phút</p>
							<p><strong>Khẩu phần:</strong> {selectedPost.servings} người</p>
							<p><strong>Độ khó:</strong> {selectedPost.difficulty}</p>
						</div>
						{selectedPost.description && (
							<div className="modal-description">
								<h3>Mô tả</h3>
								<p>{selectedPost.description}</p>
							</div>
						)}
						<div className="modal-actions">
							<button className="btn-delete" onClick={() => {
								handleDeletePost(selectedPost.postId);
								setSelectedPost(null);
							}}>
								Xóa bài viết
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
