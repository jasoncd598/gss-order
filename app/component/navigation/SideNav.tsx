'use client';

import { useState } from 'react';
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
  CreditCard,
  History,
  ChevronLeft,
  ChevronRight,
  Boxes,
  X,
  Menu,
  Gauge,
} from 'lucide-react';

const CUSTOMER_NAV = [
  { name: 'Dashboard',             href: '/',        icon: LayoutDashboard },
  { name: 'Product Catalog',       href: '/catalog', icon: Boxes },
  { name: 'Cart & Checkout',       href: '/cart',    icon: ShoppingCart },
  { name: 'Order History',         href: '/order',   icon: Package },
  { name: 'Artwork & Proof Vault', href: '/vault',   icon: FolderLock },
  { name: 'Team & Permissions',    href: '/team',    icon: Users },
];

const ADMIN_NAV = [
  { name: 'Staff Overview',    href: '/admin',           icon: Gauge },
  { name: 'Companies',         href: '/admin/companies', icon: Building2 },
  { name: 'All Orders',        href: '/admin/orders',    icon: Package },
  { name: 'Reorder Requests',  href: '/admin/reorders',  icon: ShieldCheck },
  { name: 'Subscriptions',     href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Audit Log',         href: '/admin/audit',     icon: History },
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
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-sm text-[13px] transition-colors ${
        isActive
          ? 'bg-label text-ink font-semibold shadow-[0_1px_2px_rgba(8,14,32,0.35)]'
          : 'text-blue-100 hover:bg-wall-soft hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-600' : 'text-brass-light'}`} strokeWidth={1.75} />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </div>
      {!isCollapsed && badge && (
        <span className={`accession text-xs min-w-[1.25rem] text-center px-1.5 py-0.5 rounded-sm shrink-0 ${
          isActive ? 'bg-ink text-label' : 'bg-brass-light text-ink'
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
      <div className="px-5 py-5 border-b border-white/10 flex items-center overflow-hidden shrink-0">
        <Link href="/" className="flex items-baseline gap-2.5 min-w-0" onClick={onLinkClick}>
          <span className="font-display text-[26px] leading-none text-label tracking-tight shrink-0">GSS</span>
          {!isCollapsed && <span className="text-xs text-brass-light uppercase tracking-[0.16em] truncate">Trade Orders</span>}
        </Link>
      </div>

      {/* Account Info Card */}
      {!isCollapsed && (
        <div className="mx-4 my-4 px-3 py-2.5 rounded-sm bg-wall-deep/60 border border-white/10 shrink-0">
          <div className="text-[13px] font-semibold text-white truncate" title={companyName}>{companyName}</div>
          <div className="accession text-xs text-blue-200 mt-1 flex justify-between gap-2">
            <span>{paymentTerms}</span>
            {creditLimit > 0 && <span>Limit {formatAUD(creditLimit)}</span>}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pt-1 pb-2 text-xs font-semibold text-blue-300 uppercase tracking-[0.14em]">
            Ordering
          </div>
        )}
        {CUSTOMER_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
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
              <div className="px-3 pt-4 pb-2 text-xs font-semibold text-blue-300 uppercase tracking-[0.14em] border-t border-white/10 mt-3">
                GSS Staff
              </div>
            ) : (
              <div className="border-t border-white/10 my-2" />
            )}
            {ADMIN_NAV.map((item) => {
              const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
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

      <div className="h-4 shrink-0" />
    </>
  );
}

export default function SideNav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change (adjusting state during render, not in an effect)
  const [drawerPath, setDrawerPath] = useState(pathname);
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setMobileOpen(false);
  }

  return (
    <>
      {/* ── Mobile hamburger button (visible < lg) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 bg-wall text-brass-light p-2.5 rounded-sm shadow-[0_2px_6px_rgba(8,14,32,0.3)]"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-wall-deep/70 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-wall text-blue-100 flex flex-col z-50 transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-5 right-4 text-blue-200 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
        <NavContent isCollapsed={false} onLinkClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop sidebar (visible >= lg) ── */}
      <aside
        className={`hidden lg:flex flex-col bg-wall text-blue-100 min-h-screen shrink-0 transition-[width] duration-300 ease-out relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-label text-ink p-1 rounded-full border border-zinc-300 shadow-[0_1px_3px_rgba(8,14,32,0.25)] hover:bg-white z-20"
          title={isCollapsed ? 'Expand' : 'Collapse'}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
        <NavContent isCollapsed={isCollapsed} />
      </aside>
    </>
  );
}
