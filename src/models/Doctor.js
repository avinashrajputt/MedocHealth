class Doctor {
  constructor(id, name, specialization, slots = []) {
    this.id = id;
    this.name = name;
    this.specialization = specialization;
    this.slots = slots;
  }

  addSlot(slot) {
    this.slots.push(slot);
  }

  getSlot(slotId) {
    return this.slots.find(s => s.id === slotId);
  }

  getAllSlots() {
    return this.slots;
  }
}

module.exports = Doctor;
