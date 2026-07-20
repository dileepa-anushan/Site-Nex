// =============================================
// SiteNex - Dummy Data (Construction Management)
// =============================================

export const projects = [
  {
    id: "69c5f44d6d96266f92632953",
    name: "Skyview Commercial Complex",
    location: "Downtown Metropolis",
    startDate: "2025-01-15",
    estimatedEndDate: "2026-08-30",
    budget: 45000000,
    status: "In Progress",
    progress: 35,
    projectManager: "Alice Johnson",
    siteEngineer: "Bob Smith",
    description: "A 15-story mixed-use commercial complex featuring retail spaces and corporate offices."
  },
  {
    id: "PROJ-102",
    name: "Riverfront Residences",
    location: "Westside Marina",
    startDate: "2025-06-01",
    estimatedEndDate: "2027-02-15",
    budget: 85000000,
    status: "Planning",
    progress: 5,
    projectManager: "David Lee",
    siteEngineer: "Carol White",
    description: "Premium residential apartments with 200 units, a clubhouse, and riverfront amenities."
  },
  {
    id: "PROJ-103",
    name: "Northgate Highway Overpass",
    location: "North District, Junction 12",
    startDate: "2024-09-01",
    estimatedEndDate: "2026-03-31",
    budget: 22000000,
    status: "In Progress",
    progress: 72,
    projectManager: "Alice Johnson",
    siteEngineer: "Frank Moore",
    description: "A dual-carriageway overpass to ease traffic congestion at the busiest city junction."
  },
  {
    id: "PROJ-104",
    name: "Eastwood Medical Centre",
    location: "Eastwood Business Park",
    startDate: "2025-03-10",
    estimatedEndDate: "2026-12-20",
    budget: 31500000,
    status: "In Progress",
    progress: 20,
    projectManager: "Rachel Green",
    siteEngineer: "Mike Tanaka",
    description: "A 5-floor specialist medical centre with diagnostic labs, outpatient wards, and parking."
  },
  {
    id: "PROJ-105",
    name: "Harbourview Hotel Tower",
    location: "Central Harbour District",
    startDate: "2023-11-01",
    estimatedEndDate: "2025-12-30",
    budget: 120000000,
    status: "Completed",
    progress: 100,
    projectManager: "David Lee",
    siteEngineer: "Sandra Reeves",
    description: "A 32-floor luxury hotel tower with conference facilities, sky pool, and harbour views."
  }
];

export const tasks = [
  {
    id: "TASK-401",
    projectId: "69c5f44d6d96266f92632953",
    name: "Foundation Concrete Pouring",
    description: "Pour concrete for the main foundation raft.",
    assignedTo: ["WRK-001", "WRK-002", "WRK-005"],
    startDate: "2026-03-01",
    endDate: "2026-03-03",
    status: "In Progress",
    priority: "High"
  },
  {
    id: "TASK-402",
    projectId: "69c5f44d6d96266f92632953",
    name: "Steel Reinforcement Setup",
    description: "Install rebar for the ground floor columns.",
    assignedTo: ["WRK-003", "WRK-004"],
    startDate: "2026-03-04",
    endDate: "2026-03-08",
    status: "To Do",
    priority: "High"
  },
  {
    id: "TASK-403",
    projectId: "PROJ-102",
    name: "Site Clearing and Grading",
    description: "Clear vegetation and grade land for initial survey.",
    assignedTo: ["WRK-006", "WRK-007"],
    startDate: "2025-06-05",
    endDate: "2025-06-15",
    status: "Completed",
    priority: "Medium"
  },
  {
    id: "TASK-404",
    projectId: "PROJ-103",
    name: "Deck Formwork Installation",
    description: "Install formwork shuttering for the main bridge deck spans.",
    assignedTo: ["WRK-008", "WRK-009", "WRK-001"],
    startDate: "2026-01-10",
    endDate: "2026-01-25",
    status: "Completed",
    priority: "High"
  },
  {
    id: "TASK-405",
    projectId: "PROJ-103",
    name: "Prestressed Concrete Deck Pour",
    description: "Pour and cure prestressed concrete for the overpass deck.",
    assignedTo: ["WRK-002", "WRK-005", "WRK-010"],
    startDate: "2026-01-28",
    endDate: "2026-02-10",
    status: "Completed",
    priority: "Critical"
  },
  {
    id: "TASK-406",
    projectId: "PROJ-103",
    name: "Guardrail & Safety Barrier Fitting",
    description: "Install all roadside guardrails and pedestrian safety barriers.",
    assignedTo: ["WRK-006", "WRK-007"],
    startDate: "2026-02-15",
    endDate: "2026-03-05",
    status: "In Progress",
    priority: "Medium"
  },
  {
    id: "TASK-407",
    projectId: "PROJ-104",
    name: "Structural Steel Frame Erection",
    description: "Erect steel frame for floors 1-3 of the medical centre.",
    assignedTo: ["WRK-003", "WRK-004", "WRK-008"],
    startDate: "2026-02-01",
    endDate: "2026-03-15",
    status: "In Progress",
    priority: "High"
  },
  {
    id: "TASK-408",
    projectId: "PROJ-104",
    name: "MEP Rough-In (Ground Floor)",
    description: "Install mechanical, electrical, and plumbing rough-in for the ground floor.",
    assignedTo: ["WRK-009", "WRK-010"],
    startDate: "2026-03-16",
    endDate: "2026-04-10",
    status: "To Do",
    priority: "Medium"
  },
  {
    id: "TASK-409",
    projectId: "69c5f44d6d96266f92632953",
    name: "External Cladding - Levels 1-5",
    description: "Fix external aluminium composite cladding panels on levels 1 through 5.",
    assignedTo: ["WRK-007", "WRK-008"],
    startDate: "2026-04-01",
    endDate: "2026-05-10",
    status: "To Do",
    priority: "Medium"
  },
  {
    id: "TASK-410",
    projectId: "PROJ-102",
    name: "Piling Works",
    description: "Drive 180 concrete piles per the structural engineer's specifications.",
    assignedTo: ["WRK-001", "WRK-005", "WRK-006"],
    startDate: "2025-07-01",
    endDate: "2025-08-20",
    status: "Completed",
    priority: "Critical"
  }
];

export const workers = [
  {
    id: "WRK-001",
    name: "John Doe",
    role: "Foreman",
    trade: "General Construction",
    phone: "555-0101",
    status: "Active"
  },
  {
    id: "WRK-002",
    name: "Mike Sanchez",
    role: "Skilled Worker",
    trade: "Concrete Finisher",
    phone: "555-0102",
    status: "Active"
  },
  {
    id: "WRK-003",
    name: "Sarah Jenkins",
    role: "Skilled Worker",
    trade: "Ironworker (Rebar)",
    phone: "555-0103",
    status: "Active"
  },
  {
    id: "WRK-004",
    name: "Tom Nguyen",
    role: "Skilled Worker",
    trade: "Ironworker (Rebar)",
    phone: "555-0104",
    status: "On Leave"
  },
  {
    id: "WRK-005",
    name: "James Miller",
    role: "Operator",
    trade: "Heavy Machinery",
    phone: "555-0105",
    status: "Active"
  },
  {
    id: "WRK-006",
    name: "Peter Clark",
    role: "Skilled Worker",
    trade: "Earthworks",
    phone: "555-0106",
    status: "Active"
  },
  {
    id: "WRK-007",
    name: "Luis Gomez",
    role: "General Laborer",
    trade: "Site Prep",
    phone: "555-0107",
    status: "Active"
  },
  {
    id: "WRK-008",
    name: "Angela Davis",
    role: "Skilled Worker",
    trade: "Structural Steel",
    phone: "555-0108",
    status: "Active"
  },
  {
    id: "WRK-009",
    name: "Carlos Rivera",
    role: "Supervisor",
    trade: "MEP (Mechanical)",
    phone: "555-0109",
    status: "Active"
  },
  {
    id: "WRK-010",
    name: "Priya Nair",
    role: "Skilled Worker",
    trade: "Electrical Wiring",
    phone: "555-0110",
    status: "Inactive"
  },
  {
    id: "WRK-011",
    name: "Derek Walsh",
    role: "Operator",
    trade: "Crane & Rigging",
    phone: "555-0111",
    status: "Active"
  },
  {
    id: "WRK-012",
    name: "Fiona Huang",
    role: "Supervisor",
    trade: "Quality Control",
    phone: "555-0112",
    status: "Active"
  }
];

export const issues = [
  {
    id: "ISS-201",
    projectId: "69c5f44d6d96266f92632953",
    title: "Delayed Delivery of Structural Steel",
    description: "Supplier reported a 3-day delay in shipping the I-beams for the first floor due to logistics issues.",
    reportedBy: "Bob Smith",
    reportedDate: "2026-02-26",
    status: "Open",
    priority: "High",
    attachments: ["delay_schedule.pdf"]
  },
  {
    id: "ISS-202",
    projectId: "69c5f44d6d96266f92632953",
    title: "Water Pump Malfunction",
    description: "Dewatering pump on zone B stopped working. Needs immediate replacement or repair.",
    reportedBy: "Bob Smith",
    reportedDate: "2026-02-28",
    status: "Resolved",
    priority: "Medium",
    attachments: []
  },
  {
    id: "ISS-203",
    projectId: "PROJ-102",
    title: "Permit Clearance Delay",
    description: "Municipal clearance for excavation is taking longer than expected.",
    reportedBy: "Carol White",
    reportedDate: "2025-06-10",
    status: "Open",
    priority: "Critical",
    attachments: ["municipal_notice.jpg"]
  },
  {
    id: "ISS-204",
    projectId: "PROJ-103",
    title: "Concrete Mix Design Non-Conformance",
    description: "Test cubes from batch 7 failed the 28-day compressive strength test. Affected pour section to be demolished and re-cast.",
    reportedBy: "Frank Moore",
    reportedDate: "2026-02-10",
    status: "In Progress",
    priority: "Critical",
    attachments: ["lab_report_batch7.pdf"]
  },
  {
    id: "ISS-205",
    projectId: "PROJ-104",
    title: "Subsurface Rock Obstruction",
    description: "Unexpected granite rock layer encountered during pile boring at grid lines D4-D6. Specialist rock drilling equipment required.",
    reportedBy: "Mike Tanaka",
    reportedDate: "2026-02-20",
    status: "Open",
    priority: "High",
    attachments: ["bore_log_D4.pdf"]
  },
  {
    id: "ISS-206",
    projectId: "PROJ-103",
    title: "Road Diversion Sign Vandalism",
    description: "Several traffic diversion signs on the eastern approach were vandalized overnight. Replacement signs needed urgently.",
    reportedBy: "Frank Moore",
    reportedDate: "2026-02-25",
    status: "Resolved",
    priority: "Medium",
    attachments: []
  }
];

export const dailyReports = [
  {
    id: "REP-301",
    projectId: "69c5f44d6d96266f92632953",
    date: "2026-02-27",
    submittedBy: "Bob Smith",
    weather: "Clear, 75°F",
    workCompleted: "Completed formwork for section 2 of the foundation.",
    materialsUsed: "200 sq ft of timber, 50 lbs of nails.",
    equipmentOnSite: ["Excavator (1)", "Concrete Mixer (2)"],
    workerCount: 15,
    notes: "Everything proceeded smoothly. Getting ready for tomorrow's concrete pour."
  },
  {
    id: "REP-302",
    projectId: "69c5f44d6d96266f92632953",
    date: "2026-02-28",
    submittedBy: "Bob Smith",
    weather: "Light Rain, 65°F",
    workCompleted: "Started preliminary concrete pour for section 1. Rain delayed progress in the afternoon.",
    materialsUsed: "120 cubic yards of concrete.",
    equipmentOnSite: ["Concrete Mixer (2)", "Pump Truck (1)"],
    workerCount: 12,
    notes: "Pump truck had minor issues but was resolved quickly. Check ISS-202."
  },
  {
    id: "REP-303",
    projectId: "69c5f44d6d96266f92632953",
    date: "2026-03-01",
    submittedBy: "Bob Smith",
    weather: "Overcast, 70°F",
    workCompleted: "Continued concrete pours on sections 2 & 3. Rebar inspected and approved for section 4.",
    materialsUsed: "180 cubic yards of concrete, 2 tons of rebar.",
    equipmentOnSite: ["Concrete Mixer (2)", "Pump Truck (1)", "Mobile Crane (1)"],
    workerCount: 18,
    notes: "No incidents. Steel delivery expected tomorrow morning."
  },
  {
    id: "REP-304",
    projectId: "PROJ-103",
    date: "2026-02-26",
    submittedBy: "Frank Moore",
    weather: "Sunny, 80°F",
    workCompleted: "Installed 60m of guardrail on the western side of the overpass. All welds inspected.",
    materialsUsed: "60m galvanised steel guardrail, welding consumables.",
    equipmentOnSite: ["Welding Rig (2)", "Scissor Lift (1)", "Pickup Trucks (3)"],
    workerCount: 10,
    notes: "Progress on track. Eastern side guardrail installation starts tomorrow."
  },
  {
    id: "REP-305",
    projectId: "PROJ-104",
    date: "2026-02-28",
    submittedBy: "Mike Tanaka",
    weather: "Clear, 78°F",
    workCompleted: "Completed erection of steel columns for grid lines A1-A8 on level 2.",
    materialsUsed: "32 steel column sections (UC 254x254x89).",
    equipmentOnSite: ["Tower Crane (1)", "Welding Rig (2)", "Man Lift (2)"],
    workerCount: 14,
    notes: "Crane inspection certificate valid until end of month. Renewal submitted."
  }
];

export const safetyObservations = [
  {
    id: "SAF-501",
    projectId: "69c5f44d6d96266f92632953",
    date: "2026-02-25",
    observer: "Tom Harris",
    type: "Hazard",
    description: "Several workers seen near excavation edge without proper fall protection harnesses.",
    actionTaken: "Brought it to foreman's attention immediately. Harnesses were supplied and worn.",
    status: "Resolved",
    severity: "High"
  },
  {
    id: "SAF-502",
    projectId: "PROJ-102",
    date: "2025-06-05",
    observer: "Tom Harris",
    type: "Best Practice",
    description: "Site clearing team wearing complete PPE correctly despite the high heat condition.",
    actionTaken: "Commended the team during the daily huddle.",
    status: "Closed",
    severity: "Low"
  },
  {
    id: "SAF-503",
    projectId: "PROJ-103",
    date: "2026-02-18",
    observer: "Dana Cross",
    type: "Near Miss",
    description: "A steel beam swung unexpectedly during lift due to wind. No injuries, but workers in adjacent area had to clear out quickly.",
    actionTaken: "Lift operations suspended until wind speed monitoring equipment was installed. Revised lift plan approved.",
    status: "Resolved",
    severity: "High"
  },
  {
    id: "SAF-504",
    projectId: "PROJ-104",
    date: "2026-02-22",
    observer: "Tom Harris",
    type: "Hazard",
    description: "Unguarded floor openings on level 2 during steel erection phase. Missing edge protection hoarding.",
    actionTaken: "Work halted until temporary edge protection and safety nets installed. Resumed after inspection.",
    status: "Resolved",
    severity: "High"
  },
  {
    id: "SAF-505",
    projectId: "69c5f44d6d96266f92632953",
    date: "2026-03-01",
    observer: "Dana Cross",
    type: "Best Practice",
    description: "Foreman John Doe conducted a thorough pre-task briefing (toolbox talk) before morning concrete pour.",
    actionTaken: "Noted in the site diary. Practice to be encouraged across all projects.",
    status: "Closed",
    severity: "Low"
  }
];

export const stopHoldNotices = [
  {
    id: "SHN-901",
    projectId: "69c5f44d6d96266f92632953",
    dateIssued: "2026-02-20",
    issuedBy: "Tom Harris",
    reason: "Failed scaffold inspection on the west wing. Scaffold structure is unstable.",
    affectedArea: "West Wing Scaffolding",
    status: "Lifted",
    dateLifted: "2026-02-22",
    resolution: "Contractor redesigned the base and reinforced the structure. Passed secondary inspection."
  },
  {
    id: "SHN-902",
    projectId: "69c5f44d6d96266f92632953",
    dateIssued: "2026-02-28",
    issuedBy: "Municipal Inspector",
    reason: "Unexpected discovery of an underground utility line not marked on surveys.",
    affectedArea: "Excavation Zone C",
    status: "Active",
    dateLifted: null,
    resolution: "Awaiting survey team map update and utility company clearance."
  },
  {
    id: "SHN-903",
    projectId: "PROJ-103",
    dateIssued: "2026-02-11",
    issuedBy: "Quality Control - Fiona Huang",
    reason: "Concrete batch 7 failed compressive strength tests. Affected bridge deck section must be demolished before work can resume.",
    affectedArea: "Bridge Deck - Span 3 East",
    status: "Active",
    dateLifted: null,
    resolution: "Investigation ongoing. Demolition of affected section planned for week of 2026-03-04."
  },
  {
    id: "SHN-904",
    projectId: "PROJ-104",
    dateIssued: "2026-02-23",
    issuedBy: "Tom Harris",
    reason: "Level 2 floor openings left unguarded overnight after steel erection works. Immediate safety stop issued.",
    affectedArea: "Level 2 - Grid Lines A to C",
    status: "Lifted",
    dateLifted: "2026-02-24",
    resolution: "All openings fitted with rigid crash decking and edge protection hoarding. Approved by safety officer."
  }
];
