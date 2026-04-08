import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from "../lib/base44Stub";
import {
  Shield, Cloud, Brain, Cpu, Globe, Lock, ChevronDown,
  CheckCircle, ArrowRight, Phone, Mail, Menu, X,
  Building2, Users, Clock, Star, Award, Zap, Database, BarChart2
} from 'lucide-react';


const products = [
  { icon: Shield, title: 'Security & Surveillance', desc: 'Securing critical infrastructure with real-time monitoring and intelligent detection.', color: 'from-rose-500 to-rose-700', features: ['Real-time monitoring & smart detection', 'Rapid incident response'] },
  { icon: Brain, title: 'Healthcare AI', desc: 'AI-powered healthcare solutions for smarter care and better clinical decisions.', color: 'from-blue-500 to-blue-700', features: ['Smarter clinical decisions', 'Seamless care continuity'] },
  { icon: Globe, title: 'Media & Education', desc: 'Intelligent platforms enhancing learning, communication, and engagement at scale.', color: 'from-violet-500 to-violet-700', features: ['Improved learner engagement', 'Scalable digital accessibility'] },
  { icon: Cpu, title: 'Telecommunication', desc: 'Secure, scalable networks enabling reliable connectivity for modern enterprises.', color: 'from-cyan-500 to-cyan-700', features: ['High-speed connectivity', 'Reliable network infrastructure'] },
  { icon: Users, title: 'HR Consulting', desc: 'Structured HR consulting for efficient hiring, onboarding, and workforce management.', color: 'from-emerald-500 to-emerald-700', features: ['Streamlined talent hiring', 'Workforce alignment strategy'] },
  { icon: Lock, title: 'Cybersecurity', desc: 'Proactive cybersecurity protecting systems and data across digital environments.', color: 'from-amber-500 to-amber-700', features: ['Early threat detection', 'Reduced security vulnerabilities'] },
];

const services = [
  { icon: Lock, title: 'Cybersecurity', desc: 'Protecting your digital ecosystem with intelligent cybersecurity—ensuring monitoring, risk mitigation, and secure operations.', features: ['End-to-end security across systems and apps', 'Continuous monitoring and rapid response'] },
  { icon: Shield, title: 'SOC', desc: 'Continuous security operations ensuring secure, reliable, and efficient enterprise environments.', features: ['Real-time threat detection', 'Continuous risk management'] },
];

const certifications = ['GDPR Ready', 'UKCert', 'IAF Member', 'ISO 9001'];

export default function Landing() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ first_name: '', last_name: '', email: '', phone: '', message: '' });

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div id="top" className="min-h-screen bg-[#050d1a] text-white font-inter">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-[#050d1a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">NSBTEK</p>
              <p className="text-[9px] text-blue-400 uppercase tracking-widest">Think Big | AI-First</p>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {['Services', 'Products', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-white/70 hover:text-white transition-colors">{item}</a>
            ))}
            <a href="#contact" className="text-sm text-white/70 hover:text-white transition-colors">Contact</a>
          </div>

          {/* Login button */}
          <div className="flex items-center gap-3">
            <button
  onClick={handleLogin}
  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
>
  Login to NSBTEK
</button>
            <button className="md:hidden text-white/70" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#0d1f3c] border-t border-white/5 px-6 py-4 space-y-3">
            {['Services', 'Products', 'About', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileOpen(false)}
                className="block text-sm text-white/70 hover:text-white py-1">{item}</a>
            ))}
          </div>
        )}
      </nav>
      {/* Overlay to close login dropdown */}


      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#050d1a] via-[#0a1628] to-[#050d1a]" />
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center py-20">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Think Big | AI First</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              <span className="text-amber-400">Transforming</span>{' '}
              <span className="text-white">the Future</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">with AI</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
              We help organizations innovate faster, operate smarter, and secure their digital frontier — leveraging AI, Cloud, IoT, and Cybersecurity to build future-ready systems worldwide.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#contact">
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 h-auto rounded-xl text-sm font-semibold gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </a>
              <button
  onClick={handleLogin}
  className="border border-white/20 text-white hover:bg-white/10 px-6 py-3 h-auto rounded-xl text-sm font-semibold bg-transparent"
>
  Platform Login
</button>
            </div>
            {/* Badges */}
            <div className="flex flex-wrap gap-3 mt-8">
              {certifications.map(c => (
                <div key={c} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-white/60">{c}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Right visual */}
          <div className="hidden lg:block relative">
            <div className="relative w-full aspect-square max-w-[500px] mx-auto">
              <img src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&auto=format&fit=crop" alt="AI Technology" className="rounded-3xl object-cover w-full h-full opacity-80" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#050d1a] via-transparent to-transparent" />
              {/* Floating stats */}
              <div className="absolute -bottom-4 -left-4 bg-[#0d1f3c] border border-white/10 rounded-2xl p-4 shadow-xl">
                <p className="text-3xl font-bold text-blue-400">33+</p>
                <p className="text-xs text-white/50 mt-0.5">Years of Experience</p>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#0d1f3c] border border-white/10 rounded-2xl p-4 shadow-xl">
                <p className="text-3xl font-bold text-emerald-400">98%</p>
                <p className="text-xs text-white/50 mt-0.5">Client Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI ENGINE SECTION */}
      <section className="py-20 bg-gradient-to-b from-[#050d1a] to-[#07111e]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI That Grows With You', desc: 'Whether you\'re experimenting with AI or scaling enterprise adoption, our solutions adapt to your evolving business challenges.', points: ['Flexible AI Solution Architecture', 'Built Around Your Data'] },
              { icon: Database, title: 'Your AI Engine', desc: 'Connects data, intelligence, and automation to solve business challenges at enterprise scale.', points: ['Intelligent data pipelines', 'Real-time decision support'] },
              { icon: Award, title: 'AI Built for Impact', desc: 'A portfolio of AI-driven products designed to solve industry-specific challenges with speed, scale, and security.', points: ['33+ Years of Experience', 'Global enterprise deployments'] },
            ].map((item, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-4">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.points.map((p, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-white/60">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="py-20" id="about">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-3">How We Work</p>
            <h2 className="text-4xl font-extrabold text-white">How We Deliver Innovation and Excellence</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Collaborative Approach', desc: 'We work closely with your team to understand challenges and deliver tailored, AI-driven solutions aligned to your needs.' },
              { title: 'Innovative Solutions', desc: 'Using AI, IoT, cloud, and cybersecurity, we build scalable solutions that enhance efficiency, security, and future readiness.' },
              { title: 'Commitment to Excellence', desc: 'We deliver high-quality, cost-effective solutions with measurable results and long-term business value.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl font-black text-blue-400">0{i+1}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-20 bg-[#07111e]" id="products">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-3">Our Products</p>
            <h2 className="text-4xl font-extrabold text-white">Intelligent Solutions for a Safer, Smarter, Connected Future</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p, i) => (
              <div key={i} className="group bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <p.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-white/50 mb-4 leading-relaxed">{p.desc}</p>
                <ul className="space-y-1.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-white/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20" id="services">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-3">Our Services</p>
            <h2 className="text-4xl font-extrabold text-white">Smarter IT Services for Secure, Scalable Enterprise Growth</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-8 hover:border-blue-500/30 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center mb-5">
                  <s.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-white/50 mb-5 leading-relaxed">{s.desc}</p>
                <ul className="space-y-2">
                  {s.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-[#07111e]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-3">Why Choose Us</p>
          <h2 className="text-4xl font-extrabold text-white mb-4">We Accept Nothing Less Than Transformation</h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto text-sm">NSBTEK is a globally certified tech leader delivering AI, IoT, cloud, and cybersecurity solutions, empowering industries with digital transformation.</p>
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { value: '98%', label: 'Client Satisfaction Rate' },
              { value: '500+', label: 'Projects Delivered' },
              { value: '33+', label: 'Years of Experience' },
              { value: '50+', label: 'Enterprise Clients' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <p className="text-4xl font-black text-blue-400 mb-2">{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
          <a href="#contact">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 h-auto rounded-xl font-semibold gap-2">
              Contact Us Today <ArrowRight className="w-4 h-4" />
            </button>
          </a>
        </div>
      </section>

      {/* NSBTEK CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/10 border border-blue-500/20 rounded-3xl p-12 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 mb-6">
              <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">NSBTek Platform</span>
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-4">Manage Your Workforce with NSBTEK</h2>
            <p className="text-white/60 mb-8 max-w-2xl mx-auto">Our AI-powered staffing platform for ATS, CRM, and Workforce management — built specifically for staffing agencies and enterprises.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
  onClick={handleLogin}
  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors"
>
  Login to NSBTEK Account
</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20 bg-[#07111e]" id="contact">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-3">Get In Touch</p>
              <h2 className="text-4xl font-extrabold text-white mb-4">We're just a message away from smarter solutions</h2>
              <p className="text-white/50 mb-8 text-sm">Reach out for a consultation, partnership, or to learn more about our AI solutions.</p>
              <div className="space-y-4">
                <a href="mailto:hr@nsbtek.com" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Email</p>
                    <p className="text-sm font-medium">hr@nsbtek.com</p>
                  </div>
                </a>
                <a href="tel:+918466022022" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Phone</p>
                    <p className="text-sm font-medium">+1 612-567-0908 / +91 970-437-3976</p>
                  </div>
                </a>
                <a href="https://in.linkedin.com/company/NSBTEK" target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 text-sm font-bold">in</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">LinkedIn</p>
                    <p className="text-sm font-medium">NSBTEK</p>
                  </div>
                </a>
              </div>
            </div>
            {/* Contact form */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input placeholder="First Name" value={contactForm.first_name}
                  onChange={e => setContactForm(p => ({ ...p, first_name: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 col-span-1" />
                <input placeholder="Last Name" value={contactForm.last_name}
                  onChange={e => setContactForm(p => ({ ...p, last_name: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
              </div>
              <input placeholder="Email ID" type="email" value={contactForm.email}
                onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 mb-4" />
              <input placeholder="Contact Number" value={contactForm.phone}
                onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 mb-4" />
              <textarea placeholder="Message" rows={4} value={contactForm.message}
                onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 mb-4 resize-none" />
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 h-auto font-semibold">
                Submit Message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Floating Chatbot */}

      {/* FOOTER */}
      <footer className="bg-[#030a14] border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <p className="font-bold text-sm text-white">NSBTEK</p>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">Elevate Efficiency with Scalable, Future-Ready IT Solutions that Accelerate Growth.</p>
          </div>
          <div>
  <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Quick Links</p>
  <a href="#top" className="block text-xs text-white/40 hover:text-white/70 mb-2 transition-colors">Home</a>
  <a href="#about" className="block text-xs text-white/40 hover:text-white/70 mb-2 transition-colors">About Us</a>
  <a href="#contact" className="block text-xs text-white/40 hover:text-white/70 mb-2 transition-colors">Contact Us</a>
</div>
          <div>
  <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Services</p>
  <a href="#services" className="block text-xs text-white/40 hover:text-white/70 mb-2 transition-colors">Cybersecurity</a>
  <a href="#services" className="block text-xs text-white/40 hover:text-white/70 mb-2 transition-colors">Security Operations Center</a>
  <a href="#services" className="block text-xs text-white/40 hover:text-white/70 mb-2 transition-colors">HR Consulting</a>
  <a href="#services" className="block text-xs text-white/40 hover:text-white/70 mb-2 transition-colors">AI Solutions</a>
</div>
          <div>
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Platform Login</p>
            <button
  onClick={handleLogin}
  className="block text-xs text-white/40 hover:text-white/70 mb-2 transition-colors"
>
  Login to NSBTEK
</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">Copyright © 2026 NSBTEK. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            {certifications.map(c => (
              <span key={c} className="text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">{c}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}