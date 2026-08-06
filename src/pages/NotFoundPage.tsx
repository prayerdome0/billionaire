import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Navbar from "../components/Navbar";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-8xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">This page doesn't exist</h1>
        <p className="text-gray-500 max-w-md mb-8">
          Even billionaires lose money on bad bets — this is one you can skip.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all"
        >
          <Compass className="w-5 h-5" /> Back to the Blueprint
        </Link>
      </div>
    </div>
  );
}
