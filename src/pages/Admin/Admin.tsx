import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import "../Home/Home.css";
import "./Admin.css";

interface Moderator {
	userId: string;
	email: string;
	displayName?: string;
	username?: string;
	isActive?: boolean;
	createdAt?: string;
}

interface PeriodStats {
	day: number;
	week: number;
	month: number;
	year: number;
}

interface AdminStats {
	posts: PeriodStats;
	comments: PeriodStats;
	newAccounts: PeriodStats;
}

const roadmapItems = [
	{
		title: "Quản lý phân quyền",
		detail: "Thiết lập vai trò phụ, phân chia quyền chi tiết cho editor / reviewer.",
	},
	{
		title: "Nhật ký hoạt động",
		detail: "Theo dõi lịch sử hành động của admin và moderator theo thời gian thực.",
	},
	{
		title: "Báo cáo vi phạm",
		detail: "Tổng hợp các báo cáo nội dung, hỗ trợ duyệt hàng loạt và gán xử lý.",
	},
];

export default function Admin() {
	const role = useAuthStore((state) => state.role);
	const requestNewAccessToken = useAuthStore((state) => state.requestNewAccessToken);
	const signOut = useAuthStore((state) => state.signOut);
	const navigate = useNavigate();

	const [moderators, setModerators] = useState<Moderator[]>([]);
	const [loadingMods, setLoadingMods] = useState(false);
	const [creating, setCreating] = useState(false);
	const [newEmail, setNewEmail] = useState("");
	const [error, setError] = useState("");
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(false);
	const [statsError, setStatsError] = useState("");

	const sortedModerators = useMemo(
		() =>
			[...moderators].sort((a, b) => {
				if (!a.createdAt || !b.createdAt) return 0;
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			}),
		[moderators]
	);

	useEffect(() => {
		requestNewAccessToken();
	}, [requestNewAccessToken]);

	useEffect(() => {
		void fetchModerators();
		void fetchStats();
	}, []);

	const fetchStats = async () => {
		setStatsLoading(true);
		setStatsError("");
		try {
			const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/admin/stats`);
			if (!res.ok) throw new Error("Không tải được thống kê");
			const data = await res.json();
			setStats(data as AdminStats);
		} catch (err: any) {
			setStatsError(err.message || "Có lỗi xảy ra khi tải thống kê");
		} finally {
			setStatsLoading(false);
		}
	};

	const fetchModerators = async () => {
		setLoadingMods(true);
		setError("");
		try {
			const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/admin/moderators`);
			if (!res.ok) throw new Error("Không tải được danh sách moderator");
			const data = await res.json();
			setModerators(data.moderators || []);
		} catch (err: any) {
			setError(err.message || "Có lỗi xảy ra khi tải moderators");
		} finally {
			setLoadingMods(false);
		}
	};

	const handleCreateModerator = async (e: FormEvent) => {
		e.preventDefault();
		if (!newEmail.trim()) return;
		setCreating(true);
		setError("");
		try {
			const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/admin/moderators`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: newEmail.trim() }),
			});
			if (!res.ok) throw new Error("Không thể thêm moderator. Kiểm tra email hoặc quyền truy cập.");
			setNewEmail("");
			await fetchModerators();
		} catch (err: any) {
			setError(err.message || "Có lỗi xảy ra khi thêm moderator");
		} finally {
			setCreating(false);
		}
	};

	const handleRemoveModerator = async (userId: string) => {
		if (!confirm("Bạn có chắc muốn xóa quyền moderator của người này?")) return;
		setError("");
		try {
			const res = await fetchWithAuth(
				`${import.meta.env.VITE_API_URL}/api/admin/moderators/${userId}`,
				{ method: "DELETE" }
			);
			if (!res.ok) throw new Error("Xóa moderator thất bại");
			await fetchModerators();
		} catch (err: any) {
			setError(err.message || "Có lỗi xảy ra khi xóa moderator");
		}
	};

	const handleSignOut = () => {
		signOut();
		navigate("/signin", { replace: true });
	};

	return (
		<div className="admin-page home-page">
			<header className="home-hero">
				<div>
					<p className="hero-kicker">Admin Dashboard</p>
					<h1 className="hero-title">Happy Recipe Control Center</h1>
					<p className="hero-subtitle">
						Quản trị hệ thống, kiểm soát người dùng và nội dung ở chế độ toàn quyền.
					</p>
				</div>
				<div className="hero-actions">
					<span className="role-badge">{role}</span>
					<button className="ghost-button" onClick={handleSignOut}>
						Đăng xuất
					</button>
				</div>
			</header>

			<section className="actions-row">
				<div className="action-card">
					<h3>Điều phối moderator</h3>
					<p>Tái sử dụng layout phần trên của trang moderator để xem nhanh trạng thái chung.</p>
					<div className="admin-action-buttons">
						<button className="primary-button" onClick={() => navigate("/home")}>Chuyển tới Moderator</button>
						<button className="secondary-button" onClick={() => navigate("/profile")}>
							Hồ sơ cá nhân
						</button>
					</div>
				</div>
				{/* <div className="action-card">
					<h3>Thiết lập hệ thống</h3>
					<p>Placeholder cho cấu hình domain, SMTP, và ngưỡng cảnh báo.</p>
					<div className="admin-action-buttons">
						<button className="primary-button" disabled>
							Đang thiết kế
						</button>
					</div>
				</div> */}
			</section>

			<section className="admin-stats">
				<div className="stats-header">
					<div>
						<p className="hero-kicker">Thống kê</p>
						<h2 className="planning-title">Bài đăng · Bình luận · Tài khoản mới</h2>
						<p className="hero-subtitle">Theo dõi nhanh theo ngày, tuần, tháng, năm.</p>
					</div>
					<div className="stats-actions">
						<button className="ghost-button" onClick={fetchStats} disabled={statsLoading}>
							{statsLoading ? "Đang tải..." : "Làm mới"}
						</button>
					</div>
				</div>

				{statsError && <p className="moderator-error">{statsError}</p>}

				<div className="stats-grid-compact">
					{["posts", "comments", "newAccounts"].map((key) => {
						const labelMap: Record<string, string> = {
							posts: "Bài đăng",
							comments: "Bình luận",
							newAccounts: "Tài khoản mới",
						};
						const stat = stats ? (stats as any)[key] as PeriodStats : null;

						return (
							<div key={key} className="stat-card compact">
								<p className="stat-label">{labelMap[key]}</p>
								{statsLoading ? (
									<p className="stat-value">...</p>
								) : stat ? (
									<div className="stat-rows">
										<div className="stat-row"><span>Ngày</span><strong>{stat.day ?? 0}</strong></div>
										<div className="stat-row"><span>Tuần</span><strong>{stat.week ?? 0}</strong></div>
										<div className="stat-row"><span>Tháng</span><strong>{stat.month ?? 0}</strong></div>
										<div className="stat-row"><span>Năm</span><strong>{stat.year ?? 0}</strong></div>
									</div>
								) : (
									<p className="stat-value">--</p>
								)}
							</div>
						);
					})}
				</div>
			</section>

			{/* <section className="stats-grid">
				<div className="stat-card">
					<p className="stat-label">Trạng thái hệ thống</p>
					<p className="stat-value">Stable</p>
					<p className="stat-note">Kiểm tra cron, queue, email service</p>
				</div>
				<div className="stat-card">
					<p className="stat-label">Tài khoản cần duyệt</p>
					<p className="stat-value">--</p>
					<p className="stat-note">Chưa kết nối API - sẽ bổ sung</p>
				</div>
				<div className="stat-card">
					<p className="stat-label">Báo cáo mới</p>
					<p className="stat-value">--</p>
					<p className="stat-note">Đang lên kế hoạch hiển thị</p>
				</div>
			</section> */}	

			{/* <section className="admin-planning">
				<div className="planning-header">
					<div>
						<p className="hero-kicker">Roadmap</p>
						<h2 className="planning-title">Khu vực tính năng đang để trống</h2>
						<p className="hero-subtitle">
							Phần dưới đang dành chỗ cho các tính năng quản trị nâng cao. Liệt kê nhanh để bám sát kế hoạch
							triển khai.
						</p>
					</div>
				</div>

				<div className="planning-grid">
					{roadmapItems.map((item) => (
						<div key={item.title} className="planning-card">
							<h3>{item.title}</h3>
							<p>{item.detail}</p>
						</div>
					))}
				</div>

				<div className="empty-area">
					<div className="empty-dashed" aria-hidden />
					<p className="empty-text">
						Khu vực hiển thị dữ liệu (user groups, log hệ thống, audit trail) sẽ được bố trí tại đây khi hoàn
						thành API.
					</p>
				</div>
			</section> */}

			<section className="moderator-section">
				<div className="moderator-header">
					<div>
						<p className="hero-kicker">Moderator</p>
						<h2 className="planning-title">Quản lý moderator</h2>
						<p className="hero-subtitle">
							Thêm mới, xem thông tin và xóa quyền moderator. Các thao tác yêu cầu quyền ADMIN.
						</p>
					</div>
					<form className="moderator-form" onSubmit={handleCreateModerator}>
						<input
							type="email"
							placeholder="Nhập email moderator"
							value={newEmail}
							onChange={(e) => setNewEmail(e.target.value)}
							required
						/>
						<button type="submit" className="primary-button" disabled={creating}>
							{creating ? "Đang thêm..." : "Thêm moderator"}
						</button>
					</form>
				</div>

				{error && <p className="moderator-error">{error}</p>}

				<div className="moderator-list">
					{loadingMods ? (
						<p className="loading">Đang tải danh sách moderator...</p>
					) : sortedModerators.length === 0 ? (
						<p className="empty-text">Chưa có moderator nào.</p>
					) : (
						sortedModerators.map((mod) => (
							<div key={mod.userId} className="moderator-card">
								<div>
									<h3>{mod.displayName || mod.username || mod.email}</h3>
									<p className="item-meta">Email: {mod.email}</p>
									<p className="item-meta">ID: {mod.userId}</p>
									{mod.createdAt && (
										<p className="item-meta">
											Tạo: {new Date(mod.createdAt).toLocaleString("vi-VN")}
										</p>
									)}
									{mod.isActive === false && <span className="status-banned">Đã khóa</span>}
								</div>
								<div className="item-actions">
									<button className="btn-delete" onClick={() => handleRemoveModerator(mod.userId)}>
										Xóa quyền
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</section>
		</div>
	);
}
