import { NavLink, Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import ChatWidget from './ChatWidget';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 font-display text-lg font-extrabold text-accent">
        U
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-navy-900">
        Utral<span className="text-accent">shipment</span>
      </span>
    </Link>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.get('/api/auth/me').then((r: any) => setUser(r.user)).catch(() => setUser(null));
  }, []);

  const link = ({ isActive }: any) =>
    `text-sm font-medium transition ${isActive ? 'text-navy-800' : 'text-slate-600 hover:text-navy-800'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" className={link}>Home</NavLink>
            <NavLink to="/services" className={link}>Services</NavLink>
            <NavLink to="/about" className={link}>About</NavLink>
            <NavLink to="/faq" className={link}>FAQ</NavLink>
            <NavLink to="/contact" className={link}>Contact</NavLink>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <a href="tel:+12016032142" className="text-sm font-semibold text-navy-800">+1 201-603-2142</a>
            {user ? (
              <Link to="/portal" className="btn-primary !py-2">My Portal</Link>
            ) : (
              <>
                <Link to="/login" className="btn-outline !py-2">Sign In</Link>
                <Link to="/register" className="btn-primary !py-2">Register</Link>
              </>
            )}
          </div>
          <button
            className="rounded-lg border border-slate-300 p-2 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <NavLink to="/" className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>Home</NavLink>
            <NavLink to="/services" className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>Services</NavLink>
            <NavLink to="/about" className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>About</NavLink>
            <NavLink to="/faq" className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>FAQ</NavLink>
            <NavLink to="/contact" className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>Contact</NavLink>
            <div className="mt-2 flex gap-3">
              {user ? (
                <Link to="/portal" className="btn-primary flex-1 !py-2" onClick={() => setOpen(false)}>My Portal</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-outline flex-1 !py-2" onClick={() => setOpen(false)}>Sign In</Link>
                  <Link to="/register" className="btn-primary flex-1 !py-2" onClick={() => setOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-900 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="mb-3 font-display text-lg font-extrabold text-white">
              Utral<span className="text-accent">shipment</span>
            </div>
            <p className="text-sm leading-relaxed">International shipping and logistics you can track end to end.</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Company</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/services" className="hover:text-white">Services</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Customers</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/track" className="hover:text-white">Track Shipment</Link></li>
              <li><Link to="/portal" className="hover:text-white">Customer Portal</Link></li>
              <li><Link to="/register" className="hover:text-white">Create Account</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Support</p>
            <ul className="space-y-2 text-sm">
              <li><a href="tel:+12016032142" className="hover:text-white">+1 201-603-2142</a></li>
              <li><a href="mailto:Utralshipment@gmail.com" className="hover:text-white">Utralshipment@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Utralshipment. All rights reserved.
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
