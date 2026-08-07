import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import CoursesPage from "./pages/CoursesPage";
import ServicesPage from "./pages/ServicesPage";
import CertificatesPage from "./pages/CertificatesPage";
import CareersPage from "./pages/CareersPage";
import InvestmentPage from "./pages/InvestmentPage";
import PartnershipsPage from "./pages/PartnershipsPage";
import ContactPage from "./pages/ContactPage";
import LessonsPage from "./pages/LessonsPage";
import LessonDetailPage from "./pages/LessonDetailPage";
import VideosPage from "./pages/VideosPage";
import FoundersPage from "./pages/FoundersPage";
import SuccessStoriesPage from "./pages/SuccessStoriesPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import CertificatePage from "./pages/CertificatePage";
import CertificateVerifyPage from "./pages/CertificateVerifyPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import InvestPage from "./pages/InvestPage";
import SearchPage from "./pages/SearchPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { RequireAuth, RequireAdmin } from "./components/RequireAuth";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/investment" element={<InvestmentPage />} />
        <Route path="/partnerships" element={<PartnershipsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/founders" element={<FoundersPage />} />
        <Route path="/inspiration" element={<SuccessStoriesPage />} />
        <Route path="/invest" element={<InvestPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/verify" element={<CertificateVerifyPage />} />
        <Route path="/verify/:certNumber" element={<CertificateVerifyPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Registered students only */}
        <Route
          path="/lessons/:id"
          element={
            <RequireAuth>
              <LessonDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/certificate"
          element={
            <RequireAuth>
              <CertificatePage />
            </RequireAuth>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />

        {/* Management only */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/login" element={<AdminPage />} />
        <Route
          path="/api-docs"
          element={
            <RequireAdmin>
              <ApiDocsPage />
            </RequireAdmin>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
