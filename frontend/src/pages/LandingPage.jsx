import React, { useRef, useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import CircularGallery from "../components/CircularGallery";
import IndianArchitectureArtwork from "../components/IndianArchitectureArtwork";
import BrandLogo from "../components/BrandLogo";
import LandlordProfileModal from "../components/LandlordProfileModal";
import { DUMMY_PROPERTIES } from "../data/dummyProperties";
import { api } from "../api/client";

function mrfParseHeading(src) {
  return src.split("\n").map((line) => {
    const words = [];
    line.split("*").forEach((seg, k) => {
      for (const w of seg.split(/\s+/)) if (w) words.push({ text: w, accent: k % 2 === 1 });
    });
    return words;
  });
}

const MRF_HERO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');

.mrf-root {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  background: linear-gradient(180deg, #FAF8F4 0%, #F5F0E6 50%, #EFE9DC 100%);
  color: #0f172a;
  font-family: var(--mrf-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.mrf-sun-glow {
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  width: min(1100px, 95vw);
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(254, 243, 199, 0.45) 0%, rgba(250, 248, 244, 0.15) 50%, rgba(250, 248, 244, 0) 75%);
  pointer-events: none;
  z-index: 0;
}
.mrf-hero {
  position: relative;
  z-index: 10;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: clamp(75px, 11vh, 120px) 20px 0;
  text-align: center;
  transform: translate3d(0, 0, 0);
}
.mrf-h {
  margin: 0;
  max-width: 18ch;
  font-family: var(--mrf-sans);
  font-weight: 600;
  font-size: clamp(34px, 5.2vw, 76px);
  line-height: 1.08;
  letter-spacing: -0.038em;
  color: #0f172a;
  text-wrap: balance;
}
.mrf-line { display: block; white-space: normal; }
.mrf-w {
  display: inline-block;
  overflow: hidden;
  padding: 0.04em 0.06em 0.14em;
  margin: -0.04em -0.06em -0.14em;
  vertical-align: top;
}
.mrf-wi {
  display: inline-block;
  transform: none;
  transition: transform 900ms cubic-bezier(.16, 1, .3, 1);
}
.mrf-acc .mrf-wi {
  font-family: var(--mrf-serif);
  font-style: italic;
  font-weight: 400;
  font-size: 1.14em;
  letter-spacing: -0.02em;
  color: #1F2D2B;
  padding-right: 0.06em;
}
.mrf-sub {
  margin: clamp(14px, 2vh, 22px) 0 0;
  max-width: 52ch;
  font-size: clamp(14px, 1.2vw, 17px);
  line-height: 1.55;
  letter-spacing: -0.01em;
  color: #475569;
  font-weight: 450;
}
.mrf-cta-wrap { margin-top: clamp(22px, 3.2vh, 36px); }
.mrf-cta {
  --mx: 0px;
  --my: 0px;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 10px 0 24px;
  border-radius: 999px;
  background: #1F2D2B;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 12px 32px -10px rgba(31, 45, 43, 0.45);
  transform: translate3d(var(--mx), var(--my), 0);
  transition: transform 450ms cubic-bezier(.2, .9, .3, 1.2), box-shadow 350ms ease;
  cursor: pointer;
}
.mrf-cta::before {
  content: "";
  position: absolute;
  left: var(--fx, 50%);
  top: var(--fy, 50%);
  width: 280px;
  height: 280px;
  margin: -140px 0 0 -140px;
  border-radius: 50%;
  background: #10B981;
  transform: scale(0);
  transition: transform 600ms cubic-bezier(.16, 1, .3, 1);
}
.mrf-cta > * { position: relative; }
.mrf-cta-arrow {
  position: relative;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  overflow: hidden;
  transition: background 300ms ease;
}
.mrf-cta-arrow svg { grid-area: 1 / 1; transition: transform 450ms cubic-bezier(.65, 0, .25, 1); }
.mrf-cta-arrow .mrf-a2 { transform: translate(-150%, 150%); }
.mrf-cta:hover::before { transform: scale(1); }
.mrf-cta:hover .mrf-cta-arrow { background: #ffffff; color: #1F2D2B; }
.mrf-cta:hover .mrf-a1 { transform: translate(150%, -150%); }
.mrf-cta:hover .mrf-a2 { transform: none; }

/* Warm Architectural Light Grid Background with Champagne & Amber Glow */
.dg-light-grid-canvas {
  background-color: #FAF8F5;
  background-image: 
    radial-gradient(ellipse 1100px 850px at 85% 12%, rgba(245, 230, 211, 0.5) 0%, rgba(254, 243, 199, 0.25) 45%, transparent 75%),
    radial-gradient(ellipse 900px 750px at 10% 45%, rgba(240, 235, 224, 0.35) 0%, transparent 65%),
    radial-gradient(ellipse 1100px 850px at 88% 75%, rgba(245, 230, 211, 0.45) 0%, rgba(254, 243, 199, 0.2) 45%, transparent 75%),
    linear-gradient(to right, rgba(120, 113, 108, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(120, 113, 108, 0.05) 1px, transparent 1px);
  background-size: auto, auto, auto, 48px 48px, 48px 48px;
  background-repeat: no-repeat, no-repeat, no-repeat, repeat, repeat;
}
`;

const INSPECTION_SUITES_DATA = [
  {
    id: "bedroom",
    name: "Bedroom Suite",
    icon: "🛏️",
    color: "indigo",
    bgGradient: "from-indigo-50/90 via-white to-purple-50/40",
    border: "border-indigo-200 hover:border-indigo-400",
    accent: "text-indigo-800 bg-indigo-50 border-indigo-200",
    badge: "5 Core Checks",
    highlight: "Corner Panoramas",
    desc: "Walls, bed frame, mattress, wardrobes, fan & switches.",
    items: [
      { title: "Full Room Panoramic Corner Shots", note: "Wide panoramic shots from opposite corners covering floor, walls, and ceiling" },
      { title: "Walls, Ceiling, Paint & Moulding", note: "Inspect for nail holes, dampness, peeling paint, stains, or ceiling cracks" },
      { title: "Doors, Windows, Mesh & Curtains", note: "Check door locks, hinges, window glass, mosquito mesh, and curtain rods" },
      { title: "Flooring, Wardrobes & Furniture", note: "Bed frame, mattress condition, wardrobe shelves/drawers, and tile scratches" },
      { title: "Electrical Switches, Fan & Sockets", note: "Ceiling fan speed/noise, lights, AC switchpoint, and socket functionality" }
    ]
  },
  {
    id: "bathroom",
    name: "Bathroom Suite",
    icon: "🚿",
    color: "cyan",
    bgGradient: "from-cyan-50/90 via-white to-blue-50/40",
    border: "border-cyan-200 hover:border-cyan-400",
    accent: "text-cyan-800 bg-cyan-50 border-cyan-200",
    badge: "Plumbing & Tiles",
    highlight: "Water Seepage Test",
    desc: "Tiles, drainage slope, geyser test, WC flush & taps.",
    items: [
      { title: "Bathroom Wide Panoramic View", note: "Wide shot showing overall bathroom layout, tiles, floor slope, and ceiling" },
      { title: "Tiles, Floor Slope & Drainage", note: "Inspect for cracked tiles, wall dampness, drainage slope, and drain trap blockages" },
      { title: "Sanitaryware (WC, Basin & Faucet)", note: "Ceramic toilet pot, flush cistern, washbasin, health faucet jet, and trap leaks" },
      { title: "Taps, Shower & Water Pressure", note: "Hot/cold mixer, angle valves, showerhead flow, and general water pressure" },
      { title: "Geyser / Water Heater & Exhaust", note: "Water heater operation, power indicator, tank/hose drips, and exhaust suction" }
    ]
  },
  {
    id: "kitchen",
    name: "Kitchen Suite",
    icon: "🍳",
    color: "amber",
    bgGradient: "from-amber-50/90 via-white to-orange-50/40",
    border: "border-amber-200 hover:border-amber-400",
    accent: "text-amber-800 bg-amber-50 border-amber-200",
    badge: "Modular & Gas",
    highlight: "RO & Gas Points",
    desc: "Countertop chips, sink drainage, cabinets, chimney & hob.",
    items: [
      { title: "Kitchen Panoramic Overview", note: "Wide shot capturing platform counter, cabinets, sink area, and ventilation" },
      { title: "Granite Countertop & Backsplash", note: "Inspect for countertop edge chips, hairline cracks, heat burns, and grease" },
      { title: "Modular Cabinets & Storage", note: "Cabinet doors, soft-close hinges, internal shelving, and under-sink swelling" },
      { title: "Kitchen Sink, Taps & Drainage", note: "Stainless steel sink stains, faucet swivel, coupling leak, and waste drain flow" },
      { title: "Chimney, Gas Hob & RO Purifier", note: "Chimney suction, gas burner knobs/hose, RO purifier power and water dispensing" }
    ]
  },
  {
    id: "living",
    name: "Living Area",
    icon: "🛋️",
    color: "emerald",
    bgGradient: "from-emerald-50/90 via-white to-teal-50/40",
    border: "border-emerald-200 hover:border-emerald-400",
    accent: "text-emerald-800 bg-emerald-50 border-emerald-200",
    badge: "Security & Balcony",
    highlight: "Entrance Lock Proof",
    desc: "Flooring, sofa, false ceiling, balcony railing & door locks.",
    items: [
      { title: "Living & Dining Room Panoramic", note: "Wide panoramic shot from entrance showing hall, dining area, ceiling, and flooring" },
      { title: "Walls, Ceiling, Lighting & False Ceiling", note: "Paint condition, TV mount holes, ceiling fans, cove lights, and switchboards" },
      { title: "Main Entrance Door & Security Fixtures", note: "Main door lock, deadbolt, keys, peephole, security latch, and video bell" },
      { title: "Hall Furniture (Sofa & Dining)", note: "Sofa upholstery, cushions, dining table and chairs, TV credenza condition" },
      { title: "Balcony Railing, Flooring & Drainage", note: "Balcony floor tiles, slope, rainwater drain trap, safety railing rigidity" }
    ]
  },
  {
    id: "appliances",
    name: "Appliances & Meters",
    icon: "⚡",
    color: "rose",
    bgGradient: "from-rose-50/90 via-white to-amber-50/40",
    border: "border-rose-200 hover:border-rose-400",
    accent: "text-rose-800 bg-rose-50 border-rose-200",
    badge: "High Priority Proof",
    highlight: "Meter Dial Mandatory",
    desc: "Electricity kWh dial, water meters, AC cooling, fridge.",
    items: [
      { title: "Electricity Meter (Move-In Reading)", note: "Photograph meter dial showing exact kWh reading and serial number" },
      { title: "Water & Piped Gas Meter Readings", note: "Photograph water meter and piped gas (PNG) counter reading if applicable" },
      { title: "Air Conditioners & Remotes (Cooling)", note: "Test cooling on 18C, swing louvers, remote control display, and coil cleanliness" },
      { title: "Refrigerator & Washing Machine", note: "Fridge cooling, freezer, door gasket; washing machine drum, hoses, and spin cycle" },
      { title: "Main Distribution Board & Inverter", note: "ELCB/RCCB trip switches, MCB box, inverter battery water level, and backup" },
      { title: "Pre-existing Inoperative Devices Notice", note: "Explicitly document any appliance or electrical item provided broken" }
    ]
  }
];

export default function LandingPage({ onNavigate }) {
  const { user, switchRole } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate("landing");
  };

  // Property exploration state
  const [properties, setProperties] = useState(DUMMY_PROPERTIES);
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular_nearest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropertyModal, setSelectedPropertyModal] = useState(null);
  const [selectedLandlordModal, setSelectedLandlordModal] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(null);
  const [userListedCount, setUserListedCount] = useState(0);
  const [selectedSuiteIndex, setSelectedSuiteIndex] = useState(0);

  const handleOpenLandlordProfile = (prop) => {
    if (!prop) return;
    const isCurrentUser = prop.isUserListed || (user && prop.landlord_id === user.id);
    const name = prop.landlord_name || (isCurrentUser ? (user?.full_name || "Aayush Raj (You)") : "Verified Landlord");
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");

    const knownLandlords = {
      "col. rajiv sharma (retd.)": {
        email: "rajiv.sharma.defence@gmail.com",
        phone: "+91 98451 22910",
        bio: "Retired Indian Army Veteran with 2 prime properties in Indiranagar. Committed to transparent, dispute-free tenancies under MTA 2021.",
        reviewsCount: 38,
        memberSince: "2022",
        propertiesCount: 2
      },
      "dr. anita deshmukh": {
        email: "anita.deshmukh.blr@gmail.com",
        phone: "+91 98802 34190",
        bio: "Healthcare professional & homeowner in Koramangala. All leases use DepositGuard SHA-256 baselines to protect both tenant & owner.",
        reviewsCount: 26,
        memberSince: "2023",
        propertiesCount: 1
      },
      "vikramaditya hegde": {
        email: "vikram.hegde.bandra@gmail.com",
        phone: "+91 98200 88410",
        bio: "Architect & property owner in Bandra West. Believes in strict adherence to fair wear & tear standards.",
        reviewsCount: 42,
        memberSince: "2021",
        propertiesCount: 3
      },
      "priya nair": {
        email: "priya.nair.hsr@gmail.com",
        phone: "+91 97410 65320",
        bio: "Product designer in HSR Layout hosting boutique studios for tech founders and professionals.",
        reviewsCount: 19,
        memberSince: "2023",
        propertiesCount: 1
      },
      "sunil kothari": {
        email: "sunil.kothari.dlf@gmail.com",
        phone: "+91 98110 54321",
        bio: "Cyber City corporate executive renting park-facing luxury apartments in DLF Phase 2.",
        reviewsCount: 31,
        memberSince: "2022",
        propertiesCount: 2
      },
      "meera krishnan": {
        email: "meera.krishnan.powai@gmail.com",
        phone: "+91 98330 98765",
        bio: "Long-time Powai resident managing family properties in Hiranandani Gardens.",
        reviewsCount: 29,
        memberSince: "2022",
        propertiesCount: 2
      }
    };

    const key = name.toLowerCase().trim();
    const known = knownLandlords[key] || {};

    const landlordData = {
      name: name,
      email: isCurrentUser
        ? (user?.email || "aayush.raj@gmail.com")
        : (prop.landlord_email || known.email || `${cleanName || "landlord"}@gmail.com`),
      phone: isCurrentUser
        ? (user?.phone || "+91 98450 12890")
        : (prop.landlord_phone || known.phone || "+91 98450 91823"),
      rating: prop.landlord_rating || (isCurrentUser ? 5.0 : 4.9),
      reviewsCount: isCurrentUser ? 12 : (known.reviewsCount || 24),
      city: prop.city || "Bangalore",
      locality: prop.locality || prop.city || "Indiranagar",
      propertiesCount: isCurrentUser ? Math.max(1, userListedCount) : (known.propertiesCount || 1),
      memberSince: isCurrentUser ? "2024" : (known.memberSince || "2023"),
      bio: isCurrentUser
        ? "Verified Property Owner on DepositGuard. Enforcing Model Tenancy Act principles with tamper-evident Day-1 move-in baselines."
        : (known.bio || `Verified landlord on DepositGuard managing properties in ${prop.city || "India"}. Prompt response and MTA 2021 compliant deposit guarantees.`),
      isCurrentUser
    };

    setSelectedLandlordModal({
      landlord: landlordData,
      property: prop
    });
  };

  // Load explore properties from backend & localStorage, merging with dummy listings
  useEffect(() => {
    let isMounted = true;
    const loadProperties = async () => {
      try {
        const backendProps = await api.getExploreProperties().catch(() => []);
        let localProps = [];
        try {
          localProps = JSON.parse(localStorage.getItem("depositguard_user_properties") || "[]");
        } catch {
          localProps = [];
        }

        const combinedUserProps = [...localProps];
        (backendProps || []).forEach((bp) => {
          if (!combinedUserProps.some((lp) => lp.id === bp.id)) {
            combinedUserProps.push(bp);
          }
        });

        const fallbackImages = [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80"
        ];

        const enrichedUserProps = combinedUserProps.map((p, idx) => ({
          id: p.id,
          title: p.title || "Custom Listed Apartment",
          property_type: p.property_type ? p.property_type.toUpperCase() : "APARTMENT",
          bhk: p.bhk || (p.property_type === "pg" ? "1 RK" : "2 BHK"),
          rent: p.rent || 32000,
          deposit: p.deposit || 64000,
          address: p.address || "Verified Address",
          locality: p.address?.split(",")?.[0] || "Central Locality",
          city: p.city || "Bangalore",
          landlord_name: p.landlord_name || (user?.full_name ? `${user.full_name} (You)` : "Verified Landlord"),
          landlord_rating: 5.0,
          distance_km: Number((0.6 + idx * 0.3).toFixed(1)),
          popularity: 99,
          image: p.image || fallbackImages[idx % fallbackImages.length],
          amenities: ["MTA 2021 Compliant", "DepositGuard Protected", "SHA-256 Inspection Ready", "Power Backup", "Covered Parking"],
          description: `Freshly listed property by ${p.landlord_name || 'Landlord'}. Pre-configured with DepositGuard 5-suite baseline inspection. Invite code: ${p.invite_code || 'AVAIL'}`,
          invite_code: p.invite_code,
          isUserListed: true,
          verified: true
        }));

        if (isMounted) {
          setUserListedCount(enrichedUserProps.length);
          const existingIds = new Set(enrichedUserProps.map((p) => p.id));
          const filteredDummies = DUMMY_PROPERTIES.filter((p) => !existingIds.has(p.id));
          setProperties([...enrichedUserProps, ...filteredDummies]);
        }
      } catch (err) {
        console.warn("Could not load explore properties:", err);
      }
    };
    loadProperties();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Filter & sort logic (Popular & Nearest prioritized first)
  const filteredProperties = useMemo(() => {
    let list = [...properties];

    if (cityFilter !== "all") {
      const target = cityFilter.toLowerCase();
      list = list.filter((p) => {
        const pCity = (p.city || "").toLowerCase();
        if (target === "bangalore") return pCity.includes("bangalore") || pCity.includes("bengaluru");
        if (target === "delhi-ncr") return pCity.includes("delhi") || pCity.includes("gurgaon") || pCity.includes("noida");
        return pCity.includes(target);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.locality || "").toLowerCase().includes(q) ||
          (p.city || "").toLowerCase().includes(q) ||
          (p.address || "").toLowerCase().includes(q) ||
          (p.landlord_name || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      // User-listed properties always pin to the very top!
      if (a.isUserListed && !b.isUserListed) return -1;
      if (!a.isUserListed && b.isUserListed) return 1;

      if (sortBy === "popular_nearest") {
        // Weighted score: higher popularity (+2 per point) and closer distance (-4 per km)
        const scoreA = (a.popularity || 80) * 2 - (a.distance_km || 5) * 4;
        const scoreB = (b.popularity || 80) * 2 - (b.distance_km || 5) * 4;
        return scoreB - scoreA;
      } else if (sortBy === "nearest") {
        return (a.distance_km || 10) - (b.distance_km || 10);
      } else if (sortBy === "popular") {
        return (b.popularity || 0) - (a.popularity || 0);
      } else if (sortBy === "rent_asc") {
        return (a.rent || 0) - (b.rent || 0);
      }
      return 0;
    });

    return list;
  }, [properties, cityFilter, searchQuery, sortBy]);

  // Gallery items for CircularGallery WebGL carousel
  const galleryItems = useMemo(() => {
    const slice = filteredProperties.slice(0, 20);
    return slice.map((p) => ({
      image: p.image,
      text: p.title,
      description: `₹${(p.rent || 0).toLocaleString("en-IN")}/mo • ₹${(p.deposit || 0).toLocaleString("en-IN")} Deposit • ${p.locality || p.address}, ${p.city} (${p.distance_km} km away) • Landlord: ${p.landlord_name}`,
      alt: p.title,
      propertyData: p
    }));
  }, [filteredProperties]);

  const handleCopyInvite = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedInvite(code);
    setTimeout(() => setCopiedInvite(null), 2500);
  };

  // Magnetic CTA Pill Mouse Tracking
  const onCtaMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const fx = e.clientX - r.left;
    const fy = e.clientY - r.top;
    el.style.setProperty("--fx", `${fx}px`);
    el.style.setProperty("--fy", `${fy}px`);
    el.style.setProperty("--mx", `${((fx / r.width - 0.5) * 8).toFixed(2)}px`);
    el.style.setProperty("--my", `${((fy / r.height - 0.5) * 6).toFixed(2)}px`);
  };

  const onCtaLeave = (e) => {
    const el = e.currentTarget;
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
  };

  const handleCtaClick = (e) => {
    e.preventDefault();
    const el = document.getElementById("website-details");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  // Headline parsing with serif-italic emphasis
  const headline = "Move in with *peace of mind* from day one.";
  const lines = useMemo(() => mrfParseHeading(headline), [headline]);

  return (
    <div className="bg-[#FAF8F5] text-slate-900 flex flex-col w-full selection:bg-emerald-800 selection:text-white">
      <style>{MRF_HERO_CSS}</style>

      {/* =========================================================================
          HERO SECTION (100vh Layered Indian Residential Architecture Artwork)
      ========================================================================= */}
      <section
        className="mrf-root"
        style={{
          "--mrf-sans": '"Inter", "Inter Tight", system-ui, sans-serif',
          "--mrf-serif": '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
        }}
      >
        {/* Ambient Warm Sun Glow */}
        <div className="mrf-sun-glow" aria-hidden="true" />

        {/* Indian Residential Architecture Multi-Layer SVG Artwork (Bottom 45-50% with Parallax) */}
        <IndianArchitectureArtwork />

        {/* Top Navbar: Minimal & Transparent over Sky */}
        <header className="absolute top-0 left-0 right-0 z-20 w-full px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20 h-24 sm:h-28 flex items-center justify-between pointer-events-auto">
          {/* Brand Wordmark */}
          <div
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              onNavigate("landing");
            }}
            className="flex items-center space-x-3 cursor-pointer select-none group"
            title="DepositGuard Home"
          >
            <BrandLogo variant="light" className="h-16 sm:h-18 md:h-20 lg:h-22" />
          </div>

          {/* Right Navigation */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/10 border border-slate-900/15 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                {user?.full_name || user?.email || "Aayush Raj"}
              </span>
              <button
                onClick={() => switchRole && switchRole()}
                title="Click to toggle between Landlord and Tenant"
                className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900/10 text-slate-800 hover:bg-slate-900/20 cursor-pointer transition"
              >
                {user?.role || "landlord"} ⇄
              </button>
            </div>

            <button
              onClick={() => onNavigate("dashboard")}
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <span>&rarr;</span>
            </button>
          </nav>
        </header>

        {/* Hero Content (Floating over upper sky) */}
        <div className="mrf-hero">
          {/* Headline with Serif-Italic Accent */}
          <h1 className="mrf-h">
            {lines.map((words, li) => (
              <span className="mrf-line" key={li}>
                {words.map((w, wi) => (
                  <React.Fragment key={wi}>
                    {wi > 0 ? " " : null}
                    <span className={"mrf-w" + (w.accent ? " mrf-acc" : "")}>
                      <span className="mrf-wi">{w.text}</span>
                    </span>
                  </React.Fragment>
                ))}
              </span>
            ))}
          </h1>

          {/* Subtext */}
          <p className="mrf-sub">
            Tamper-evident inspections and fair deposit protection, built for both tenants and landlords.
          </p>

          {/* Pill CTA Button: Exactly ONE primary button */}
          <div className="mrf-cta-wrap flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <button
                onClick={() => onNavigate("dashboard")}
                className="mrf-cta"
                onPointerMove={onCtaMove}
                onPointerLeave={onCtaLeave}
              >
                <span>Go to Dashboard</span>
                <span className="mrf-cta-arrow">
                  <svg className="mrf-a1" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                    <path d="M3.5 8h9M9 4.5l3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg className="mrf-a2" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                    <path d="M3.5 8h9M9 4.5l3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ) : (
              <a
                className="mrf-cta"
                href="#website-details"
                onClick={handleCtaClick}
                onPointerMove={onCtaMove}
                onPointerLeave={onCtaLeave}
              >
                <span>Get Started</span>
                <span className="mrf-cta-arrow">
                  <svg className="mrf-a1" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                    <path d="M8 3.5v9M4.5 9l3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg className="mrf-a2" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                    <path d="M8 3.5v9M4.5 9l3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Crisp High-Contrast "Scroll to explore ↓" Cue with Dark Pill Backdrop */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById("website-details");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-pointer pointer-events-auto group focus:outline-none"
          aria-label="Scroll to explore details"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-white/20 hover:border-emerald-500/40 text-white shadow-xl transition-all duration-200 group-hover:scale-105">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-white/90 group-hover:text-emerald-300 transition-colors">
              Scroll to explore
            </span>
            <svg className="w-3.5 h-3.5 text-white/90 group-hover:text-emerald-300 animate-bounce transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </button>
      </section>

      {/* =========================================================================
          SECTIONS 2 - 7 WRAPPER WITH LIGHT ARCHITECTURAL GRID & LAVENDER GLOW
      ========================================================================= */}
      <div className="dg-light-grid-canvas w-full text-slate-900">
        {/* =========================================================================
            SECTION 2: HOW IT WORKS (WEBSITE DETAILS SECTION)
        ========================================================================= */}
        <section id="website-details" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200/80 scroll-mt-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-emerald-900 font-mono text-xs uppercase tracking-widest bg-emerald-50 border border-emerald-200/90 px-3.5 py-1 rounded-full shadow-sm font-bold">
                Simple 4-Step Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                How DepositGuard Protects You
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                A neutral digital handshake ensuring neither party can arbitrarily alter records or deductions.
              </p>
            </div>

            {/* Connecting Timeline Line for Desktop */}
            <div className="relative">
              <div className="hidden md:block absolute top-14 left-16 right-16 h-0.5 bg-gradient-to-r from-emerald-400 via-amber-400 via-indigo-400 to-purple-400 z-0 opacity-40 border-t border-dashed border-slate-300" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                {/* Step 1 */}
                <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 border border-emerald-200/90 hover:border-emerald-500 rounded-3xl p-6 relative transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md shadow-emerald-700/20 group-hover:scale-110 transition-transform">
                        01
                      </div>
                      <span className="text-2xl group-hover:rotate-12 transition-transform">📸</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-200/90 font-mono">
                      Day 1 Baseline
                    </span>
                    <h3 className="text-slate-900 font-extrabold text-lg mt-2.5">Document Move-In</h3>
                    <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                      Walk through with 5 pre-populated room suites. Photograph pre-existing scuffs, cracks, and utility meters on Day 1.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-emerald-100/80 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                    <span>✓ 26 point inspection</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 border border-amber-200/90 hover:border-amber-500 rounded-3xl p-6 relative transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md shadow-amber-600/20 group-hover:scale-110 transition-transform">
                        02
                      </div>
                      <span className="text-2xl group-hover:rotate-12 transition-transform">🔐</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/90 font-mono">
                      Cryptographic Seal
                    </span>
                    <h3 className="text-slate-900 font-extrabold text-lg mt-2.5">Dual-Confirmation Lock</h3>
                    <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                      Both landlord and tenant approve the baseline. The record is cryptographically sealed with a SHA-256 hash and locked.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-amber-100/80 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                    <span>✓ Zero silent edits</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/40 border border-indigo-200/90 hover:border-indigo-500 rounded-3xl p-6 relative transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-800 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-700/20 group-hover:scale-110 transition-transform">
                        03
                      </div>
                      <span className="text-2xl group-hover:rotate-12 transition-transform">🤖</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100/80 text-indigo-900 border border-indigo-200/90 font-mono">
                      GuardBot AI Engine
                    </span>
                    <h3 className="text-slate-900 font-extrabold text-lg mt-2.5">AI Move-Out Triage</h3>
                    <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                      Compare move-out condition against locked baseline. AI distinguishes normal wear & tear from chargeable damage under MTA 2021.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-indigo-100/80 flex items-center gap-1.5 text-[11px] font-bold text-indigo-800">
                    <span>✓ Statutory wear vs damage</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-gradient-to-br from-purple-50/90 via-white to-pink-50/40 border border-purple-200/90 hover:border-purple-500 rounded-3xl p-6 relative transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-pink-800 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md shadow-purple-700/20 group-hover:scale-110 transition-transform">
                        04
                      </div>
                      <span className="text-2xl group-hover:rotate-12 transition-transform">📜</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100/80 text-purple-900 border border-purple-200/90 font-mono">
                      Legal Notarization
                    </span>
                    <h3 className="text-slate-900 font-extrabold text-lg mt-2.5">Settlement & PDF Export</h3>
                    <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                      Agree on itemized deductions and download a formal, tamper-evident ReportLab PDF report for legal security.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-purple-100/80 flex items-center gap-1.5 text-[11px] font-bold text-purple-800">
                    <span>✓ Court-admissible proof</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
          SECTION 3: VERIFIED LANDLORD LISTINGS & CIRCULAR GALLERY SHOWCASE
      ========================================================================= */}
        <section id="verified-properties" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200/80 scroll-mt-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/90 rounded-full px-3.5 py-1 text-xs text-emerald-900 font-bold mb-3 shadow-sm">
                <span>🏢</span>
                <span>MTA 2021 Compliant Landlord Listings</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                Explore Verified Properties with{" "}
                <span className="font-serif italic font-normal text-emerald-800">
                  DepositGuard
                </span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Browse 20+ flats, apartments, and studios across Bangalore, Mumbai, Delhi-NCR, Pune, and Hyderabad.
                Deposits are capped at strictly 2 months rent under Model Tenancy Act principles, with SHA-256 tamper-evident move-in condition baselines.
              </p>

              {/* Landlord Quick CTA & User Property Indicator */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-slate-900/10 cursor-pointer"
                >
                  <span>+</span>
                  <span>List Your Property as Landlord</span>
                </button>
                {userListedCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono font-medium shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    {userListedCount} Property Listed By You (Shown First)
                  </span>
                )}
              </div>
            </div>

            {/* Filter & Sort Controls */}
            <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* City filter pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "all", label: "All Cities" },
                    { id: "Bangalore", label: "Bangalore" },
                    { id: "Mumbai", label: "Mumbai" },
                    { id: "Delhi-NCR", label: "Delhi-NCR" },
                    { id: "Pune", label: "Pune" },
                    { id: "Hyderabad", label: "Hyderabad" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCityFilter(c.id)}
                      className={`text-xs px-3.5 py-1.5 rounded-full transition font-medium cursor-pointer ${cityFilter === c.id
                        ? "bg-slate-900 text-white font-bold shadow-sm"
                        : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60"
                        }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Sort pills & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search area, title, city..."
                      className="w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl p-1">
                    {[
                      { id: "popular_nearest", label: "🔥 Popular & Nearest" },
                      { id: "nearest", label: "📍 Nearest" },
                      { id: "popular", label: "⭐ Popular" },
                      { id: "rent_asc", label: "💰 Low Rent" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSortBy(s.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg transition font-medium ${sortBy === s.id
                          ? "bg-white text-slate-900 shadow-sm font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
              CIRCULAR GALLERY 3D WHEEL
          ========================================================================= */}
            <div className="relative w-full rounded-3xl border border-slate-200/90 bg-white/70 p-4 sm:p-6 shadow-xl backdrop-blur-xl mb-16">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 pt-1 pb-3 text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-2 font-medium text-emerald-800">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="font-mono uppercase tracking-wider text-[11px]">Interactive 3D Carousel View</span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-800 font-semibold">{filteredProperties.length} Properties</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-slate-700 font-mono">
                    Drag / swipe horizontally to spin
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span>Click any card to inspect</span>
                </div>
              </div>

              <div style={{ height: "540px", position: "relative" }} className="w-full">
                <CircularGallery
                  key={`${cityFilter}-${sortBy}-${filteredProperties.length}`}
                  items={galleryItems}
                  bend={-2}
                  textColor="#334155"
                  borderRadius={0.06}
                  scrollEase={0.05}
                  gap={0.22}
                  itemSize={0.92}
                  onItemClick={(item) => {
                    if (item?.propertyData) {
                      setSelectedPropertyModal(item.propertyData);
                    }
                  }}
                />
              </div>
            </div>

            {/* =========================================================================
              PROPERTY CARDS GRID
          ========================================================================= */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    All Verified Properties
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Ordered with{" "}
                    <span className="text-emerald-800 font-semibold">
                      {sortBy === "popular_nearest"
                        ? "Popular & Nearest First"
                        : sortBy === "nearest"
                          ? "Distance (Nearest First)"
                          : sortBy === "popular"
                            ? "Highest Popularity"
                            : "Lowest Rent First"}
                    </span>
                    {userListedCount > 0 && " • Your listed properties appear at the top"}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-sm">
                  {filteredProperties.length} available
                </span>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="text-center py-16 bg-white/80 rounded-2xl border border-slate-200/90 backdrop-blur-md">
                  <p className="text-slate-500 text-sm">No properties found matching your search.</p>
                  <button
                    onClick={() => {
                      setCityFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-3 text-xs text-emerald-800 underline font-medium cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((p) => (
                    <div
                      key={p.id}
                      className={`bg-white/85 backdrop-blur-xl border rounded-3xl overflow-hidden transition-all duration-300 flex flex-col group shadow-sm hover:shadow-xl hover:-translate-y-1 ${p.isUserListed
                        ? "border-emerald-600/70 ring-2 ring-emerald-600/20"
                        : "border-slate-200/90 hover:border-emerald-600/40"
                        }`}
                    >
                      {/* Image & Badges */}
                      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          {p.isUserListed ? (
                            <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                              <span>★</span>
                              <span>Listed By You (Active)</span>
                            </span>
                          ) : (
                            <span className="bg-white/95 border border-slate-200 text-slate-800 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm flex items-center gap-1">
                              <span>🛡️</span>
                              <span>MTA 2021 Compliant</span>
                            </span>
                          )}
                          <span className="bg-white/95 border border-slate-200 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                            ★ {p.popularity}% Popular
                          </span>
                        </div>

                        {/* Bottom photo overlay info */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                          <span className="bg-white/90 text-slate-800 px-2.5 py-1 rounded-lg backdrop-blur-sm font-medium shadow-sm flex items-center gap-1">
                            <span>📍</span>
                            <span>{p.distance_km} km away &bull; {p.locality || p.city}</span>
                          </span>
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                            {p.bhk || "2 BHK"}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-900 transition leading-snug">
                            {p.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {p.address}
                          </p>

                          {/* Rent & Deposit row */}
                          <div className="mt-4 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-mono text-slate-500 block">Monthly Rent</span>
                              <span className="text-lg font-black text-slate-900">
                                ₹{(p.rent || 0).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[11px] text-slate-500">/mo</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-mono text-slate-500 block">Security Deposit</span>
                              <span className="text-sm font-bold text-slate-800">
                                ₹{(p.deposit || 0).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-emerald-600 block font-medium">✓ Max 2 Mos Cap</span>
                            </div>
                          </div>

                          {/* Landlord info with Clickable Profile Pop-Out */}
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLandlordProfile(p);
                              }}
                              className="flex items-center gap-1.5 group/landlord hover:text-emerald-800 transition cursor-pointer text-left focus:outline-none"
                              title={`Click to view ${p.landlord_name}'s Profile & Contact Info (Gmail/Phone)`}
                            >
                              <span className="w-6 h-6 rounded-full bg-slate-200 group-hover/landlord:bg-emerald-100 group-hover/landlord:border-emerald-300 border border-slate-300 flex items-center justify-center text-[11px] text-slate-700 group-hover/landlord:text-emerald-800 font-bold transition">
                                {(p.landlord_name || "L")[0]}
                              </span>
                              <span className="text-slate-700 group-hover/landlord:text-emerald-800 font-semibold truncate max-w-[130px] underline decoration-slate-300 group-hover/landlord:decoration-emerald-600 underline-offset-2 transition">
                                {p.landlord_name}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200/90 px-1 py-0.2 rounded group-hover/landlord:bg-emerald-100 transition hidden sm:inline">
                                ↗
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLandlordProfile(p);
                              }}
                              className="text-amber-500 hover:text-amber-600 font-medium text-[11px] cursor-pointer transition flex items-center gap-0.5"
                              title="Click to view Landlord profile"
                            >
                              <span>★ {p.landlord_rating || 4.9}</span>
                              <span className="text-[10px] text-slate-400">Landlord</span>
                            </button>
                          </div>

                          {/* Amenities chips */}
                          {p.amenities && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {p.amenities.slice(0, 3).map((a, i) => (
                                <span
                                  key={i}
                                  className="bg-slate-100 border border-slate-200/70 text-slate-600 text-[10px] px-2 py-0.5 rounded"
                                >
                                  {a}
                                </span>
                              ))}
                              {p.amenities.length > 3 && (
                                <span className="text-slate-400 text-[10px] py-0.5">
                                  +{p.amenities.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPropertyModal(p)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition text-center shadow-sm cursor-pointer"
                          >
                            View Baseline
                          </button>
                          <button
                            onClick={() => {
                              if (p.invite_code) {
                                handleCopyInvite(p.invite_code);
                              }
                              onNavigate("dashboard");
                            }}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition text-center shadow-md shadow-slate-900/10 cursor-pointer"
                          >
                            {p.invite_code && copiedInvite === p.invite_code
                              ? "✓ Code Copied!"
                              : "Inspect & Join"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
          SECTION 4: RESOLVING INDIAN RENTAL DISPUTES (DOMAIN PILLARS)
      ========================================================================= */}
        <section className="border-t border-slate-200/80 py-24 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-emerald-900 font-mono text-xs uppercase tracking-widest bg-emerald-50 border border-emerald-200/90 px-3.5 py-1 rounded-full shadow-sm font-bold">
                Field-Tested Grounding
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Tackling the Biggest Deposit Deduction Disputes in India
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Rooted in real-world rental patterns across Bangalore, Mumbai, Delhi-NCR, Pune, and Hyderabad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <div className="bg-gradient-to-br from-orange-50/95 via-white to-rose-50/40 border border-orange-200/90 hover:border-orange-400 rounded-3xl p-7 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 shadow-sm group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-13 h-13 rounded-2xl bg-orange-100/90 border border-orange-200 flex items-center justify-center text-3xl shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      🎨
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200 font-mono shadow-xs">
                      ₹15k–₹45k Dispute
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Unjustified Painting Charges</h3>
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                    Landlords frequently deduct ₹15,000–₹45,000 for full repainting. DepositGuard documents existing wall marks,
                    nail holes, and natural discolouration under Model Tenancy Act wear-and-tear standards.
                  </p>
                </div>
                <div className="mt-5 pt-3.5 border-t border-orange-100/90 space-y-1.5 text-[11px] text-orange-950 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-orange-200/80 text-orange-900 flex items-center justify-center text-[10px]">✓</span>
                    <span>Pre-existing nail holes & seepage locked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-orange-200/80 text-orange-900 flex items-center justify-center text-[10px]">✓</span>
                    <span>Faded paint non-chargeable under MTA</span>
                  </div>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-gradient-to-br from-sky-50/95 via-white to-blue-50/40 border border-sky-200/90 hover:border-sky-400 rounded-3xl p-7 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 shadow-sm group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-13 h-13 rounded-2xl bg-sky-100/90 border border-sky-200 flex items-center justify-center text-3xl shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      ⚡
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-200 font-mono shadow-xs">
                      Zero Utility Arrears
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Utility Arrears & Meter Proof</h3>
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                    Photograph electric, piped gas, and water meters on Day 1. The initial reading is cryptographically locked
                    so tenants never pay for previous occupants’ unpaid consumption.
                  </p>
                </div>
                <div className="mt-5 pt-3.5 border-t border-sky-100/90 space-y-1.5 text-[11px] text-sky-950 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-sky-200/80 text-sky-900 flex items-center justify-center text-[10px]">✓</span>
                    <span>Day 1 photo verification of kWh meter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-sky-200/80 text-sky-900 flex items-center justify-center text-[10px]">✓</span>
                    <span>Water & PNG gas counter verification</span>
                  </div>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/40 border border-emerald-200/90 hover:border-emerald-400 rounded-3xl p-7 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 shadow-sm group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-13 h-13 rounded-2xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center text-3xl shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      🔒
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 font-mono shadow-xs">
                      SHA-256 Notarized
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Immutable Cryptographic Seal</h3>
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                    Neither tenant nor landlord can secretly alter photos or notes later. Once both approve, the canonical dataset
                    is sealed with a SHA-256 hash. Any post-lock update must be an append-only amendment.
                  </p>
                </div>
                <div className="mt-5 pt-3.5 border-t border-emerald-100/90 space-y-1.5 text-[11px] text-emerald-950 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center text-[10px]">✓</span>
                    <span>Dual digital signatures required to seal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center text-[10px]">✓</span>
                    <span>Append-only amendment ledger</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
          SECTION 5: PRE-POPULATED ROOM CHECKLIST SHOWCASE (INTERACTIVE)
      ========================================================================= */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-emerald-900 font-mono text-xs uppercase tracking-widest bg-emerald-50 border border-emerald-200/90 px-3.5 py-1 rounded-full shadow-sm font-bold">
              Room-by-Room Inspections
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              5 Essential Pre-Populated Inspection Suites
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Engineered from real dispute cases to capture the exact items that prevent unfair deductions. Tap any suite to preview its items:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {INSPECTION_SUITES_DATA.map((cat, idx) => {
              const isSelected = selectedSuiteIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedSuiteIndex(isSelected ? null : idx)}
                  className={`bg-gradient-to-br ${cat.bgGradient} border ${
                    isSelected
                      ? "ring-2 ring-emerald-600 shadow-xl border-emerald-500 scale-[1.02]"
                      : cat.border
                  } rounded-3xl p-5 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm cursor-pointer group relative flex flex-col justify-between`}
                >
                  <div>
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-sm border border-slate-200/60 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      {cat.icon}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cat.accent} font-mono inline-block mb-2`}>
                      {cat.badge}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">{cat.name}</h4>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-snug line-clamp-2">{cat.desc}</p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-800">
                    <span>{isSelected ? "▲ Hide Details" : "▼ Preview Items"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Expanded Checklist Preview Drawer */}
          {selectedSuiteIndex !== null && INSPECTION_SUITES_DATA[selectedSuiteIndex] && (
            <div className="mt-8 p-6 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{INSPECTION_SUITES_DATA[selectedSuiteIndex].icon}</span>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      {INSPECTION_SUITES_DATA[selectedSuiteIndex].name} Checklist
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono font-bold">
                        {INSPECTION_SUITES_DATA[selectedSuiteIndex].items.length} Standard Checks
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {INSPECTION_SUITES_DATA[selectedSuiteIndex].desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSuiteIndex(null)}
                  className="self-end sm:self-center text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  ✕ Close Preview
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
                {INSPECTION_SUITES_DATA[selectedSuiteIndex].items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/40 hover:bg-white transition-all shadow-xs flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
          SECTION 6: TRUST & DISCLAIMER STRIP
      ========================================================================= */}
        <section className="bg-gradient-to-b from-[#FBF9F4] to-white backdrop-blur-xl border-t border-slate-200/80 py-14 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200/90 rounded-full px-4 py-1.5 text-xs font-mono text-slate-700 mb-3.5 shadow-sm">
              <span className="text-emerald-700 font-bold">🛡️ Model Tenancy Act, 2021 Compliant</span>
              <span>&bull;</span>
              <span>tamper-evident, not tamper-proof</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto">
              DepositGuard creates an agreed, immutable factual record of property condition under Model Tenancy Act, 2021 principles.
              It provides neutral documentation to support fair security deposit settlements and avoid disputes.
            </p>
          </div>
        </section>

        {/* =========================================================================
          SECTION 7: LANDING FOOTER
      ========================================================================= */}
        <footer className="bg-white/90 backdrop-blur-xl border-t border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                onNavigate("landing");
              }}
              className="flex items-center cursor-pointer select-none hover:opacity-85 transition"
              title="DepositGuard Home"
            >
              <BrandLogo variant="light" className="h-10 sm:h-11" showTagline={false} />
            </div>
            <p>&copy; {new Date().getFullYear()} DepositGuard. Grounded in Model Tenancy Act, 2021.</p>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          PROPERTY DETAIL MODAL (WHEN A PROPERTY IS SELECTED FROM CIRCULAR OR GRID)
      ========================================================================= */}
      {selectedPropertyModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedPropertyModal(null)}
        >
          <div
            className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative text-left text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPropertyModal(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-lg transition shadow-sm cursor-pointer"
              aria-label="Close modal"
            >
              &times;
            </button>

            {/* Modal Image */}
            <div className="relative h-64 sm:h-72 -mx-6 sm:-mx-7 -mt-6 sm:-mt-7 mb-6 overflow-hidden bg-slate-100 rounded-t-3xl">
              <img
                src={selectedPropertyModal.image}
                alt={selectedPropertyModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {selectedPropertyModal.isUserListed ? (
                  <span className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                    ★ LISTED BY YOU
                  </span>
                ) : (
                  <span className="bg-white/95 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    🛡️ MTA 2021 COMPLIANT
                  </span>
                )}
                <span className="bg-white/95 border border-slate-200 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  ★ {selectedPropertyModal.popularity}% Popular
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                <span className="bg-white/95 text-slate-800 px-3 py-1 rounded-lg backdrop-blur-sm font-medium shadow-sm">
                  📍 {selectedPropertyModal.distance_km} km away &bull; {selectedPropertyModal.city}
                </span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1 rounded-md backdrop-blur-sm">
                  {selectedPropertyModal.bhk || "2 BHK"} &bull; {selectedPropertyModal.property_type || "Apartment"}
                </span>
              </div>
            </div>

            {/* Title & Address */}
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {selectedPropertyModal.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {selectedPropertyModal.address}
            </p>

            {/* Pricing & MTA Deposit Guard Banner */}
            <div className="mt-5 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Monthly Rent</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{(selectedPropertyModal.rent || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-500"> /month</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Security Deposit (Capped)</span>
                <span className="text-xl font-bold text-slate-800">
                  ₹{(selectedPropertyModal.deposit || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium block">
                  ✓ MTA 2021 Max 2-Month Cap
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-5">
              <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Property Overview</h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {selectedPropertyModal.description}
              </p>
            </div>

            {/* Baseline Inspection Guarantee */}
            <div className="mt-5 p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider font-mono">
                <span>🔒</span>
                <span>SHA-256 Tamper-Evident Condition Baseline</span>
              </div>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                This property includes DepositGuard&apos;s 5-suite pre-populated move-in checklist. Existing wall scuffs,
                meter readings, and tile conditions are locked before move-in so no wrongful deductions occur at move-out.
              </p>
            </div>

            {/* Landlord Info & Invite Code */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Clickable Landlord Profile Card */}
              <button
                type="button"
                onClick={() => handleOpenLandlordProfile(selectedPropertyModal)}
                className="flex items-center gap-2.5 text-left group/modal-landlord hover:bg-emerald-50/80 p-2 -m-2 rounded-2xl border border-transparent hover:border-emerald-200 transition cursor-pointer"
                title="Click to view Landlord Profile, Gmail, and Contact Details"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover/modal-landlord:bg-emerald-100 border border-slate-200 group-hover/modal-landlord:border-emerald-300 flex items-center justify-center text-sm text-slate-800 group-hover/modal-landlord:text-emerald-800 font-bold transition">
                  {(selectedPropertyModal.landlord_name || "L")[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover/modal-landlord:text-emerald-800 underline decoration-slate-300 group-hover/modal-landlord:decoration-emerald-600 underline-offset-2 transition block">
                      {selectedPropertyModal.landlord_name}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded font-mono">
                      View Profile ↗
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 group-hover/modal-landlord:text-emerald-700">
                    ★ {selectedPropertyModal.landlord_rating || 4.9} Verified Landlord &bull; Contact info
                  </span>
                </div>
              </button>

              {selectedPropertyModal.invite_code && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Invite Code:</span>
                  <span className="font-mono font-bold text-xs text-emerald-800">
                    {selectedPropertyModal.invite_code}
                  </span>
                  <button
                    onClick={() => handleCopyInvite(selectedPropertyModal.invite_code)}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition shadow-sm cursor-pointer"
                  >
                    {copiedInvite === selectedPropertyModal.invite_code ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setSelectedPropertyModal(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedPropertyModal(null);
                  onNavigate("dashboard");
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition text-center shadow-md shadow-slate-900/10 cursor-pointer"
              >
                Open in Dashboard & Inspect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LANDLORD PROFILE POP-OUT MODAL
      ========================================================================= */}
      {selectedLandlordModal && (
        <LandlordProfileModal
          landlord={selectedLandlordModal.landlord}
          property={selectedLandlordModal.property}
          onClose={() => setSelectedLandlordModal(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
