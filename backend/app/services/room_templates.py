"""
DepositGuard Room Templates
Pre-populated move-in inspection checklist derived from RESEARCH NOTES/Research notes.txt.
Streamlined for Indian rental flats and PGs (5-6 high-impact items per room suite).
"""

from typing import List, Dict, Any

DEFAULT_ROOM_TEMPLATES: List[Dict[str, Any]] = [
    {
        "name": "Bedroom",
        "room_order": 1,
        "items": [
            {
                "name": "Full Room Panoramic Corner Shots",
                "condition": "clean_functional",
                "notes": "Wide panoramic shots from opposite corners covering floor, walls, and ceiling.",
                "item_order": 1
            },
            {
                "name": "Walls, Ceiling, Paint & Moulding",
                "condition": "clean_functional",
                "notes": "Inspect for existing nail holes, dampness/seepage, peeling paint, stains, or ceiling cracks.",
                "item_order": 2
            },
            {
                "name": "Doors, Windows, Mesh & Curtains",
                "condition": "clean_functional",
                "notes": "Check door locks, hinges, window glass, mosquito mesh, and curtain rods.",
                "item_order": 3
            },
            {
                "name": "Flooring, Wardrobes & Furniture",
                "condition": "clean_functional",
                "notes": "Bed frame, mattress condition, wardrobe shelves/drawers, study desk, and tile/wooden floor scratches.",
                "item_order": 4
            },
            {
                "name": "Electrical Switches, Fan & Sockets",
                "condition": "clean_functional",
                "notes": "Ceiling fan speed/noise, lights, AC switchpoint, switchboards, and socket functionality.",
                "item_order": 5
            }
        ]
    },
    {
        "name": "Bathroom",
        "room_order": 2,
        "items": [
            {
                "name": "Bathroom Wide Panoramic View",
                "condition": "clean_functional",
                "notes": "Wide shot showing overall bathroom layout, tiles, floor slope, and ceiling.",
                "item_order": 1
            },
            {
                "name": "Tiles, Floor Slope & Drainage",
                "condition": "clean_functional",
                "notes": "Inspect for cracked tiles, wall dampness/seepage, floor drainage slope, and drain trap blockages.",
                "item_order": 2
            },
            {
                "name": "Sanitaryware (WC, Basin & Health Faucet)",
                "condition": "clean_functional",
                "notes": "Ceramic toilet pot, flush cistern, washbasin, health faucet jet, and under-sink trap leaks.",
                "item_order": 3
            },
            {
                "name": "Taps, Shower & Water Pressure",
                "condition": "clean_functional",
                "notes": "Hot/cold mixer, angle valves, showerhead flow, and general water pressure.",
                "item_order": 4
            },
            {
                "name": "Geyser / Water Heater & Exhaust Fan",
                "condition": "clean_functional",
                "notes": "Water heater operation, power indicator, tank/hose drips, and exhaust fan suction.",
                "item_order": 5
            }
        ]
    },
    {
        "name": "Kitchen",
        "room_order": 3,
        "items": [
            {
                "name": "Kitchen Panoramic Overview",
                "condition": "clean_functional",
                "notes": "Wide shot capturing platform counter, cabinets, sink area, and ventilation.",
                "item_order": 1
            },
            {
                "name": "Granite Countertop & Backsplash Tiles",
                "condition": "clean_functional",
                "notes": "Inspect for countertop edge chips, hairline cracks, heat burn marks, and grease on wall tiles.",
                "item_order": 2
            },
            {
                "name": "Modular Cabinets & Storage Drawers",
                "condition": "clean_functional",
                "notes": "Cabinet doors, soft-close hinges, internal shelving, pull-out baskets, and under-sink wood swelling.",
                "item_order": 3
            },
            {
                "name": "Kitchen Sink, Taps & Drainage",
                "condition": "clean_functional",
                "notes": "Stainless steel sink stains, faucet swivel, coupling leak, and waste drain flow.",
                "item_order": 4
            },
            {
                "name": "Chimney, Gas Hob & RO Water Purifier",
                "condition": "clean_functional",
                "notes": "Chimney suction, gas burner knobs/hose, RO purifier power and water dispensing, and 16A power points.",
                "item_order": 5
            }
        ]
    },
    {
        "name": "Living Area",
        "room_order": 4,
        "items": [
            {
                "name": "Living & Dining Room Panoramic View",
                "condition": "clean_functional",
                "notes": "Wide panoramic shot from entrance showing hall, dining area, ceiling, and flooring.",
                "item_order": 1
            },
            {
                "name": "Walls, Ceiling, Lighting & False Ceiling",
                "condition": "clean_functional",
                "notes": "Paint condition, TV mount holes, ceiling fans, cove lights, and switchboards.",
                "item_order": 2
            },
            {
                "name": "Main Entrance Door & Security Fixtures",
                "condition": "clean_functional",
                "notes": "Main door lock, deadbolt, keys, peephole, security latch, and video doorbell/intercom.",
                "item_order": 3
            },
            {
                "name": "Hall Furniture (Sofa, Dining & TV Unit)",
                "condition": "clean_functional",
                "notes": "Sofa upholstery, cushions, dining table and chairs, TV credenza, and coffee table condition.",
                "item_order": 4
            },
            {
                "name": "Balcony Railing, Flooring & Drainage",
                "condition": "clean_functional",
                "notes": "Balcony floor tiles, slope, rainwater drain trap, safety railing rigidity, and sliding glass door.",
                "item_order": 5
            }
        ]
    },
    {
        "name": "Appliances & Electricals",
        "room_order": 5,
        "items": [
            {
                "name": "Electricity Meter (Move-In Reading Photo)",
                "condition": "clean_functional",
                "notes": "Photograph meter dial showing exact kWh reading and serial number to prevent utility arrears dispute.",
                "item_order": 1
            },
            {
                "name": "Water & Piped Gas Meter Readings",
                "condition": "clean_functional",
                "notes": "Photograph water meter and piped gas (PNG) counter reading if applicable.",
                "item_order": 2
            },
            {
                "name": "Air Conditioners & Remotes (Cooling Test)",
                "condition": "clean_functional",
                "notes": "Test cooling on 18C, swing louvers, remote control display/buttons, and indoor coil cleanliness.",
                "item_order": 3
            },
            {
                "name": "Refrigerator & Washing Machine Condition",
                "condition": "clean_functional",
                "notes": "Fridge cooling, freezer, door gasket, trays; washing machine drum, hoses, and spin cycle.",
                "item_order": 4
            },
            {
                "name": "Main Distribution Board, MCB & Inverter",
                "condition": "clean_functional",
                "notes": "ELCB/RCCB trip switches, MCB box, inverter battery water level, and backup changeover.",
                "item_order": 5
            },
            {
                "name": "Pre-existing Inoperative Devices Notice",
                "condition": "not_working",
                "notes": "Explicitly document any appliance or electrical item provided in broken or non-working state.",
                "item_order": 6
            }
        ]
    }
]
