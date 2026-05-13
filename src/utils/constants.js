//Role badge colours and labels
export const ROLE_COLORS ={
     ADM: "#6366f1", HRM: "#8b5cf6", REC: "#0ea5e9", CCO: "#10b981",
     FCO: "#f59e0b", GYN: "#ec4899", ANE: "#14b8a6", EMB: "#f97316",
     NUR: "#06b6d4", PHA: "#84cc16", TEC: "#a78bfa", AND: "#fb7185", PAT: "#64748b",
};

export const ROLE_LABELS ={
     ADM:"Admin", HRM:"HR Manager", REC:"Receptionist", CCO:"Clinical Counsellor",
     FCO:"Financial Counsellor", GYN:"Gynaecologist", ANE:"Anesthesiologist",
     EMB:"Embryologist", NUR:"Nurse", PHA:"Pharmacist", TEC:"Lab Technician", AND:"Andrology Tech",PAT: "Patient",
};

export const ROLES = [
  { value:"",label:"All Roles" },
  { value:"ADM", label:"Admin" },
  { value:"HRM", label:"HR Manager" },
  { value:"REC", label:"Receptionist" },
  { value:"CCO", label:"Clincial Counsellor" },
  { value:"FCO", label:"Financial Counsellor" },
  { value:"END", label:"Reproductive Endocronologist"},
  { value:"GYN", label:"Gynaecologist" },
  { value:"ANE", label:"Anesthesiologist" },
  { value:"EMB", label:"Embryologist" },
  { value:"NUR", label:"Nurse" },
  { value:"PHA", label:"Pharmacist" },
  { value:"TEC", label:"Lab Technician" },
  { value:"AND", label:"Andrology Technician" },
];

// Role-specific permission fields
export const ROLE_PERMISSIONS = {
  REC:[
   {name: "can_register_patient",label:"Can Register Patients"},
   {name: "can_access_billing",label:"Can Access Billing"},
   {name: "can_modify_patient_records",label:"Can Modify Patient Records"},
   {name: "can_schedule_appointments",label:"Can Schedule Appointments"},
  { name: "is_department_head", label: "Is Department Head" },
  ],
  CCO: [
   {name:"is_department_head", label:"Is Department Head"},
  ],
  FCO: [
   {name:"can_approve_discounts", label:"Can Approve Discounts" },
   {name:"can_override_insurance", label:"Can Override Insurance" },
  { name: "is_department_head", label: "Is Department Head" },
  ],
  END: [
   {name:"can_perform_egg_retrieval",label:"Can Perform Egg Retrieval"},
   {name:"can_perform_embryo_transfer",label:"Can Perform Embryo Transfer"},
   {name:"can_design_ivf_protocols",label:"Can Design IVF Protocols"},
   {name:"is_department_head",label:"Is Department Head"},
  ],
  GYN: [
    {name:"can_perform_egg_retrieval",label:"Can Perform Embryo Transfer"},
    {name:"can_assist_ivf",label:"Can Assist IVF"},
    {name:"is_department_head",label:"Is Department Head"},
  ],
  ANE: [
    {name:"edit_anesthesia_records",label:"Edit Anesthesia Records"},
    {name:"is_department_head",label:"Is Department Head"},
  ],
  EMB: [
   {name:"can_perform_icsi",label:"Can Perform ICSI"},
   {name:"can_perform_biopsy",label:"Can Perform Biopsy"},
   { name: "is_department_head", label: "Is Department Head"},
  ],
  NUR: [
   {name:"is_head_nurse",label:"Is Head Nurse"},
   {name:"is_department_head",label:"Is Department Head"},
  ],
  PHA: [
    {name:"can_manage_inventory",label:"Can Manage Inventory"},
    {name:"is_department_head",label:"Is Department Head"},
  ],
  TEC: [
    {name:"is_department_head",label:"Is Department Head"},
  ],
  AND:[
    {name:"can_perform_dna_frag",label:"Can Perform DNA Fragmentation"},
    {name:"can_perform_cryo",label:"Can Perform Cryopreservation"},
    {name:"is_department_head",label:"Is Department Head"},
  ],
  HRM: [
   {name:"can_approve_leaves", label:"Can Approve Leaves"},
   {name:"can_view_salaries", label:"Can View Salaries"},
   {name:"can_terminate_staff", label:"Can Terminate Staff"},
   {name:"can_edit_attendance", label:"Can Edit Attendance"},
   {name:"can_generate_payslips", label:"Can Generate Payslips"},
   {name:"can_update_documents", label:"Can Update Documents"},
  { name: "is_department_head",    label: "Is Department Head" },
  ],
};

export const ROLE_DEFAULT_DEPT_CODE = {
	  'ADM': 'ADM',
	  'HRM': 'HRM',
	  'REC': 'REC',
    'CCO': 'CCO',
    'FCO': 'FCO',
    'REN': 'REN',
    'GYN': 'GYN',
    'ANE': 'ANE',
    'EMB': 'EMB',
    'AND': 'AND',
    'TEC': 'TEC',
    'NUR': 'NUR',
    'PHA': 'PHA',
}

export const ROLE_SECONDARY_DEPTS = {
  NUR: ['GYN', 'ANE', 'EMB', 'AND', 'TEC','END'], // Nurses can work in these
  ANE: ['GYN', 'EMB'],
  EMB: ['AND', 'END'],
  GYN: ['END', 'EMB'],
  // add others as needed
};

export const DEPARTMENT_UNITS = {
  GYN: ['OPD', 'OT', 'OPU Room', 'Ward'],
  EMB: ['IVF Lab', 'Cryo Lab'],
  ANE: ['OT', 'Recovery Room'],
  NUR: ['Ward', 'OT', 'OPD', 'ICU'],
  AND: ['Andrology Lab', 'Semen Analysis'],
  TEC: ['Blood Lab', 'Hormone Lab', 'General Lab'],
};

export const DEPT_ICONS={
  ADM: "🏛️", HRM: "👥", REC: "🗂️", CCO: "🧠", FCO: "💰", REN: "🔬", GYN: "🩺", ANE: "💉", EMB: "🧫", AND: "🔭", TEC: "🧪", NUR: "🩹", PHA: "💊",
}

export const STATUS_COLORS={
  PEN: { bg:"#fef9c3", color:"#854d0e", label:"Pending" },
  ACT: { bg:"#dcfce7", color:"#15803d", label:"Active Treatment"},
  HOL: { bg:"#fef3c7", color:"#92400e", label:"On Hold"},
  COM: { bg:"#dbeafe", color:"#1d4ed8", label:"Completed"},
  CAN: { bg:"#fee2e2", color:"#dc2626", label:"Cancelled"},
};

export const TREATMENT_LABELS={
  IVF:"IVF", IUI:"IUI", FET:"FET", ICSI:"ICSI", OI:"OI", IVM:"IVM", EGG_FREEZE:"Egg Freeze", SPERM_FREEZE:"Sperm Freeze", EMBRYO_FREEZE:"Embryo Freeze", PGT:"PGT", OTHER:"Other",
};

export const TREATMENT_TYPES=[
    {value:"IVF", label:"In Vitro Fertilization(IVF)"},
    {value:"IUI", label:"IntraUterine Insemination(IUI)"},
    {value:"FET", label:"Frozen Embryo Transfer(FET)"},
    {value:"ICSI", label:"IntraCytoplasmic Sperm Injection(ICSI)"},
    {value:"OI", label: "Ovulation Induction"},
    {value:"IVM", label:"In Vitro Maturation"},
    {value:"EGG_FREEZE", label:"Egg Freezing"},
    {value:"EMBRYO_FREEZE", label:"Egg Freezing"},
    {value:"SPERM_FREEZE", label:"Sperm Freeze"},
    {value:"PGT", label:"Preimplantation Genetic Testing{PGT}"},
    {value:"OTHER", label:"Other"},
  ];

export const PATIENT_STATUSES = [
    { value: "PEN", label: "Pending" },
    { value: "ACT", label: "Active Treatment" },
    { value: "HOL", label: "On Hold" },
    { value: "COM", label: "Completed" },
    { value: "CAN", label: "Cancelled" },
  ];
