import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const ContactPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const res = await fetch("https://formspree.io/f/maqrgkez", {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      setStatus(t("contact.success"));
      e.target.reset();
    } else {
      setStatus(t("contact.error"));
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold text-center mb-6">{t("contact.title")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="name" placeholder={t("contact.namePlaceholder")} required className="w-full border p-2 rounded" />
        <input type="email" name="email" placeholder={t("contact.emailPlaceholder")} required className="w-full border p-2 rounded" />
        <textarea name="message" placeholder={t("contact.messagePlaceholder")} required rows="5" className="w-full border p-2 rounded"></textarea>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{t("contact.send")}</button>
        <p className="text-green-600">{status}</p>
      </form>
    </div>
  );
};

export default ContactPage;