import { useState, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Award,
  ShieldCheck,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserPlus,
  Home,
  GraduationCap,
  Building2,
  UserCircle,
  ChevronRight,
  Briefcase,
  Handshake,
  Phone,
  BookOpen,
  Laptop,
  Users,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { cn } from "../utils/cn";

const mainNav = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About Us" },
  { to: "/courses", label: "Courses" },
  { to: "/services", label: "Services" },
  { to: "/certificates", label: "Certificates" },
  { to: "/inspiration", label: "Inspiration" },
  { to: "/careers", label: "Careers" },
  { to: "/investment", label: "Investment" },
  { to: "/partnerships", label: "Partnerships" },
  { to: "/contact", label: "Contact" },
];

const learnItems = [
  { to: "/courses", label: "Courses", desc: "Professional & digital skills", icon: BookOpen },
  { to: "/lessons", label: "Learning Platform", desc: "Online curriculum", icon: GraduationCap },
  { to: "/certificates", label: "Certificates", desc: "Verification & credentials", icon: Award },
  { to: "/careers", label: "Careers", desc: "Opportunities", icon: Briefcase },
];

const companyItems = [
  { to: "/about", label: "About Us", desc: "Vision & mission", icon: Building2 },
  { to: "/services", label: "Services", desc: "What we offer", icon: Laptop },
  { to: "/investment", label: "Investment", desc: "Opportunities", icon: TrendingUp },
  { to: "/partnerships", label: "Partnerships", desc: "Work with us", icon: Handshake },
  { to: "/founders", label: "Our People", desc: "Leadership", icon: Users },
  { to: "/inspiration", label: "Inspiration", desc: "Success stories & motivation", icon: Award },
  { to: "/contact", label: "Contact", desc: "Get in touch", icon: Phone },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, sessionKind, logout } = useAuth();
  const signedIn = !!user || sessionKind === "dev";
  const displayName = profile?.name || user?.displayName || (user?.email || "").split("@")[0] || "Account";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const accountItems = [
    ...(signedIn
      ? [{ to: "/account", label: "My Dashboard", desc: "Progress & achievements", icon: LayoutDashboard }]
      : [{ to: "/auth", label: "Sign In / Register", desc: "Create your account", icon: UserPlus }]),
    { to: "/admin", label: "Admin Portal", desc: "Management console", icon: ShieldCheck },
  ];

  const MenuSection = ({
    title,
    icon: SectionIcon,
    items,
  }: {
    title: string;
    icon: React.ElementType;
    items: { to: string; label: string; desc: string; icon: React.ElementType }[];
  }) => (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">
        <SectionIcon className="w-3.5 h-3.5 text-amber-400" /> {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3.5 rounded-2xl px-3.5 py-3 transition-all group",
                isActive
                  ? "bg-amber-500/15 border border-amber-500/40"
                  : "border border-transparent hover:bg-gray-900 hover:border-gray-800"
              )
            }
          >
            <span className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0 group-hover:border-amber-500/40 transition-colors">
              <item.icon className="w-5 h-5 text-amber-400" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-white">{item.label}</span>
              <span className="block text-[11px] text-gray-500 truncate">{item.desc}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-amber-400 transition-colors shrink-0" />
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/images/seedwel-logo.svg"
              alt="Seedwel Investment Limited Logo"
              className="w-11 h-11 object-contain group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-white font-black text-base sm:text-lg hidden sm:block leading-none tracking-tight">
                Seedwel Investment
              </span>
              <span className="text-amber-400 text-[11px] sm:text-xs font-bold tracking-widest uppercase hidden sm:block mt-1">
                Education & Investment
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-4">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "text-sm transition-colors",
                    isActive ? "text-amber-400 font-semibold" : "text-gray-400 hover:text-amber-400"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Auth state */}
            {signedIn ? (
              <Link
                to="/account"
                className="hidden md:flex items-center gap-2 rounded-lg border border-gray-800 hover:border-amber-500/40 pl-1.5 pr-3 py-1.5 transition-all"
              >
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 text-xs font-black">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-bold text-gray-200 max-w-[120px] truncate">{displayName}</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="hidden md:flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-4 py-2.5 text-xs font-bold transition-all"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}

            {/* Menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg border border-gray-800 hover:border-amber-500/40 text-gray-300 hover:text-amber-400 px-3 py-2.5 transition-all"
              aria-label="Open full menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="hidden sm:block text-xs font-bold">Menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Full menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-gray-950/98 backdrop-blur-xl overflow-y-auto" onClick={() => setMenuOpen(false)}>
          <div className="max-w-5xl mx-auto px-4 pt-24 pb-12" onClick={(e) => e.stopPropagation()}>
            <div className="grid md:grid-cols-3 gap-8">
              <MenuSection title="Learn" icon={GraduationCap} items={learnItems} />
              <MenuSection title="Company" icon={Building2} items={companyItems} />
              <MenuSection title="My Account" icon={UserCircle} items={accountItems} />
            </div>

            {/* Actions row */}
            <div className="mt-10 border-t border-gray-800/80 pt-6 flex flex-wrap items-center gap-3">
              {signedIn ? (
                <>
                  <div className="flex items-center gap-2.5 rounded-xl bg-gray-900 border border-gray-800 px-4 py-2.5">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 text-sm font-black">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">{displayName}</div>
                      <div className="text-[10px] text-gray-500">
                        {isAdmin ? "Management account" : "Registered student"}
                        {sessionKind === "dev" ? " (dev)" : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-5 py-3 text-sm font-bold text-rose-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-5 py-3 text-sm font-bold transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign In / Create Free Account
                </Link>
              )}

              <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-600">
                <Home className="w-3.5 h-3.5 text-amber-500/60" />
                Seedwel Investment Limited — Zambia
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
