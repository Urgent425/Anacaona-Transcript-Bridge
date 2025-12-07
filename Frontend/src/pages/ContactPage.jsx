import React, { useState } from "react";

const ContactPage = () => {
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const res = await fetch("https://formspree.io/f/xpwrjqea", {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      setStatus("Thanks for reaching out!");
      e.target.reset();
    } else {
      setStatus("Oops! Something went wrong.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold text-center mb-6">Contact Us</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="name" placeholder="Your name" required className="w-full border p-2 rounded" />
        <input type="email" name="email" placeholder="Your email" required className="w-full border p-2 rounded" />
        <textarea name="message" placeholder="Your message" required rows="5" className="w-full border p-2 rounded"></textarea>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send Message</button>
        <p className="text-green-600">{status}</p>
      </form>
    </div>
  );
};

export default ContactPage;