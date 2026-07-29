"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Filter,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Star,
  Stethoscope,
} from "lucide-react";

import { SiteHeader } from "./site-header";

type Doctor = {
  id: string;
  name: string;
  department: string;
  qualification: string;
  clinic: string;
  location: string;
  distance: string;
  fee: string;
  rating: string;
  experience: string;
  photo: string;
  phone: string;
  slots: string[];
  tags: string[];
};

const departments = ["All", "Cardiology", "Dermatology", "Orthopedics", "Pediatrics", "ENT", "General Medicine"];
const locations = ["All locations", "Mavoor Road", "Beach Road", "Palayam", "East Hill", "Nadakkavu", "Calicut Medical College"];

const doctors: Doctor[] = [
  {
    id: "arun-menon",
    name: "Dr. Arun Menon",
    department: "Cardiology",
    qualification: "MD, DM Cardiology",
    clinic: "BNC Heart Care",
    location: "Mavoor Road",
    distance: "1.8 km",
    fee: "Rs. 600",
    rating: "4.8",
    experience: "14 yrs",
    photo: "/mockup/im-doctor-cardiology.jpg",
    phone: "+919876543201",
    slots: ["Today 10:30 AM", "Today 12:15 PM", "Tomorrow 05:00 PM"],
    tags: ["Chest pain", "BP care", "ECG"],
  },
  {
    id: "meera-nair",
    name: "Dr. Meera Nair",
    department: "Dermatology",
    qualification: "MD Dermatology",
    clinic: "DermaGlow Clinic",
    location: "Beach Road",
    distance: "2.2 km",
    fee: "Rs. 500",
    rating: "4.7",
    experience: "9 yrs",
    photo: "/mockup/im-doctor-dermatology.jpg",
    phone: "+919876543202",
    slots: ["Today 03:00 PM", "Today 06:30 PM", "Tomorrow 11:45 AM"],
    tags: ["Skin rash", "Acne", "Hair care"],
  },
  {
    id: "ravindran-k",
    name: "Dr. K. Ravindran",
    department: "Orthopedics",
    qualification: "MS Orthopedics",
    clinic: "City Ortho Centre",
    location: "Palayam",
    distance: "1.4 km",
    fee: "Rs. 650",
    rating: "4.6",
    experience: "18 yrs",
    photo: "/mockup/im-doctor-orthopedics.jpg",
    phone: "+919876543203",
    slots: ["Today 04:15 PM", "Tomorrow 09:30 AM", "Tomorrow 01:00 PM"],
    tags: ["Joint pain", "Fracture", "Back pain"],
  },
  {
    id: "faizal-rahman",
    name: "Dr. Faizal Rahman",
    department: "Pediatrics",
    qualification: "MD Pediatrics",
    clinic: "LittleCare Child Clinic",
    location: "East Hill",
    distance: "3.1 km",
    fee: "Rs. 450",
    rating: "4.9",
    experience: "11 yrs",
    photo: "/mockup/im-doctor-pediatrics.jpg",
    phone: "+919876543204",
    slots: ["Today 05:20 PM", "Tomorrow 10:00 AM", "Tomorrow 06:00 PM"],
    tags: ["Child fever", "Vaccination", "Growth"],
  },
  {
    id: "vishnu-prasad",
    name: "Dr. Vishnu Prasad",
    department: "ENT",
    qualification: "MS ENT",
    clinic: "ClearSound ENT",
    location: "Nadakkavu",
    distance: "2.7 km",
    fee: "Rs. 550",
    rating: "4.5",
    experience: "8 yrs",
    photo: "/mockup/im-doctor-ent.jpg",
    phone: "+919876543205",
    slots: ["Today 11:45 AM", "Today 07:00 PM", "Tomorrow 04:30 PM"],
    tags: ["Ear pain", "Sinus", "Throat"],
  },
  {
    id: "susan-thomas",
    name: "Dr. Susan Thomas",
    department: "General Medicine",
    qualification: "MD General Medicine",
    clinic: "BNC Family Clinic",
    location: "Calicut Medical College",
    distance: "4.0 km",
    fee: "Rs. 400",
    rating: "4.8",
    experience: "16 yrs",
    photo: "/mockup/im-doctor-general.jpg",
    phone: "+919876543206",
    slots: ["Today 09:45 AM", "Today 02:30 PM", "Tomorrow 12:00 PM"],
    tags: ["Fever", "Diabetes", "Checkup"],
  },
];

export function DoctorBookingExperience() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [location, setLocation] = useState("All locations");
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});

  const filteredDoctors = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesQuery =
        !normalized ||
        [doctor.name, doctor.department, doctor.clinic, doctor.location, doctor.qualification, ...doctor.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesDepartment = department === "All" || doctor.department === department;
      const matchesLocation = location === "All locations" || doctor.location === location;

      return matchesQuery && matchesDepartment && matchesLocation;
    });
  }, [department, location, query]);

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="bg-[radial-gradient(circle_at_18%_12%,#164caa,#082d75_48%,#061f55_100%)]">
          <div className="mx-auto grid max-w-[1800px] gap-7 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:py-12">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">Health appointments</p>
              <h1 className="mt-3 max-w-[820px] text-[38px] font-black leading-[0.98] sm:text-[58px] lg:text-[72px]">
                Search Kozhikode doctors and book appointment slots
              </h1>
              <p className="mt-4 max-w-[680px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">
                Choose a department, filter by Kozhikode location, select a time slot, and send the appointment request directly on WhatsApp.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-[12px] font-bold text-white/84 sm:text-[14px]">
                <HeroStat icon={<Stethoscope className="h-5 w-5" />} text={`${doctors.length} doctors`} />
                <HeroStat icon={<MapPin className="h-5 w-5" />} text="Kozhikode locations" />
                <HeroStat icon={<CalendarDays className="h-5 w-5" />} text="Live slots" />
              </div>
            </div>
            <div data-motion="card" className="overflow-hidden rounded-[22px] border border-white/16 bg-white/10 p-3 shadow-[0_24px_55px_rgba(0,0,0,0.24)]">
              <div className="relative min-h-[280px] overflow-hidden rounded-[16px] bg-[#edf3ff] sm:min-h-[360px]">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/mockup/im-doctor-cardiology.jpg')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061f55]/82 via-[#061f55]/12 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[16px] border border-white/18 bg-white/12 p-4 backdrop-blur">
                  <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#f5b625]">Next available</p>
                  <h2 className="mt-1 text-[24px] font-black leading-tight text-white">Today 10:30 AM</h2>
                  <p className="mt-1 text-[13px] font-semibold text-white/82">Cardiology consultation at BNC Heart Care</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-16 pt-5 sm:px-5 md:px-10">
        <section data-motion="card" className="rounded-[18px] border border-[#dfe6f2] bg-white p-3 shadow-[0_14px_34px_rgba(11,47,116,0.07)] sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
            <label className="flex min-h-[54px] items-center gap-3 rounded-[14px] border border-[#dfe6f2] bg-[#f6f8fc] px-4">
              <Search className="h-5 w-5 shrink-0 text-[#71809b]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#0b2f74] outline-none placeholder:text-[#71809b]"
                placeholder="Search doctor, clinic, specialty, symptom"
              />
            </label>
            <label className="flex min-h-[54px] items-center gap-3 rounded-[14px] border border-[#dfe6f2] bg-[#f6f8fc] px-4">
              <MapPin className="h-5 w-5 shrink-0 text-[#71809b]" />
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[14px] font-black text-[#0b2f74] outline-none"
              >
                {locations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#edf3ff] px-3 py-2 text-[11px] font-black text-[#405474]">
              <Filter className="h-3.5 w-3.5" />
              Departments
            </span>
            {departments.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDepartment(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black sm:text-[12px] ${
                  department === item
                    ? "border-[#0b2f74] bg-[#0b2f74] text-white"
                    : "border-[#dfe6f2] bg-white text-[#405474]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[24px] font-black leading-tight sm:text-[30px]">Available doctors</h2>
            <p className="mt-1 text-[13px] font-semibold text-[#71809b]">
              {filteredDoctors.length} doctor{filteredDoctors.length === 1 ? "" : "s"} found for appointment booking.
            </p>
          </div>
          <div className="rounded-full bg-[#fff4d6] px-4 py-2 text-[12px] font-black text-[#9b6800]">
            WhatsApp request sends selected slot
          </div>
        </div>

        {filteredDoctors.length > 0 ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                selectedSlot={selectedSlots[doctor.id] ?? doctor.slots[0]}
                onSelectSlot={(slot) => setSelectedSlots((current) => ({ ...current, [doctor.id]: slot }))}
              />
            ))}
          </div>
        ) : (
          <div data-motion="card" className="mt-4 rounded-[18px] border border-[#dfe6f2] bg-white p-8 text-center shadow-[0_12px_28px_rgba(11,47,116,0.05)]">
            <h3 className="text-[20px] font-black">No doctors found</h3>
            <p className="mx-auto mt-2 max-w-[460px] text-[13px] font-semibold leading-6 text-[#71809b]">
              Try another department, remove the location filter, or search by clinic name.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function DoctorCard({
  doctor,
  selectedSlot,
  onSelectSlot,
}: {
  doctor: Doctor;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
}) {
  const message = `Hello ${doctor.name}, I would like to book an appointment for ${doctor.department} at ${doctor.clinic}, ${doctor.location}. Preferred slot: ${selectedSlot}.`;
  const whatsappHref = `https://wa.me/${doctor.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  const phoneHref = `tel:${doctor.phone}`;

  return (
    <article data-motion="card" className="overflow-hidden rounded-[18px] border border-[#dfe6f2] bg-white shadow-[0_14px_32px_rgba(11,47,116,0.07)]">
      <div className="grid grid-cols-[118px_1fr] gap-3 p-3 sm:grid-cols-[144px_1fr] sm:p-4">
        <div className="relative min-h-[164px] overflow-hidden rounded-[14px] bg-[#edf3ff]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${doctor.photo}')` }} />
          <div className="absolute inset-x-2 bottom-2 rounded-full bg-white/92 px-2 py-1 text-center text-[11px] font-black text-[#0b2f74]">
            {doctor.experience}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#1E9FB8]">{doctor.department}</p>
              <h3 className="mt-1 truncate text-[19px] font-black leading-tight text-[#0b2f74]">{doctor.name}</h3>
              <p className="mt-1 truncate text-[12px] font-bold text-[#71809b]">{doctor.qualification}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff4d6] px-2 py-1 text-[11px] font-black text-[#9b6800]">
              <Star className="h-3.5 w-3.5 fill-[#f5b625] text-[#f5b625]" />
              {doctor.rating}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-[12px] font-bold text-[#596a82]">
            <p className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#0b2f74]" />
              {doctor.clinic}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#f5b625]" />
              {doctor.location} - {doctor.distance}
            </p>
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#25a451]" />
              Consultation {doctor.fee}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {doctor.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#edf3ff] px-2 py-1 text-[10.5px] font-black text-[#405474]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#edf1f7] px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
        <p className="text-[12px] font-black text-[#0b2f74]">Appointment slots</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {doctor.slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelectSlot(slot)}
              className={`rounded-[12px] border px-3 py-2 text-left text-[11px] font-black ${
                selectedSlot === slot
                  ? "border-[#0b2f74] bg-[#0b2f74] text-white"
                  : "border-[#dfe6f2] bg-[#f8fafd] text-[#405474]"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
          <a href={phoneHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe6f2] bg-white px-3 py-2.5 text-[12px] font-black text-[#0b2f74]">
            <Phone className="h-4 w-4" />
            Call
          </a>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2.5 text-[12px] font-black text-white">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

function HeroStat({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-2">
      <span className="text-[#f5b625]">{icon}</span>
      {text}
    </span>
  );
}
