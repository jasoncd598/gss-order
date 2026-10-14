'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../../lib/cartContext';
import { useUser } from '../../lib/userContext';
import { formatAUD } from '../../lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderLock,
  Users,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Boxes,
  X,
  Menu,
} from 'lucide-react';

const CUSTOMER_NAV = [
  { name: 'Dashboard',             href: '/',        icon: LayoutDashboard },
  { name: 'Product Catalog',       href: '/catalog', icon: Boxes,        badge: 'Shop' },
  { name: 'Cart & Checkout',       href: '/cart',    icon: ShoppingCart, badge: 'Cart' },
  { name: 'Order History',         href: '/order',   icon: Package },
  { name: 'Artwork & Proof Vault', href: '/vault',   icon: FolderLock },
  { name: 'Team & Permissions',    href: '/team',    icon: Users },
];

const ADMIN_NAV = [
  { name: 'Companies',         href: '/admin/companies', icon: Building2,  badge: 'Staff' },
  { name: 'All Orders',        href: '/admin/orders',    icon: Package,    badge: 'Staff' },
  { name: 'Reorder Requests',  href: '/admin/reorders',  icon: ShieldCheck, badge: 'Staff' },
];

// ─── Shared nav item ─────────────────────────────────────────────────────────
function NavItem({
  item,
  isActive,
  isCollapsed,
  cartCount,
  onLinkClick,
}: {
  item: { name: string; href: string; icon: React.ElementType; badge?: string };
  isActive: boolean;
  isCollapsed: boolean;
  cartCount: number;
  onLinkClick?: () => void;
}) {
  const Icon = item.icon;
  const badge = item.href === '/cart' && cartCount > 0 ? String(cartCount) : item.badge;
  return (
    <Link
      href={item.href}
      onClick={onLinkClick}
      title={isCollapsed ? item.name : undefined}
      className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-md text-xs font-medium transition-colors ${
        isActive
          ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
      }`}
    >
      <div className="flex items-center space-x-2.5">
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-950' : 'text-amber-400'}`} />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </div>
      {!isCollapsed && badge && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
          isActive ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-900 text-amber-400 border border-zinc-800'
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// ─── Nav content (shared by desktop + mobile drawer) ─────────────────────────
function NavContent({
  isCollapsed,
  onLinkClick,
}: {
  isCollapsed: boolean;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const { count } = useCart();
  const { companyName, paymentTerms, creditLimit, isStaff } = useUser();

  return (
    <>
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between overflow-hidden shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-400 text-zinc-950 font-black px-2.5 py-1.5 rounded text-sm tracking-wider shadow-sm shrink-0">
            GSS
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="font-bold text-white text-sm tracking-wide">GSS E-COMMERCE</h1>
              <p className="text-[11px] text-amber-400/80 font-mono">B2B Packaging Store</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Info Card */}
      {!isCollapsed && (
        <div className="mx-4 my-4 p-3 rounded bg-zinc-900 border border-zinc-800 shadow-inner shrink-0">
          <div className="flex items-center space-x-2 text-xs text-zinc-400 mb-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Corporate Account</span>
          </div>
          <div className="text-xs font-semibold text-white truncate">{companyName}</div>
          <div className="text-[10px] text-amber-400/90 font-mono mt-1 flex justify-between">
            <span>{paymentTerms}</span>
            {creditLimit > 0 && <span>Limit: {formatAUD(creditLimit)}</span>}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Storefront &amp; Orders
          </div>
        )}
        {CUSTOMER_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <NavItem
              key={item.name}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
              cartCount={count}
              onLinkClick={onLinkClick}
            />
          );
        })}

        {/* Admin section — staff only */}
        {isStaff && (
          <>
            {!isCollapsed ? (
              <div className="px-3 pt-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-t border-zinc-800 mt-2">
                Internal Admin
              </div>
            ) : (
              <div className="border-t border-zinc-800 my-2" />
            )}
            {ADMIN_NAV.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  cartCount={count}
                  onLinkClick={onLinkClick}
                />
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      {!isCollapsed ? (
        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-400 bg-zinc-950 shrink-0">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
              <span className="text-zinc-300">System Gateway</span>
            </span>
            <span className="text-amber-400 font-mono font-semibold">Online</span>
          </div>
          <p className="text-[10px] text-zinc-500">Instant Purchase Orders</p>
        </div>
      ) : (
        <div className="p-4 border-t border-zinc-800 flex justify-center text-amber-400 shrink-0" title="Gateway Online">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
      )}
    </>
  );
}

export default function SideNav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ── Mobile hamburger button (visible < lg) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-zinc-900 text-amber-400 p-2 rounded-lg border border-zinc-700 shadow-md"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-zinc-950/70 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-zinc-950 text-zinc-300 flex flex-col border-r border-zinc-800 z-50 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
        <NavContent isCollapsed={false} onLinkClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop sidebar (visible >= lg) ── */}
      <aside
        className={`hidden lg:flex flex-col bg-zinc-950 text-zinc-300 min-h-screen border-r border-zinc-800 shrink-0 transition-all duration-300 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-amber-400 text-zinc-950 p-1 rounded-full border border-zinc-900 shadow-md hover:bg-amber-300 z-20"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
        <NavContent isCollapsed={isCollapsed} />
      </aside>
    </>
  );
}
