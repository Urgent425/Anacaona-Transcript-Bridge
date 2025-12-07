// src/hooks/useAdminPerms.js
import { useEffect, useState } from "react";

export default function useAdminPerms() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setMe(data);
      } catch (e) {
        console.error("useAdminPerms /me failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const role = me?.role;
  const canSelfAssign     = role === "SuperAdmin" || role === "Translator";
  const canAssignToOthers = role === "SuperAdmin";

  return { me, role, loading, canSelfAssign, canAssignToOthers };
}
