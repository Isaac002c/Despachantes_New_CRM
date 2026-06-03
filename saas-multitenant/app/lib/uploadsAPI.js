const getToken = () => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth-token') ||
    document.cookie.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=');
      return acc || (/^(token|auth-token)$/.test(k) ? v : '');
    }, '')
  );
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    credentials: 'include',
    body: formData,
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(text).error || msg; } catch { msg = text || msg; }
    throw new Error(msg);
  }

  return JSON.parse(text).data; // { url, filename, originalName, mimeType, size }
};
