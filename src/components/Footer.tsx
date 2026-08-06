import { Link } from "react-router-dom";
import { Crown, BookOpen, PlayCircle, Users, TerminalSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">Billionaire Blueprint</span>
              <p className="text-gray-500 text-xs">Your guide to extraordinary wealth</p>
            </div>
          </Link>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/lessons" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Lessons
            </Link>
            <Link to="/videos" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5" /> Videos
            </Link>
            <Link to="/founders" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Founders
            </Link>
            <Link to="/api-docs" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <TerminalSquare className="w-3.5 h-3.5" /> API
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800/50 text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Billionaire Blueprint. For educational purposes only.
            Not financial advice. All billionaire data sourced from public records.
          </p>
          <p className="text-gray-700 text-xs mt-2">
            Powered by a SQLite database &amp; REST API —{" "}
            <Link to="/api-docs" className="text-amber-500/80 hover:text-amber-400">
              explore the live API
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
