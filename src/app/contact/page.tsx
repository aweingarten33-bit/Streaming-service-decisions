import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact · Marquee",
  description: "Get in touch with the Marquee team.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <ContactForm />
    </div>
  );
}
