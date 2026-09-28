import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, UserCircle, HandHeart, Package } from 'lucide-react';
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
          <Link to="/" className="hh-nav-link">
            <HandHeart size={15} />
            <span>Browse</span>
          </Link>
          <Link to="/my-donations" className="hh-nav-link">
            <Package size={15} />
            <span>My Donations</span>
          </Link>
          <Link to="/profile" className="hh-profile-btn">
            <UserCircle size={17} />
            <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
