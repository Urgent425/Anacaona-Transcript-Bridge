//src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200 border-t border-white/5 px-6 py-12 text-sm">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-white font-semibold text-lg">
            Anacaona Transcript Bridge
          </div>
          <p className="text-slate-250 mt-3 text-[13px] leading-relaxed max-w-sm">
            In honor of Queen Anacaona, “The Golden Flower.” We exist so Haitian
            education can travel with Haitian people.
          </p>
        </div>

        <div>
          <div className="text-white font-semibold text-sm mb-3">
            Product
          </div>
          <ul className="space-y-2">
            <li>
              <a href="#how" className="hover:text-white">
                How it works
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-white">
                Pricing
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-white">
                Student login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-white font-semibold text-sm mb-3">
            Contact
          </div>
          <ul className="space-y-2">
            <li>
              <a
                href="mailto:onlinesupport@anacaonaservices.org"
                className="hover:text-white"
              >
                onlinesupport@anacaonaservices.org
              </a>
            </li>
            <li className="text-slate-600 text-[12px]">
             <a href="https://www.facebook.com/profile.php?id=61585449135917" target="_blank" rel="noopener noreferrer">
              <Facebook size={16} className="hover:text-slate-900 transition-colors" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <Twitter size={16} className="hover:text-slate-900 transition-colors" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <Instagram size={16} className="hover:text-slate-900 transition-colors" />
            </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 text-[12px] text-slate-400">
        <img
              className="h-16 w-auto object-contain"
              src="/img/Anacaona.jpg"
              alt="Anacaona Logo"
            />
        © {new Date().getFullYear()} Anacaona Transcript Bridge. All rights
        reserved.
      </div>
    </footer>
  );
}
