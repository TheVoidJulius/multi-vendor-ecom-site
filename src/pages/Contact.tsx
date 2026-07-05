import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <Layout>
      <div className="container-premium py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-headline text-foreground text-center mb-2">Get in Touch</h1>
          <p className="text-body-large text-center mb-12">
            We'd love to hear from you. Send us a message and we'll respond within 24 hours.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 rounded-2xl bg-secondary/50">
              <Mail className="h-6 w-6 mx-auto text-accent mb-3" />
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground mt-1">hello@veloura.com</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-secondary/50">
              <Phone className="h-6 w-6 mx-auto text-accent mb-3" />
              <p className="text-sm font-medium text-foreground">Phone</p>
              <p className="text-sm text-muted-foreground mt-1">+1 (555) 000-0000</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-secondary/50">
              <MapPin className="h-6 w-6 mx-auto text-accent mb-3" />
              <p className="text-sm font-medium text-foreground">Address</p>
              <p className="text-sm text-muted-foreground mt-1">San Francisco, CA</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium" placeholder="Your Name" required />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-premium" placeholder="Your Email" required />
            </div>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-premium min-h-[150px] resize-none" placeholder="Your Message" required />
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
