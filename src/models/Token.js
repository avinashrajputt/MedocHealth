const { v4: uuidv4 } = require('uuid');

const TokenSource = {
  ONLINE: 'online',
  WALKIN: 'walkin',
  PRIORITY: 'priority',
  FOLLOWUP: 'followup'
};

const TokenStatus = {
  ALLOCATED: 'allocated',
  CANCELLED: 'cancelled',
  NOSHOW: 'noshow',
  COMPLETED: 'completed',
  WAITING: 'waiting'
};

class Token {
  constructor(patientId, patientName, doctorId, slotId, source, tokenNumber) {
    this.id = uuidv4();
    this.patientId = patientId;
    this.patientName = patientName;
    this.doctorId = doctorId;
    this.slotId = slotId;
    this.source = source;
    this.tokenNumber = tokenNumber;
    this.priority = this.calculatePriority(source);
    this.status = TokenStatus.ALLOCATED;
    this.allocatedAt = new Date();
    this.updatedAt = new Date();
  }

  calculatePriority(source) {
    const priorityMap = {
      [TokenSource.PRIORITY]: 100,
      [TokenSource.FOLLOWUP]: 75,
      [TokenSource.ONLINE]: 50,
      [TokenSource.WALKIN]: 25
    };
    return priorityMap[source] || 0;
  }

  updateStatus(status) {
    this.status = status;
    this.updatedAt = new Date();
  }

  markAsEmergency() {
    this.priority = 150;
    this.source = 'emergency';
    this.updatedAt = new Date();
  }
}

module.exports = { Token, TokenSource, TokenStatus };
