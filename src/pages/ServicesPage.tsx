import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Headphones,
  Laptop,
  Layout,
  Lightbulb,
  LineChart,
  Mail,
  Megaphone,
  Palette,
  PenTool,
  Search,
  ShoppingBag,
  Target,
  UserCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

const services = [
  { icon: Laptop, title: "Website Development", desc: "Professional websites for businesses and organizations" },
  { icon: Palette, title: "Graphic Design", desc: "Visual design for digital and print communication" },
  { icon: Megaphone, title: "Digital Marketing", desc: "Strategic online marketing and brand promotion" },
  { icon: PenTool, title: "Social Media Management", desc: "Professional social media account management" },
  { icon: UserCheck, title: "Virtual Assistant Services", desc: "Remote administrative and operational support" },
  { icon: Headphones, title: "Customer Support", desc: "Professional customer service solutions" },
  { icon: Target, title: "Lead Generation", desc: "Identifying and attracting potential customers" },
  { icon: LineChart, title: "Data Entry", desc: "Accurate and efficient data management" },
  { icon: Search, title: "Online Research", desc: "Comprehensive research and analysis" },
  { icon: Layout, title: "Business Branding", desc: "Brand identity and visual communication" },
  { icon: Mail, title: "Content Creation", desc: "Engaging content for digital platforms" },
  { icon: Lightbulb, title: "Technology Solutions", desc: "Digital tools and technology implementation" },
  { icon: Briefcase, title: "Training & Skills Development", desc: "Professional training programs" },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Our Services"
        title="Professional Digital &"
        highlight="Business Services"
        description="In addition to education and skills development, we provide professional digital and business services that create practical environments for learners to develop real-world experience."
      />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Services grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {services.map((service, i) => (
              <div
                key={i}
                className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">{service.title}</h3>
                <p className="text-gray-400 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>

          {/* Value proposition */}
          <div className="bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 rounded-3xl p-8 md:p-10 mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                  Real Experience for Learners
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  These services also help create practical environments where learners can develop real-world professional experience. By working on actual projects, our students gain hands-on skills that prepare them for the workplace.
                </p>
                <p className="text-gray-500 text-xs">
                  Our approach combines education with practical application, creating a pathway from learning to employment.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Building2, label: "Business Ready" },
                  { icon: Lightbulb, label: "Innovation" },
                  { icon: Target, label: "Results-Driven" },
                  { icon: ShoppingBag, label: "Professional" },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 text-center">
                    <item.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-3">Need a service or want to collaborate?</h3>
            <p className="text-gray-400 text-sm mb-6">Get in touch to discuss how we can work together.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all text-sm"
              >
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/partnerships"
                className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
