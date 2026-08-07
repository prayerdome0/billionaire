import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Headphones,
  Laptop,
  Megaphone,
  Palette,
  PenTool,
  ShoppingBag,
  UserCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

const courses = [
  {
    icon: UserCheck,
    title: "Virtual Assistant Training",
    desc: "Learn the fundamentals of becoming a professional virtual assistant.",
    topics: ["Administrative support", "Email management", "Customer communication", "Calendar management", "Online research", "Data entry", "Document management", "Client support", "Remote-work skills", "Professional communication"],
    color: "from-amber-400 to-yellow-500",
  },
  {
    icon: Headphones,
    title: "Customer Service",
    desc: "Communicate effectively with customers and provide professional service.",
    topics: ["Customer communication", "Customer support", "Problem solving", "Professional communication", "Complaint handling", "Client retention", "Digital customer service"],
    color: "from-emerald-400 to-teal-500",
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    desc: "Learn practical digital marketing skills for modern businesses.",
    topics: ["Social media marketing", "Content creation", "Online advertising", "Lead generation", "Brand promotion", "Marketing strategy", "Customer engagement"],
    color: "from-sky-400 to-blue-500",
  },
  {
    icon: Laptop,
    title: "Website Development",
    desc: "Learn the fundamentals of creating and managing professional websites.",
    topics: ["HTML & CSS", "Responsive design", "Website management", "Hosting & domains", "Basic JavaScript"],
    color: "from-violet-400 to-purple-500",
  },
  {
    icon: Palette,
    title: "Graphic Design",
    desc: "Develop practical design skills for digital and business communication.",
    topics: ["Design principles", "Brand identity", "Digital graphics", "Social media visuals", "Print design basics"],
    color: "from-rose-400 to-pink-500",
  },
  {
    icon: PenTool,
    title: "Social Media Management",
    desc: "Manage professional social media accounts and create engaging content.",
    topics: ["Platform management", "Content strategy", "Community engagement", "Analytics", "Paid social"],
    color: "from-orange-400 to-red-500",
  },
  {
    icon: Briefcase,
    title: "Entrepreneurship",
    desc: "Develop practical knowledge for starting, managing, and growing a business.",
    topics: ["Business planning", "Financial basics", "Marketing fundamentals", "Operations", "Growth strategies"],
    color: "from-indigo-400 to-blue-500",
  },
  {
    icon: ShoppingBag,
    title: "Computer & Digital Skills",
    desc: "Build essential digital skills for education, employment, and business.",
    topics: ["Computer fundamentals", "Internet & email", "Office applications", "Online safety", "Digital communication"],
    color: "from-teal-400 to-cyan-500",
  },
];

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Online Courses"
        title="Learn. Develop."
        highlight="Grow."
        description="Our online learning platform provides practical courses designed to help learners develop useful professional and digital skills."
      />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Course grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {courses.map((course, i) => (
              <div
                key={i}
                className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-7 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative"
              >
                <div className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br ${course.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center text-gray-950 mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <course.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{course.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {course.topics.slice(0, 5).map((topic, j) => (
                    <span key={j} className="text-[11px] px-2.5 py-1 rounded-full bg-gray-800/80 text-gray-300 border border-gray-700/50">
                      {topic}
                    </span>
                  ))}
                  {course.topics.length > 5 && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      +{course.topics.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* More coming */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-center mb-16">
            <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">More Courses Coming</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Additional courses can be introduced as the company grows, based on market demand and employment opportunities.
            </p>
          </div>

          {/* Certificate info */}
          <div className="bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-3.5 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider mb-4">
                  <Award className="w-3.5 h-3.5" /> Certification
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                  Earn Recognized Certificates
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Learners who successfully complete eligible courses may receive an official company-issued certificate. The certificate is professional, verifiable, and easy to authenticate.
                </p>
                <p className="text-gray-500 text-xs">
                  No course fees or payment amounts appear on the certificate. Where a program has genuine third-party accreditation, the appropriate accreditation information may be displayed.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  "Learner's full name",
                  "Course title",
                  "Certificate number",
                  "Date of completion",
                  "Issuing organization",
                  "Authorized signature",
                  "Official company branding",
                  "QR code for verification",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/certificates"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all text-sm"
              >
                Learn About Certificates <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
