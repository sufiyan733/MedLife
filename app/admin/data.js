// ─── STATIC DATA FOR ADMIN PANEL ──────────────────────────────────────────────

export const HOSPITALS = [
  { id:1, name:'Apollo Hospitals', loc:'Bandra, Mumbai', beds:284, maxBeds:500, icu:12, maxIcu:40, status:'open', dept:['Cardiology','Neurology','Orthopedics','Oncology','Emergency'], rating:4.8, phone:'+91 22 2345 6789', ambulances:12 },
  { id:2, name:'Kokilaben Hospital', loc:'Andheri West, Mumbai', beds:67, maxBeds:400, icu:3, maxIcu:30, status:'limited', dept:['Cardiology','Gastro','Pediatrics','General'], rating:4.6, phone:'+91 22 3456 7890', ambulances:8 },
  { id:3, name:'Lilavati Hospital', loc:'Bandra, Mumbai', beds:142, maxBeds:350, icu:18, maxIcu:35, status:'open', dept:['Neurology','Urology','ENT','Emergency'], rating:4.7, phone:'+91 22 4567 8901', ambulances:10 },
  { id:4, name:'Nanavati Hospital', loc:'Vile Parle, Mumbai', beds:12, maxBeds:300, icu:0, maxIcu:25, status:'critical', dept:['General','Orthopedics','Emergency'], rating:4.5, phone:'+91 22 5678 9012', ambulances:6 },
  { id:5, name:'Breach Candy Hospital', loc:'Breach Candy, Mumbai', beds:5, maxBeds:200, icu:1, maxIcu:20, status:'critical', dept:['Cardiology','Dermatology','Emergency'], rating:4.9, phone:'+91 22 6789 0123', ambulances:5 },
  { id:6, name:'Hinduja Hospital', loc:'Mahim, Mumbai', beds:89, maxBeds:320, icu:9, maxIcu:28, status:'open', dept:['Oncology','Nephrology','General','Pediatrics'], rating:4.7, phone:'+91 22 7890 1234', ambulances:9 },
  { id:7, name:'Wockhardt Hospital', loc:'South Mumbai', beds:34, maxBeds:280, icu:4, maxIcu:22, status:'limited', dept:['Cardiology','Orthopedics','Neurology'], rating:4.4, phone:'+91 22 8901 2345', ambulances:7 },
  { id:8, name:'Fortis Hospital', loc:'Mulund, Mumbai', beds:198, maxBeds:420, icu:22, maxIcu:38, status:'open', dept:['Oncology','Cardiology','Neurology','Urology'], rating:4.6, phone:'+91 22 9012 3456', ambulances:11 },
  { id:9, name:'Jaslok Hospital', loc:'Pedder Road, Mumbai', beds:56, maxBeds:250, icu:6, maxIcu:18, status:'limited', dept:['General','ENT','Orthopedics'], rating:4.5, phone:'+91 22 0123 4567', ambulances:6 },
];

export const PATIENTS = [
  { id:1, name:'Rahul M., 54M', sev:'high', dest:'Apollo Hospitals', time:'2m ago', eta:'8 min' },
  { id:2, name:'Priya S., 28F', sev:'med', dest:'Lilavati Hospital', time:'4m ago', eta:'12 min' },
  { id:3, name:'Kiran D., 71M', sev:'high', dest:'Kokilaben Hospital', time:'6m ago', eta:'15 min' },
  { id:4, name:'Meera T., 45F', sev:'low', dest:'Hinduja Hospital', time:'9m ago', eta:'19 min' },
  { id:5, name:'Arun P., 38M', sev:'med', dest:'Nanavati Hospital', time:'11m ago', eta:'6 min' },
  { id:6, name:'Sunita R., 62F', sev:'high', dest:'Apollo Hospitals', time:'14m ago', eta:'22 min' },
  { id:7, name:'Dev K., 33M', sev:'low', dest:'Wockhardt Hospital', time:'17m ago', eta:'9 min' },
  { id:8, name:'Anita V., 48F', sev:'med', dest:'Breach Candy Hospital', time:'20m ago', eta:'5 min' },
];

export const ALERT_POOL = [
  { hospital:'Nanavati Hospital', msg:'0 ICU beds remaining. Diverting critical cases.', type:'red' },
  { hospital:'Breach Candy Hospital', msg:'Only 5 beds available. Emergency overflow required.', type:'red' },
  { hospital:'Wockhardt Hospital', msg:'ICU at 82% capacity. Escalation recommended.', type:'amber' },
  { hospital:'Kokilaben Hospital', msg:'Trauma bay at full capacity. Incoming diverted.', type:'red' },
  { hospital:'Apollo Hospitals', msg:'Surge protocol active. Requesting 20 additional staff.', type:'amber' },
  { hospital:'Lilavati Hospital', msg:'Power unit B on backup generator. Monitoring.', type:'amber' },
  { hospital:'Hinduja Hospital', msg:'3 ICU beds remaining. Critical intake paused.', type:'red' },
  { hospital:'Nanavati Hospital', msg:'Blood bank stock critically low. Requesting transfer.', type:'red' },
  { hospital:'Wockhardt Hospital', msg:'Ambulance queue at 7. ETA delays expected.', type:'amber' },
  { hospital:'Breach Candy Hospital', msg:'Ventilator shortage reported. 2 units needed urgently.', type:'red' },
];

export const APPOINTMENTS = [
  { id:'ML-A8FK2', patient:'Rahul Mehta', phone:'+91 98765 43210', hospital:'Apollo Hospitals', dept:'Cardiology', date:'2026-04-07', time:'10:00 AM', status:'confirmed', token:'TK-0042' },
  { id:'ML-B3GH7', patient:'Priya Sharma', phone:'+91 87654 32109', hospital:'Lilavati Hospital', dept:'Neurology', date:'2026-04-07', time:'11:30 AM', status:'confirmed', token:'TK-0043' },
  { id:'ML-C9JK1', patient:'Kiran Das', phone:'+91 76543 21098', hospital:'Kokilaben Hospital', dept:'Orthopedics', date:'2026-04-07', time:'2:00 PM', status:'pending', token:'TK-0044' },
  { id:'ML-D2LM5', patient:'Meera Tiwari', phone:'+91 65432 10987', hospital:'Hinduja Hospital', dept:'Oncology', date:'2026-04-06', time:'9:30 AM', status:'completed', token:'TK-0039' },
  { id:'ML-E7NP3', patient:'Arun Patel', phone:'+91 54321 09876', hospital:'Nanavati Hospital', dept:'General', date:'2026-04-06', time:'3:00 PM', status:'cancelled', token:'TK-0040' },
  { id:'ML-F1QR8', patient:'Sunita Roy', phone:'+91 43210 98765', hospital:'Apollo Hospitals', dept:'Emergency', date:'2026-04-08', time:'8:00 AM', status:'confirmed', token:'TK-0045' },
  { id:'ML-G4ST6', patient:'Dev Kumar', phone:'+91 32109 87654', hospital:'Wockhardt Hospital', dept:'Cardiology', date:'2026-04-08', time:'10:30 AM', status:'pending', token:'TK-0046' },
  { id:'ML-H6UV2', patient:'Anita Verma', phone:'+91 21098 76543', hospital:'Breach Candy Hospital', dept:'Dermatology', date:'2026-04-08', time:'1:00 PM', status:'confirmed', token:'TK-0047' },
  { id:'ML-I8WX9', patient:'Rohit Gupta', phone:'+91 10987 65432', hospital:'Fortis Hospital', dept:'Urology', date:'2026-04-05', time:'4:00 PM', status:'completed', token:'TK-0036' },
  { id:'ML-J3YZ4', patient:'Neha Bhatt', phone:'+91 09876 54321', hospital:'Jaslok Hospital', dept:'ENT', date:'2026-04-05', time:'11:00 AM', status:'completed', token:'TK-0035' },
  { id:'ML-K5AB1', patient:'Vikram Singh', phone:'+91 98712 34560', hospital:'Apollo Hospitals', dept:'Neurology', date:'2026-04-09', time:'9:00 AM', status:'pending', token:'TK-0048' },
  { id:'ML-L7CD8', patient:'Sanjana Mishra', phone:'+91 87601 23459', hospital:'Hinduja Hospital', dept:'Pediatrics', date:'2026-04-04', time:'2:30 PM', status:'cancelled', token:'TK-0033' },
];

export const USERS = [
  { id:'u1', name:'Rahul Mehta', email:'rahul.m@mail.com', role:'patient', joined:'2026-03-15', appts:3, lastActive:'2h ago', avatar:'RM' },
  { id:'u2', name:'Dr. Priya Sharma', email:'priya.s@hospital.com', role:'doctor', joined:'2026-02-20', appts:0, lastActive:'1h ago', avatar:'PS' },
  { id:'u3', name:'Kiran Das', email:'kiran.d@mail.com', role:'patient', joined:'2026-03-28', appts:1, lastActive:'5h ago', avatar:'KD' },
  { id:'u4', name:'Admin Sufiyan', email:'sufiyan@medilife.com', role:'admin', joined:'2026-01-10', appts:0, lastActive:'Just now', avatar:'AS' },
  { id:'u5', name:'Meera Tiwari', email:'meera.t@mail.com', role:'patient', joined:'2026-04-01', appts:2, lastActive:'1d ago', avatar:'MT' },
  { id:'u6', name:'Dr. Arun Patel', email:'arun.p@hospital.com', role:'doctor', joined:'2026-02-15', appts:0, lastActive:'3h ago', avatar:'AP' },
  { id:'u7', name:'Sunita Roy', email:'sunita.r@mail.com', role:'patient', joined:'2026-03-22', appts:1, lastActive:'12h ago', avatar:'SR' },
  { id:'u8', name:'Dev Kumar', email:'dev.k@mail.com', role:'patient', joined:'2026-04-03', appts:1, lastActive:'6h ago', avatar:'DK' },
  { id:'u9', name:'Anita Verma', email:'anita.v@mail.com', role:'patient', joined:'2026-03-30', appts:2, lastActive:'4h ago', avatar:'AV' },
  { id:'u10', name:'Dr. Rohit Gupta', email:'rohit.g@hospital.com', role:'doctor', joined:'2026-01-25', appts:0, lastActive:'30m ago', avatar:'RG' },
];

export const DEPT_STATS = [
  { name:'Cardiology', count:34, color:'#ff3366' },
  { name:'Neurology', count:22, color:'#00a8ff' },
  { name:'Orthopedics', count:18, color:'#00ff9d' },
  { name:'Oncology', count:15, color:'#9b6dff' },
  { name:'Emergency', count:28, color:'#ffaa00' },
  { name:'General', count:41, color:'#00e5ff' },
  { name:'Pediatrics', count:12, color:'#ff9f43' },
  { name:'ENT', count:8, color:'#a29bfe' },
];

export const DAILY_TRENDS = [
  { day:'Mon', appts:42, beds:312 }, { day:'Tue', appts:38, beds:298 },
  { day:'Wed', appts:55, beds:275 }, { day:'Thu', appts:47, beds:289 },
  { day:'Fri', appts:61, beds:264 }, { day:'Sat', appts:33, beds:301 },
  { day:'Sun', appts:28, beds:318 },
];

export const CHART_LABELS = ['6h','5h','4h','3h','2h','1h','Now','+1h','+2h','+3h','+4h'];
export const CHART_ACTUAL = [52,55,58,61,63,67,71,null,null,null,null];
export const CHART_PREDICTED = [null,null,null,null,null,null,71,74,78,82,86];

// Patient generation
const FIRST = ['Rahul','Priya','Kiran','Meera','Arun','Sunita','Dev','Anita','Rohit','Neha','Vikram','Sanjana','Amit','Pooja','Rajesh','Kavya','Suresh','Divya','Manish','Asha'];
const LAST = ['M.','S.','D.','T.','P.','R.','K.','V.','G.','B.'];
const DESTS = ['Apollo Hospitals','Kokilaben Hospital','Lilavati Hospital','Hinduja Hospital','Wockhardt Hospital','Nanavati Hospital','Breach Candy Hospital','Fortis Hospital'];
const SEVS = ['high','high','med','med','med','low'];
const ETAS = ['4 min','6 min','8 min','11 min','14 min','18 min','22 min','26 min'];
let _pid = 100;
export function genPatient() {
  const f = FIRST[Math.floor(Math.random()*FIRST.length)];
  const l = LAST[Math.floor(Math.random()*LAST.length)];
  const a = 18+Math.floor(Math.random()*62);
  const g = Math.random()>0.5?'M':'F';
  return { id:++_pid, name:`${f} ${l}, ${a}${g}`, sev:SEVS[Math.floor(Math.random()*SEVS.length)], dest:DESTS[Math.floor(Math.random()*DESTS.length)], time:'just now', eta:ETAS[Math.floor(Math.random()*ETAS.length)] };
}
