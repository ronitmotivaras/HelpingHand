import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="hh-navbar">
      <div className="container">
        <Link to="/" className="hh-brand">
          <Leaf size={22} strokeWidth={2.5} />
          <span>HelpingHand</span>
        </Link>

        <div className="hh-nav-links">
          <Link to="/profile" className="hh-profile-btn">
            <UserCircle size={17} />
            <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
