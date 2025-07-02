import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-8">
  <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div className="flex items-center gap-4">
      <img
        className="h-16 w-auto object-contain"
        src="/img/Anacaona.jpg"
        alt="Anacaona Logo"
      />
      <p className="text-sm">
        &copy; {new Date().getFullYear()} Anacaona Transcript Bridge
        <br />
        All rights reserved.
      </p>
    </div>
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-center md:text-right">
      <Link to="/terms" className="underline hover:text-gray-300">
        Terms of Service
      </Link>
      <Link to="/privacy" className="underline hover:text-gray-300">
        Privacy Policy
      </Link>
      <div className="flex justify-center md:justify-end gap-3 mt-2 md:mt-0">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
          <svg
            className="w-5 h-5 fill-current hover:text-blue-400"
            viewBox="0 0 24 24"
          >
            <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0022 12z" />
          </svg>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <svg
            className="w-5 h-5 fill-current hover:text-blue-300"
            viewBox="0 0 24 24"
          >
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 001.88-2.38 8.62 8.62 0 01-2.73 1.05 4.28 4.28 0 00-7.3 3.9A12.14 12.14 0 013 4.8a4.28 4.28 0 001.32 5.72 4.25 4.25 0 01-1.94-.54v.05a4.28 4.28 0 003.43 4.2 4.3 4.3 0 01-1.93.07 4.28 4.28 0 004 3 8.58 8.58 0 01-6.32 1.77 12.1 12.1 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.2v-.56A8.64 8.64 0 0022.46 6z" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</footer>
    );
 };

export default Footer;