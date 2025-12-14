// src/components/admin/CreateInstitutionForm.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";

export default function CreateInstitutionForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/institutions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name, contactEmail: email, contactPhone: phone, address }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || "Failed to create");
      }
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add Institution</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Institution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="default">
              Create
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
