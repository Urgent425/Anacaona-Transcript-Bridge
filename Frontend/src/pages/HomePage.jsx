import React from "react";
import { Link } from "react-router-dom";
import HomeNavbar from "../components/HomeNavbar";

export default function HomePage() {
  return (
    <div className="font-sans text-gray-800">
      {/* ===== NAVBAR ===== */}
      <HomeNavbar />

      {/* ===== HERO SECTION ===== */}
      <section className="min-h-screen bg-blue-50 flex items-center justify-center text-center px-8 pt-32">
        
        <div> 
          
          <h1 className="text-4xl font-bold text-blue-900">Bridge the Gap Between Your Education and Your Future</h1>
          <p className="mt-4 text-lg text-gray-700">Submit transcripts from Haiti. Reach global recognition with ease.</p>
          <Link to="/register" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Get Started
          </Link>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section id="mission" className="py-16 px-8 bg-white">
        <h2 className="text-3xl font-bold text-center mb-4">Our Mission</h2>
        <p className="text-center max-w-2xl mx-auto text-gray-700">
          To empower students from Haiti by providing a seamless, transparent, and reliable platform to submit their academic transcripts for international recognition.
        </p>
        <h3 className="text-2xl font-semibold text-center mt-8">Our Vision</h3>
        <p className="text-center max-w-2xl mx-auto text-gray-700">
          A world where educational opportunities are not limited by borders or bureaucracy.
        </p>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="services" className="bg-gray-100 py-16 px-8">
        <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white shadow p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Transcript Upload</h3>
            <p className="text-gray-600">Easily upload and verify your academic transcripts.</p>
          </div>
          <div className="bg-white shadow p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Translate your documents</h3>
            <p className="text-gray-600">We offer the translation services to make your life easier.</p>
          </div>
          <div className="bg-white shadow p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">WES Integration</h3>
            <p className="text-gray-600">We send your documents to credential evaluation services like WES.</p>
          </div>
          <div className="bg-white shadow p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Institution Portal</h3>
            <p className="text-gray-600">Schools can manage and track transcript requests directly.</p>
          </div>
        </div>
      </section>

      {/* ===== NEWS ===== */}
      <section id="news" className="bg-white py-16 px-8">
        <h2 className="text-2xl font-bold text-center mb-6">News & Announcements</h2>
        <ul className="space-y-4 text-center max-w-3xl mx-auto">
          <li><strong>May 2025:</strong> Partnered with Haitian Ministry of Education for data access.</li>
          <li><strong>June 2025:</strong> First 100 students successfully submitted transcripts to WES.</li>
          <li><strong>Coming Soon:</strong> Multilingual support for Creole, spanish and French.</li>
        </ul>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="bg-blue-50 py-16 px-8">
        <h2 className="text-2xl font-bold text-center mb-4">Contact Us</h2>
        <p className="text-center text-gray-700 mb-6">Need help? Email us at <a href="mailto:support@anacaonabridge.org" className="text-blue-600 underline">support@anacaonabridge.org</a></p>
        <div className="flex justify-center space-x-6">
          <a href="#" className="text-blue-600 hover:underline">Facebook</a>
          <a href="#" className="text-blue-600 hover:underline">Twitter</a>
          <a href="#" className="text-blue-600 hover:underline">Instagram</a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-800 text-white py-6 text-center">
      <article className="clearfix px-4 max-w-4xl mx-auto text-center">
        <img
          className="h-20 w-40 object-contain float-left"
          src="/img/anacaona.jpg"
          alt="Anacaona Logo"
        />
        <p>&copy; {new Date().getFullYear()} Anacaona Transcript Bridge. All rights reserved.</p>
        <div className="mt-2 text-sm">
          <Link to="/terms" className="underline mx-2">Terms of Service</Link>
          <Link to="/privacy" className="underline mx-2">Privacy Policy</Link>
        </div>
      </article>
</footer>
    </div>
  );
}