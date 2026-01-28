const Doctor = require('./models/Doctor');
const Slot = require('./models/Slot');
const { TokenSource } = require('./models/Token');
const { engine } = require('./routes/api');

function createDoctors() {
  const doctors = [
    {
      id: 'DOC001',
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      slots: [
        { id: 'SLOT001', startTime: '09:00', endTime: '10:00', maxCapacity: 10 },
        { id: 'SLOT002', startTime: '10:00', endTime: '11:00', maxCapacity: 10 },
        { id: 'SLOT003', startTime: '11:00', endTime: '12:00', maxCapacity: 8 },
        { id: 'SLOT004', startTime: '14:00', endTime: '15:00', maxCapacity: 10 },
        { id: 'SLOT005', startTime: '15:00', endTime: '16:00', maxCapacity: 10 }
      ]
    },
    {
      id: 'DOC002',
      name: 'Dr. Michael Chen',
      specialization: 'Orthopedics',
      slots: [
        { id: 'SLOT006', startTime: '09:00', endTime: '10:00', maxCapacity: 12 },
        { id: 'SLOT007', startTime: '10:00', endTime: '11:00', maxCapacity: 12 },
        { id: 'SLOT008', startTime: '11:00', endTime: '12:00', maxCapacity: 10 },
        { id: 'SLOT009', startTime: '14:00', endTime: '15:00', maxCapacity: 12 }
      ]
    },
    {
      id: 'DOC003',
      name: 'Dr. Priya Sharma',
      specialization: 'Pediatrics',
      slots: [
        { id: 'SLOT010', startTime: '09:00', endTime: '10:00', maxCapacity: 15 },
        { id: 'SLOT011', startTime: '10:00', endTime: '11:00', maxCapacity: 15 },
        { id: 'SLOT012', startTime: '11:00', endTime: '12:00', maxCapacity: 12 },
        { id: 'SLOT013', startTime: '14:00', endTime: '15:00', maxCapacity: 15 },
        { id: 'SLOT014', startTime: '15:00', endTime: '16:00', maxCapacity: 12 }
      ]
    },
    {
      id: 'DOC004',
      name: 'Dr. Robert Williams',
      specialization: 'General Medicine',
      slots: [
        { id: 'SLOT015', startTime: '09:00', endTime: '10:00', maxCapacity: 20 },
        { id: 'SLOT016', startTime: '10:00', endTime: '11:00', maxCapacity: 20 },
        { id: 'SLOT017', startTime: '11:00', endTime: '12:00', maxCapacity: 18 }
      ]
    }
  ];

  doctors.forEach(docData => {
    const doctor = new Doctor(docData.id, docData.name, docData.specialization);
    docData.slots.forEach(slotData => {
      const slot = new Slot(
        slotData.id,
        docData.id,
        slotData.startTime,
        slotData.endTime,
        slotData.maxCapacity
      );
      doctor.addSlot(slot);
    });
    engine.addDoctor(doctor);
  });

  return doctors;
}

function simulateDay() {
  console.log('='.repeat(80));
  console.log('OPD TOKEN ALLOCATION SIMULATION - ONE DAY OPERATIONS');
  console.log('='.repeat(80));
  console.log();

  const doctors = createDoctors();
  console.log(`✓ Initialized ${doctors.length} doctors with their time slots\n`);

  console.log('--- MORNING OPERATIONS (09:00 - 12:00) ---\n');

  console.log('1. Online Bookings (Pre-scheduled)');
  const onlineBookings = [
    { patientId: 'P001', name: 'John Doe', doctorId: 'DOC001', slotId: 'SLOT001', source: TokenSource.ONLINE },
    { patientId: 'P002', name: 'Jane Smith', doctorId: 'DOC001', slotId: 'SLOT001', source: TokenSource.ONLINE },
    { patientId: 'P003', name: 'Bob Wilson', doctorId: 'DOC002', slotId: 'SLOT006', source: TokenSource.ONLINE },
    { patientId: 'P004', name: 'Alice Brown', doctorId: 'DOC003', slotId: 'SLOT010', source: TokenSource.ONLINE },
    { patientId: 'P005', name: 'Charlie Davis', doctorId: 'DOC004', slotId: 'SLOT015', source: TokenSource.ONLINE },
    { patientId: 'P006', name: 'Eva Martinez', doctorId: 'DOC001', slotId: 'SLOT002', source: TokenSource.ONLINE }
  ];

  onlineBookings.forEach(booking => {
    const token = engine.allocateToken(booking.patientId, booking.name, booking.doctorId, booking.slotId, booking.source);
    console.log(`   ✓ Token #${token.tokenNumber} allocated to ${booking.name} (${token.doctorId})`);
  });
  console.log();

  console.log('2. Walk-in Patients (OPD Desk)');
  const walkinPatients = [
    { patientId: 'P007', name: 'David Lee', doctorId: 'DOC001', source: TokenSource.WALKIN },
    { patientId: 'P008', name: 'Sophie Taylor', doctorId: 'DOC002', source: TokenSource.WALKIN },
    { patientId: 'P009', name: 'James Anderson', doctorId: 'DOC003', source: TokenSource.WALKIN },
    { patientId: 'P010', name: 'Emma White', doctorId: 'DOC004', source: TokenSource.WALKIN },
    { patientId: 'P011', name: 'Oliver Harris', doctorId: 'DOC001', source: TokenSource.WALKIN }
  ];

  walkinPatients.forEach(patient => {
    const token = engine.allocateToken(patient.patientId, patient.name, patient.doctorId, null, patient.source);
    console.log(`   ✓ Token #${token.tokenNumber} allocated to ${patient.name} (Walk-in, ${token.doctorId})`);
  });
  console.log();

  console.log('3. Priority Patients (Paid)');
  const priorityPatients = [
    { patientId: 'P012', name: 'William Clark', doctorId: 'DOC001', source: TokenSource.PRIORITY },
    { patientId: 'P013', name: 'Sophia Garcia', doctorId: 'DOC002', source: TokenSource.PRIORITY }
  ];

  priorityPatients.forEach(patient => {
    const token = engine.allocateToken(patient.patientId, patient.name, patient.doctorId, null, patient.source);
    console.log(`   ✓ Token #${token.tokenNumber} allocated to ${patient.name} (Priority, ${token.doctorId})`);
  });
  console.log();

  console.log('4. Follow-up Patients');
  const followupPatients = [
    { patientId: 'P014', name: 'Liam Rodriguez', doctorId: 'DOC001', source: TokenSource.FOLLOWUP },
    { patientId: 'P015', name: 'Mia Martinez', doctorId: 'DOC003', source: TokenSource.FOLLOWUP }
  ];

  followupPatients.forEach(patient => {
    const token = engine.allocateToken(patient.patientId, patient.name, patient.doctorId, null, patient.source);
    console.log(`   ✓ Token #${token.tokenNumber} allocated to ${patient.name} (Follow-up, ${token.doctorId})`);
  });
  console.log();

  console.log('--- EDGE CASE HANDLING ---\n');

  console.log('5. Emergency Insertion');
  const emergencyToken = engine.addEmergencyToken('P016', 'Emergency Patient - Lucas Moore', 'DOC001');
  console.log(`   ⚠ Emergency Token #${emergencyToken.tokenNumber} inserted for Lucas Moore`);
  console.log(`   Priority: ${emergencyToken.priority} (Highest priority)`);
  console.log();

  console.log('6. Cancellation');
  const allTokens = Array.from(engine.tokens.values());
  const tokenToCancel = allTokens.find(t => t.patientName === 'Jane Smith');
  if (tokenToCancel) {
    engine.cancelToken(tokenToCancel.id);
    console.log(`   ✓ Token #${tokenToCancel.tokenNumber} (${tokenToCancel.patientName}) cancelled`);
    console.log(`   Slot capacity freed for reallocation`);
  }
  console.log();

  console.log('7. No-Show Handling');
  const noShowToken = allTokens.find(t => t.patientName === 'Bob Wilson');
  if (noShowToken) {
    engine.markNoShow(noShowToken.id);
    console.log(`   ✓ Token #${noShowToken.tokenNumber} (${noShowToken.patientName}) marked as no-show`);
  }
  console.log();

  console.log('8. Additional Walk-ins (Testing Capacity)');
  for (let i = 17; i <= 25; i++) {
    try {
      const token = engine.allocateToken(`P${i.toString().padStart(3, '0')}`, `Patient ${i}`, 'DOC004', null, TokenSource.WALKIN);
      console.log(`   ✓ Token #${token.tokenNumber} allocated to Patient ${i}`);
    } catch (error) {
      console.log(`   ✗ Failed to allocate for Patient ${i}: ${error.message}`);
    }
  }
  console.log();

  console.log('--- FINAL SCHEDULE STATUS ---\n');

  doctors.forEach(docData => {
    const schedule = engine.getDoctorSchedule(docData.id);
    console.log(`${schedule.doctorName} (${schedule.specialization})`);
    console.log('-'.repeat(60));
    
    schedule.slots.forEach(slot => {
      const utilization = ((slot.currentCapacity / slot.maxCapacity) * 100).toFixed(1);
      console.log(`  ${slot.timeRange}: ${slot.currentCapacity}/${slot.maxCapacity} (${utilization}% full)`);
      
      if (slot.tokens.length > 0) {
        slot.tokens.slice(0, 3).forEach(token => {
          console.log(`    - Token #${token.tokenNumber}: ${token.patientName} [${token.source}] (Priority: ${token.priority})`);
        });
        if (slot.tokens.length > 3) {
          console.log(`    ... and ${slot.tokens.length - 3} more patients`);
        }
      }
    });
    console.log();
  });

  console.log('--- STATISTICS ---\n');
  
  const totalTokens = Array.from(engine.tokens.values());
  const stats = {
    total: totalTokens.length,
    online: totalTokens.filter(t => t.source === TokenSource.ONLINE).length,
    walkin: totalTokens.filter(t => t.source === TokenSource.WALKIN).length,
    priority: totalTokens.filter(t => t.source === TokenSource.PRIORITY).length,
    followup: totalTokens.filter(t => t.source === TokenSource.FOLLOWUP).length,
    emergency: totalTokens.filter(t => t.source === 'emergency').length,
    cancelled: totalTokens.filter(t => t.status === 'cancelled').length,
    noshow: totalTokens.filter(t => t.status === 'noshow').length,
    allocated: totalTokens.filter(t => t.status === 'allocated').length
  };

  console.log(`Total Tokens Generated: ${stats.total}`);
  console.log(`  - Online Bookings: ${stats.online}`);
  console.log(`  - Walk-ins: ${stats.walkin}`);
  console.log(`  - Priority: ${stats.priority}`);
  console.log(`  - Follow-up: ${stats.followup}`);
  console.log(`  - Emergency: ${stats.emergency}`);
  console.log();
  console.log(`Status Distribution:`);
  console.log(`  - Allocated: ${stats.allocated}`);
  console.log(`  - Cancelled: ${stats.cancelled}`);
  console.log(`  - No-show: ${stats.noshow}`);
  console.log();

  console.log('='.repeat(80));
  console.log('SIMULATION COMPLETED');
  console.log('='.repeat(80));
}

if (require.main === module) {
  simulateDay();
}

module.exports = { simulateDay, createDoctors };
