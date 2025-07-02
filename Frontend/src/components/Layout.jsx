import React from "react";
import HomeNavbar from "./HomeNavbar";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => (
  <>
    <HomeNavbar />
      <main className="min-h-screen pt-16 pb-32">{children}</main>
    <Footer />
  </>
);

export default Layout;
