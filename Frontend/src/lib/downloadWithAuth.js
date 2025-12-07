//src/lib/downloadWithAuth.js

export async function downloadWithAuth(url, fallbackName = "file.pdf", getToken = () => localStorage.getItem("token")) {
  const token = getToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Download failed (${res.status}) ${text?.slice(0,150) || ""}`);
  }

  // Try to get filename from Content-Disposition
  let filename = fallbackName;
  const cd = res.headers.get("content-disposition") || "";
  const m = cd.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i);
  if (m) filename = decodeURIComponent(m[1] || m[2] || filename);

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
