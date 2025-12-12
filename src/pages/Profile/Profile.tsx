import React, { useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { Card } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const { user, fetchUserInfo, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      await fetchUserInfo();
    }
    if (!user) loadUser();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] bg-gradient-to-br from-slate-50 to-indigo-50 py-8">
      <h1> Moderator / Admin </h1>
      <Card className="profile-container w-full max-w-lg">
        <div className="flex flex-col items-start">
          {user.profileImageUrl ? (
            <img
              className="profile-avatar shadow-md border-2 border-indigo-200"
              src={user.profileImageUrl}
              alt="Profile"
            />
          ) : (
            <div
              className="profile-avatar flex items-center justify-center bg-indigo-100 text-indigo-500 text-4xl font-bold shadow-md border-2 border-indigo-200"
              aria-label="No profile image"
            >
              {user.displayName?.[0] || user.name?.[0] || "@"}
            </div>
          )}
          <div className="profile-name mt-2 mb-1 text-center">Display Name: {user.displayName || user.name}</div>
          <div className="profile-username mb-1 text-center">Username: @{user.name}</div>
          <div className="profile-email mb-2 text-center">Email: {user.email}</div>
          {user.bio && <div className="profile-bio mb-2 text-center">Bio: {user.bio}</div>}
          {user.isVerified && (
            <div className="flex justify-center items-center profile-verified mt-2">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="mr-1 text-green-500"><circle cx="12" cy="12" r="12" fill="#22c55e" opacity="0.15"/><path d="M7 13l3 3 7-7" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Verified
            </div>
          )}
          <button
            className="mt-6 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            onClick={() => navigate("/home")}
            type="button"
            aria-label="Return to Home"
          >
            Return to Home
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
