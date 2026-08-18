import { Mail, MapPin, Send, Smartphone } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";

const groups = [
  {
    title: "Popular categories",
    links: [
      ["Restaurants", "/search?q=Restaurants&radius=5"],
      ["Doctors & clinics", "/search?q=Doctors&radius=5"],
      ["Home services", "/search?q=Home+services&radius=5"],
      ["Beauty & wellness", "/search?q=Beauty&radius=5"],
      ["Electronics", "/search?q=Electronics&radius=5"],
    ],
  },
  {
    title: "Popular locations",
    links: [
      ["Kochi", "/kochi"],
      ["Kozhikode", "/kozhikode"],
      ["Thiruvananthapuram", "/thiruvananthapuram"],
      ["Thrissur", "/thrissur"],
      ["Kannur", "/kannur"],
    ],
  },
  {
    title: "For businesses",
    links: [
      ["List your business", "/business/add"],
      ["Claim a listing", "/business/claim"],
      ["Subscription plans", "/pricing"],
      ["Post a job", "/business/jobs"],
      ["Business Club", "/business/club"],
    ],
  },
  {
    title: "Support & legal",
    links: [
      ["About BNC", "/about"],
      ["Contact", "/contact"],
      ["Help centre", "/help"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Refunds", "/refunds"],
      ["Report abuse", "/report-abuse"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand-column">
          <Brand href="/" homeLabel="BNC home" />
          <p>Trusted local discovery for the people and businesses that make every neighbourhood work.</p>
          <div className="footer-contact">
            <Link href="/contact"><Mail size={16} /> Contact BNC support</Link>
            <span><MapPin size={16} /> Serving Kerala</span>
          </div>
        </div>
        {groups.map((group) => (
          <div className="footer-group" key={group.title}>
            <h3>{group.title}</h3>
            {group.links.map(([label, href]) => (
              <Link href={href} key={href}>{label}</Link>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-connect">
        <div className="footer-newsletter">
          <div><span><Send size={18} /></span><div><h3>Useful local updates</h3><p>New offers, trusted businesses and BNC community news—sent thoughtfully.</p></div></div>
          <p>Subscription controls will appear after mailing preferences are connected to the production backend.</p>
        </div>
        <div className="footer-app-links">
          <div><Smartphone size={20} /><span><strong>BNC mobile app</strong><small>Coming soon for Android and iPhone</small></span></div>
          <Link href="/app"><small>Learn about</small><strong>The BNC app</strong></Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 BNC — Business Network Community.</span>
        <span>Built for Kerala · English</span>
      </div>
    </footer>
  );
}
