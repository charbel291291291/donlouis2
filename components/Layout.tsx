import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname.startsWith('/auth');

  if (isAdmin || isAuthPage) {
    return <div className="min-h-screen bg-neutral-900 text-gray-100">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-gray-100 pb-24 safe-pb">
      <main className="flex-grow pt-safe-top">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface/95 backdrop-blur-md border-t border-white/5 pb-safe pt-2 px-6 shadow-2xl z-50 transition-transform duration-300">
        <div className="flex justify-between items-center max-w-md mx-auto h-16">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center transition-colors duration-300 ${isActive ? 'text-brand-gold scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <Icon name="home" className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">Home</span>
          </NavLink>
          
          <NavLink to="/menu" className={({ isActive }) => `flex flex-col items-center transition-colors duration-300 ${isActive ? 'text-brand-gold scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <Icon name="menu" className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">Menu</span>
          </NavLink>

          <NavLink to="/cart" className={({ isActive }) => `relative flex flex-col items-center transition-colors duration-300 ${isActive ? 'text-brand-gold scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <div className="relative">
              <Icon name="cart" className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-500/50">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">Cart</span>
          </NavLink>

          <NavLink to={user ? "/profile" : "/auth"} className={({ isActive }) => `flex flex-col items-center transition-colors duration-300 ${isActive ? 'text-brand-gold scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <Icon name="user" className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">{user ? 'Profile' : 'Log In'}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};