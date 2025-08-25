import React, { useState } from "react";

export default function EmailForm() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message })
      });
      const data = await res.json();

      if (data.success) {
        setStatus("✅ Email sent successfully!");
      } else {
        setStatus("❌ Failed: " + data.error);
      }
    } catch (err: any) {
      setStatus("❌ Error: " + (err?.message || String(err)));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSend}
        className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-gray-800">Send Test Email</h2>

        <input
          type="email"
          placeholder="Recipient Email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />

        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />

        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded-lg p-2 h-32"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Send Email
        </button>

        {status && <p className="text-sm text-gray-700 mt-2">{status}</p>}
      </form>
    </div>
  );
}
