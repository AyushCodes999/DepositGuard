/**
 * DepositGuard Move-In Inspection Checklist
 * Pre-populated room-by-room items derived directly from RESEARCH NOTES/Research notes.txt.
 * Streamlined for Indian rental flats and PGs (5-6 high-impact items per room suite).
 */

export const DEFAULT_CHECKLIST_ROOMS = [
  {
    id: "bedroom",
    name: "Bedroom",
    description: "Photograph room corners, walls, ceiling, furniture, windows, and electricals before moving in.",
    items: [
      {
        name: "Full Room Panoramic Corner Shots",
        description: "Wide panoramic shots from opposite corners covering floor, walls, and ceiling.",
        mandatoryPhoto: true,
        category: "Overview"
      },
      {
        name: "Walls, Ceiling, Paint & Moulding",
        description: "Inspect for existing nail holes, dampness/seepage, peeling paint, stains, or ceiling cracks.",
        mandatoryPhoto: false,
        category: "Surfaces"
      },
      {
        name: "Doors, Windows, Mesh & Curtains",
        description: "Check door locks, hinges, window glass, mosquito mesh, and curtain rods.",
        mandatoryPhoto: false,
        category: "Fittings"
      },
      {
        name: "Flooring, Wardrobes & Furniture",
        description: "Bed frame, mattress condition, wardrobe shelves/drawers, study desk, and tile/wooden floor scratches.",
        mandatoryPhoto: false,
        category: "Furniture"
      },
      {
        name: "Electrical Switches, Fan & Sockets",
        description: "Ceiling fan speed/noise, lights, AC switchpoint, switchboards, and socket functionality.",
        mandatoryPhoto: false,
        category: "Electricals"
      }
    ]
  },
  {
    id: "bathroom",
    name: "Bathroom",
    description: "Photograph entire bathroom, tiles, drainage slope, sanitary fittings, and water heater.",
    items: [
      {
        name: "Bathroom Wide Panoramic View",
        description: "Wide shot showing overall bathroom layout, tiles, floor slope, and ceiling.",
        mandatoryPhoto: true,
        category: "Overview"
      },
      {
        name: "Tiles, Floor Slope & Drainage",
        description: "Inspect for cracked tiles, wall dampness/seepage, floor drainage slope, and drain trap blockages.",
        mandatoryPhoto: false,
        category: "Surfaces"
      },
      {
        name: "Sanitaryware (WC, Basin & Health Faucet)",
        description: "Ceramic toilet pot, flush cistern, washbasin, health faucet jet, and under-sink trap leaks.",
        mandatoryPhoto: false,
        category: "Sanitary"
      },
      {
        name: "Taps, Shower & Water Pressure",
        description: "Hot/cold mixer, angle valves, showerhead flow, and general water pressure.",
        mandatoryPhoto: false,
        category: "Plumbing"
      },
      {
        name: "Geyser / Water Heater & Exhaust Fan",
        description: "Water heater operation, power indicator, tank/hose drips, and exhaust fan suction.",
        mandatoryPhoto: false,
        category: "Appliances"
      }
    ]
  },
  {
    id: "kitchen",
    name: "Kitchen",
    description: "Photograph platform counters, modular cabinets, sink plumbing, chimney, stove, and RO.",
    items: [
      {
        name: "Kitchen Panoramic Overview",
        description: "Wide shot capturing platform counter, cabinets, sink area, and ventilation.",
        mandatoryPhoto: true,
        category: "Overview"
      },
      {
        name: "Granite Countertop & Backsplash Tiles",
        description: "Inspect for countertop edge chips, hairline cracks, heat burn marks, and grease on wall tiles.",
        mandatoryPhoto: false,
        category: "Surfaces"
      },
      {
        name: "Modular Cabinets & Storage Drawers",
        description: "Cabinet doors, soft-close hinges, internal shelving, pull-out baskets, and under-sink wood swelling.",
        mandatoryPhoto: false,
        category: "Storage"
      },
      {
        name: "Kitchen Sink, Taps & Drainage",
        description: "Stainless steel sink stains, faucet swivel, coupling leak, and waste drain flow.",
        mandatoryPhoto: false,
        category: "Plumbing"
      },
      {
        name: "Chimney, Gas Hob & RO Water Purifier",
        description: "Chimney suction, gas burner knobs/hose, RO purifier power and water dispensing, and 16A power points.",
        mandatoryPhoto: false,
        category: "Appliances"
      }
    ]
  },
  {
    id: "living-area",
    name: "Living Area",
    description: "Photograph living hall, furniture, balconies, entrance door, and society intercom.",
    items: [
      {
        name: "Living & Dining Room Panoramic View",
        description: "Wide panoramic shot from entrance showing hall, dining area, ceiling, and flooring.",
        mandatoryPhoto: true,
        category: "Overview"
      },
      {
        name: "Walls, Ceiling, Lighting & False Ceiling",
        description: "Paint condition, TV mount holes, ceiling fans, cove lights, and switchboards.",
        mandatoryPhoto: false,
        category: "Surfaces"
      },
      {
        name: "Main Entrance Door & Security Fixtures",
        description: "Main door lock, deadbolt, keys, peephole, security latch, and video doorbell/intercom.",
        mandatoryPhoto: false,
        category: "Security"
      },
      {
        name: "Hall Furniture (Sofa, Dining & TV Unit)",
        description: "Sofa upholstery, cushions, dining table and chairs, TV credenza, and coffee table condition.",
        mandatoryPhoto: false,
        category: "Furniture"
      },
      {
        name: "Balcony Railing, Flooring & Drainage",
        description: "Balcony floor tiles, slope, rainwater drain trap, safety railing rigidity, and sliding glass door.",
        mandatoryPhoto: false,
        category: "Exterior"
      }
    ]
  },
  {
    id: "appliances",
    name: "Appliances & Electricals",
    description: "Photograph meter dials, major electrical appliances, and safety distribution board.",
    items: [
      {
        name: "Electricity Meter (Move-In Reading Photo)",
        description: "Photograph meter dial showing exact kWh reading and serial number to prevent utility arrears dispute.",
        mandatoryPhoto: true,
        category: "Meters"
      },
      {
        name: "Water & Piped Gas Meter Readings",
        description: "Photograph water meter and piped gas (PNG) counter reading if applicable.",
        mandatoryPhoto: true,
        category: "Meters"
      },
      {
        name: "Air Conditioners & Remotes (Cooling Test)",
        description: "Test cooling on 18C, swing louvers, remote control display/buttons, and indoor coil cleanliness.",
        mandatoryPhoto: false,
        category: "Appliances"
      },
      {
        name: "Refrigerator & Washing Machine Condition",
        description: "Fridge cooling, freezer, door gasket, trays; washing machine drum, hoses, and spin cycle.",
        mandatoryPhoto: false,
        category: "Appliances"
      },
      {
        name: "Main Distribution Board, MCB & Inverter",
        description: "ELCB/RCCB trip switches, MCB box, inverter battery water level, and backup changeover.",
        mandatoryPhoto: false,
        category: "Electricals"
      },
      {
        name: "Pre-existing Inoperative Devices Notice",
        description: "Explicitly document any appliance or electrical item provided in broken or non-working state.",
        mandatoryPhoto: true,
        category: "Disputes"
      }
    ]
  }
];

export const CONDITION_LABELS = {
  clean_functional: { label: "Clean & Functional", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  minor_wear: { label: "Normal Wear & Tear", color: "bg-stone-100 text-stone-700 border-stone-300" },
  damaged: { label: "Pre-Existing Damage", color: "bg-amber-50 text-amber-700 border-amber-300" },
  not_working: { label: "Broken / Non-Working", color: "bg-rose-50 text-rose-700 border-rose-300" },
  not_applicable: { label: "Not Applicable", color: "bg-slate-50 text-slate-500 border-slate-200" }
};
