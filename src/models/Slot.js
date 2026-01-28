class Slot {
  constructor(id, doctorId, startTime, endTime, maxCapacity) {
    this.id = id;
    this.doctorId = doctorId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.maxCapacity = maxCapacity;
    this.currentCapacity = 0;
    this.tokens = [];
    this.status = 'active';
  }

  canAccommodate() {
    return this.currentCapacity < this.maxCapacity && this.status === 'active';
  }

  addToken(token) {
    if (this.canAccommodate()) {
      this.tokens.push(token);
      this.currentCapacity++;
      return true;
    }
    return false;
  }

  removeToken(tokenId) {
    const index = this.tokens.findIndex(t => t.id === tokenId);
    if (index !== -1) {
      this.tokens.splice(index, 1);
      this.currentCapacity--;
      return true;
    }
    return false;
  }

  getAvailableCapacity() {
    return this.maxCapacity - this.currentCapacity;
  }

  reorderTokens() {
    this.tokens.sort((a, b) => b.priority - a.priority || a.tokenNumber - b.tokenNumber);
  }
}

module.exports = Slot;
