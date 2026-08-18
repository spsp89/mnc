import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 10) return "";
  return digits.length === 10 ? `91${digits}` : digits;
}

export function WhatsAppInquiryButton({
  phone,
  recipientName,
  message,
  label = "Enquire on WhatsApp",
  className,
}: {
  phone?: string;
  recipientName: string;
  message: string;
  label?: string;
  className?: string;
}) {
  const number = whatsappNumber(phone ?? "");
  if (!number) return null;

  return (
    <a
      className={cn("whatsapp-inquiry-button", className)}
      href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} with ${recipientName}`}
    >
      <MessageCircle size={17} />
      <span>{label}</span>
    </a>
  );
}
