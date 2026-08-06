import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Crown, Download, Menu, X, BookOpen, PlayCircle, Users, TerminalSquare, Newspaper, Search, Award, ShieldCheck, TrendingUp } from "lucide-react";
import { generateBillionairePdf } from "../utils/generatePdf";
import { cn } from "../utils/cn";

const navItems = [
  { to: "/", label: "Home", icon: Crown },
  { to: "/lessons", label: "Lessons", icon: BookOpen },
  { to: "/videos", label: "Videos", icon: PlayCircle },
  { to: "/founders", label: "Founders", icon: Users },
  { to: "/blog", label: "Blog", icon: Newspaper },
  { to: "/certificate", label: "Certificate", icon: Award },
  { to: "/api-docs", label: "API", icon: TerminalSquare },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateBillionairePdf();
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="w-5 h-5 text-gray-900" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg hidden sm:block leading-none">
              Billionaire Blueprint
            </span>
            <span className="text-amber-400 text-xs font-semibold tracking-wide hidden sm:block mt-0.5">
              Seedwel Investment Ltd
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
          <Link
            to="/founders#invest"
            className="hidden lg:flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Invest With Us
          </Link>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-5 py-2.5 rounded-lg text-sm hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </button>
          <Link
            to="/search"
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-800 text-gray-400 hover:text-amber-400 hover:border-amber-500/40 transition-all"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-gray-400 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 p-4 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "block py-2 transition-colors",
                  isActive ? "text-amber-400 font-semibold" : "text-gray-300 hover:text-amber-400"
                )
              }
            >
              <span className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </span>
            </NavLink>
          ))}
          <button
            onClick={() => {
              handleDownload();
              setMobileOpen(false);
            }}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-5 py-3 rounded-lg text-sm"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </button>
          <Link
            to="/search"
            className="flex items-center justify-center gap-2 w-full py-2 text-gray-300 hover:text-amber-400 transition-colors"
          >
            <Search className="w-4 h-4" /> Search
          </Link>
        </div>
      )}
    </nav>
  );
}
