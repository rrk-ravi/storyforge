import { PenLine } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">StoryForge</span>
          <span className="brand__sub">Create stories that travel.</span>
        </Link>

        <nav className="topnav">
          <NavLink to="/" className="topnav__link">
            Discover
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className="topnav__link">
                Dashboard
              </NavLink>
              {user?.role === "ADMIN" && (
                <NavLink to="/admin/moderation" className="topnav__link">
                  Moderation
                </NavLink>
              )}
              {!user?.isEmailVerified && (
                <NavLink to="/verify-email" className="topnav__link">
                  Verify Email
                </NavLink>
              )}
              <NavLink to="/stories/new" className="topnav__button">
                <PenLine size={16} />
                Write
              </NavLink>
            </>
          )}
          {isAuthenticated ? (
            <button type="button" className="topnav__link topnav__logout" onClick={handleLogout}>
              {user?.name.split(" ")[0]} / Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className="topnav__link">
                Login
              </NavLink>
              <NavLink to="/register" className="topnav__button">
                Join
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
