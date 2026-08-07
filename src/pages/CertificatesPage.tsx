import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle,
  QrCode,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Certificates"
        title="Professional &"
        highlight="Verifiable Credentials"
        description="Learners who successfully complete eligible courses may receive an official company-issued certificate. The certificate is professional, verifiable, and easy to authenticate."
      />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Certificate features */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div>
              <h2 className="text-2xl font-black text-white mb-6">What's Included</h2>
              <div className="space-y-4">
                {[
                  { label: "Learner's full name", desc: "As provided upon completion" },
                  { label: "Course title", desc: "Name of the completed program" },
                  { label: "Certificate number", desc: "Unique identifier for verification" },
                  { label: "Date of completion", desc: "When the course was completed" },
                  { label: "Issuing organization", desc: "Seedwel Investment Limited" },
                  { label: "Authorized signature", desc: "Official signatory" },
                  { label: "Official company branding", desc: "Professional presentation" },
                  { label: "QR code for verification", desc: "Instant online authentication" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white text-sm">{item.label}</div>
                      <div className="text-gray-500 text-xs">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificate preview */}
            <div className="relative bg-[#111827] border-4 border-[#d1ab52] rounded-lg p-6 md:p-8 shadow-2xl shadow-amber-500/10">
              <div className="absolute inset-2 border border-[#d1ab52]/60 rounded" />
              <div className="relative text-center">
                <div className="flex justify-center mb-3">
                  <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited" className="h-12 w-auto object-contain" />
                </div>
                <div className="text-[#d1ab52] font-bold tracking-[0.3em] text-[10px] mb-2">SEEDWEL INVESTMENT LIMITED</div>
                <h3 className="text-xl md:text-2xl font-black text-white mb-2">Certificate of Completion</h3>
                <div className="w-20 h-px bg-[#d1ab52] mx-auto my-4" />
                <p className="text-gray-400 text-xs">This certificate is proudly awarded to</p>
                <p className="text-[#d1ab52] font-bold text-lg md:text-xl my-2">Learner Name</p>
                <p className="text-gray-300 text-xs max-w-xs mx-auto leading-relaxed">
                  for successfully completing the course program and meeting all requirements.
                </p>
                <div className="flex justify-center my-4">
                  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-[#d1ab52]" />
                  </div>
                </div>
                <p className="text-gray-500 text-[10px]">Verify at seedwel.com/verify</p>
                <div className="flex justify-between items-end mt-6 text-gray-400 text-[10px]">
                  <div className="text-center">
                    <div className="w-24 border-t border-[#d1ab52] pt-1">Date</div>
                  </div>
                  <div className="text-center">
                    <div className="w-24 border-t border-[#d1ab52] pt-1">Authorized Signature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 rounded-3xl p-8 md:p-10 mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-3.5 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verification
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                  Easy Authentication
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Each certificate includes a QR code that allows an authorized person to verify the certificate online. Simply scan the QR code or visit our verification page.
                </p>
                <Link
                  to="/verify"
                  className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm hover:gap-3 transition-all"
                >
                  Verify a Certificate <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                  <QrCode className="w-8 h-8 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white text-sm">QR Code</div>
                    <div className="text-gray-500 text-xs">Scan to verify instantly</div>
                  </div>
                </div>
                <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white text-sm">Secure Registry</div>
                    <div className="text-gray-500 text-xs">Records stored securely</div>
                  </div>
                </div>
                <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                  <Award className="w-8 h-8 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white text-sm">Official Credential</div>
                    <div className="text-gray-500 text-xs">Issued by Seedwel Investment Limited</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important notes */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-3">Important Notes</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  No course fees or payment amounts appear on the certificate.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Where a program has genuine third-party accreditation, it may be displayed.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Programs without external accreditation are not presented as accredited.
                </li>
              </ul>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-3">How to Get Certified</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">1</div>
                  Register for an eligible course
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">2</div>
                  Complete all course requirements
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">3</div>
                  Receive your verified certificate
                </li>
              </ul>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm mt-4 hover:gap-3 transition-all"
              >
                Browse Courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
