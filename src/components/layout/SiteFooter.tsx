import { useSettings } from "@/lib/settings-store";
import { MapPin, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

export function SiteFooter() {
  const s = useSettings();
  if (!s) return null;
  return (
    <motion.footer
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mx-4 mt-4 mb-4 rounded-3xl bg-primary text-primary-foreground p-6"
    >
      <h3 className="text-lg text-center mb-4 font-bold">تواصل معنا</h3>
      <ul className="space-y-3 text-sm">
        {s.contact_location && (
          <li className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 opacity-80" /> <span>{s.contact_location}</span>
          </li>
        )}
        {s.contact_phone && (
          <li className="flex items-center gap-3">
            <Phone className="size-4 shrink-0 opacity-80" /> <a href={`tel:${s.contact_phone}`} dir="ltr" className="hover:underline">{s.contact_phone}</a>
          </li>
        )}
        {s.contact_email && (
          <li className="flex items-center gap-3">
            <Mail className="size-4 shrink-0 opacity-80" /> <a href={`mailto:${s.contact_email}`} className="hover:underline">{s.contact_email}</a>
          </li>
        )}
      </ul>
    </motion.footer>
  );
}
