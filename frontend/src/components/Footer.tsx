import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    // bg-[#0891b2] is the Hex code that closely matches your "Dashboard" sidebar button (Cyan-600)
    <footer className="w-full bg-[#0891b2] py-6 mt-auto border-t border-[#155e75]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white">

          {/* Left Side: Brand & Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
            {/* <span className="font-bold text-lg tracking-wide">Hotel Management System</span> */}

            <span className="text-cyan-50 opacity-90">© 2024 Hotel Management System . All rights reserved.</span>
          </div>

          {/* Right Side: Links & Company Info */}
          <div className="flex flex-col md:flex-row items-center gap-6">

            {/* Navigation Links */}
            <div className="flex gap-4">
              <Link to="#" className="hover:text-cyan-200 transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-cyan-200 transition-colors">Terms & Conditions</Link>
            </div>

            {/* Designed By Section with Logo */}
            <div className="flex items-center gap-2 bg-[#0e7490] px-3 py-1 rounded-full border border-cyan-500/30 shadow-sm">
              <span className="text-xs text-cyan-50 opacity-90">Designed by:</span>
              <div className="flex items-center gap-2">
                <img
                  src="images/HLS-Logo.png"
                  alt="Company Logo"
                  className="w-8 h-8"
                />
                <a
                  href="https://hithlakshsolutions.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white hover:text-cyan-200 transition-colors"
                >
                  Hithlaksh Solutions Private Limited
                </a>
              </div>


            </div>



          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;