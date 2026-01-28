const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const { Token, TokenSource, TokenStatus } = require('../models/Token');

class TokenAllocationEngine {
  constructor() {
    this.doctors = new Map();
    this.slots = new Map();
    this.tokens = new Map();
    this.tokenCounter = 1;
  }

  addDoctor(doctor) {
    this.doctors.set(doctor.id, doctor);
    doctor.slots.forEach(slot => {
      this.slots.set(slot.id, slot);
    });
  }

  allocateToken(patientId, patientName, doctorId, preferredSlotId, source) {
    const doctor = this.doctors.get(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    let targetSlot = null;

    if (preferredSlotId) {
      const slot = this.slots.get(preferredSlotId);
      if (slot && slot.canAccommodate()) {
        targetSlot = slot;
      }
    }

    if (!targetSlot) {
      targetSlot = this.findBestAvailableSlot(doctor, source);
    }

    if (!targetSlot) {
      throw new Error('No available slots');
    }

    const token = new Token(
      patientId,
      patientName,
      doctorId,
      targetSlot.id,
      source,
      this.tokenCounter++
    );

    targetSlot.addToken(token);
    targetSlot.reorderTokens();
    this.tokens.set(token.id, token);

    return token;
  }

  findBestAvailableSlot(doctor, source) {
    const availableSlots = doctor.slots
      .filter(slot => slot.canAccommodate())
      .sort((a, b) => a.currentCapacity - b.currentCapacity);

    return availableSlots[0] || null;
  }

  reallocateToken(tokenId, newSlotId) {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    if (token.status !== TokenStatus.ALLOCATED && token.status !== TokenStatus.WAITING) {
      throw new Error('Token cannot be reallocated');
    }

    const oldSlot = this.slots.get(token.slotId);
    const newSlot = this.slots.get(newSlotId);

    if (!newSlot || !newSlot.canAccommodate()) {
      throw new Error('New slot not available');
    }

    oldSlot.removeToken(tokenId);
    token.slotId = newSlotId;
    token.updatedAt = new Date();
    newSlot.addToken(token);
    newSlot.reorderTokens();

    return token;
  }

  cancelToken(tokenId) {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    const slot = this.slots.get(token.slotId);
    slot.removeToken(tokenId);
    token.updateStatus(TokenStatus.CANCELLED);

    this.tryReallocateWaitingTokens(slot.doctorId);

    return token;
  }

  markNoShow(tokenId) {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    const slot = this.slots.get(token.slotId);
    slot.removeToken(tokenId);
    token.updateStatus(TokenStatus.NOSHOW);

    this.tryReallocateWaitingTokens(slot.doctorId);

    return token;
  }

  addEmergencyToken(patientId, patientName, doctorId) {
    const doctor = this.doctors.get(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const currentSlot = this.findCurrentOrNextSlot(doctor);
    if (!currentSlot) {
      throw new Error('No active slots available');
    }

    const token = new Token(
      patientId,
      patientName,
      doctorId,
      currentSlot.id,
      TokenSource.PRIORITY,
      this.tokenCounter++
    );
    
    token.markAsEmergency();

    if (currentSlot.canAccommodate()) {
      currentSlot.addToken(token);
    } else {
      const pushed = this.pushLowerPriorityToken(currentSlot);
      if (pushed) {
        currentSlot.addToken(token);
      } else {
        currentSlot.addToken(token);
      }
    }

    currentSlot.reorderTokens();
    this.tokens.set(token.id, token);

    return token;
  }

  pushLowerPriorityToken(slot) {
    const lowestPriorityToken = slot.tokens
      .filter(t => t.priority < 100)
      .sort((a, b) => a.priority - b.priority)[0];

    if (lowestPriorityToken) {
      const doctor = this.doctors.get(slot.doctorId);
      const nextSlot = this.findNextAvailableSlot(doctor, slot.id);
      
      if (nextSlot) {
        slot.removeToken(lowestPriorityToken.id);
        lowestPriorityToken.slotId = nextSlot.id;
        lowestPriorityToken.updateStatus(TokenStatus.WAITING);
        nextSlot.addToken(lowestPriorityToken);
        nextSlot.reorderTokens();
        return true;
      }
    }
    return false;
  }

  findNextAvailableSlot(doctor, currentSlotId) {
    const currentSlot = this.slots.get(currentSlotId);
    return doctor.slots
      .filter(s => s.startTime > currentSlot.startTime && s.canAccommodate())
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null;
  }

  findCurrentOrNextSlot(doctor) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return doctor.slots
      .filter(s => s.endTime >= currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || doctor.slots[0];
  }

  tryReallocateWaitingTokens(doctorId) {
    const doctor = this.doctors.get(doctorId);
    const waitingTokens = Array.from(this.tokens.values())
      .filter(t => t.doctorId === doctorId && t.status === TokenStatus.WAITING)
      .sort((a, b) => b.priority - a.priority);

    waitingTokens.forEach(token => {
      const targetSlot = this.findBestAvailableSlot(doctor, token.source);
      if (targetSlot && targetSlot.id !== token.slotId) {
        try {
          this.reallocateToken(token.id, targetSlot.id);
          token.updateStatus(TokenStatus.ALLOCATED);
        } catch (error) {
          console.error('Reallocation failed:', error.message);
        }
      }
    });
  }

  getSlotStatus(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error('Slot not found');
    }

    return {
      slotId: slot.id,
      doctorId: slot.doctorId,
      timeRange: `${slot.startTime} - ${slot.endTime}`,
      maxCapacity: slot.maxCapacity,
      currentCapacity: slot.currentCapacity,
      availableCapacity: slot.getAvailableCapacity(),
      tokens: slot.tokens.map(t => ({
        id: t.id,
        tokenNumber: t.tokenNumber,
        patientName: t.patientName,
        source: t.source,
        priority: t.priority,
        status: t.status
      }))
    };
  }

  getDoctorSchedule(doctorId) {
    const doctor = this.doctors.get(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      slots: doctor.slots.map(slot => this.getSlotStatus(slot.id))
    };
  }

  getAllSchedules() {
    return Array.from(this.doctors.values()).map(doctor => 
      this.getDoctorSchedule(doctor.id)
    );
  }

  getTokenDetails(tokenId) {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    const slot = this.slots.get(token.slotId);
    const doctor = this.doctors.get(token.doctorId);

    return {
      token: {
        id: token.id,
        tokenNumber: token.tokenNumber,
        patientId: token.patientId,
        patientName: token.patientName,
        source: token.source,
        priority: token.priority,
        status: token.status,
        allocatedAt: token.allocatedAt,
        updatedAt: token.updatedAt
      },
      slot: {
        id: slot.id,
        timeRange: `${slot.startTime} - ${slot.endTime}`,
        currentCapacity: slot.currentCapacity,
        maxCapacity: slot.maxCapacity
      },
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization
      }
    };
  }
}

module.exports = TokenAllocationEngine;
