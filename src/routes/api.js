const express = require('express');
const TokenAllocationEngine = require('../services/TokenAllocationEngine');

const router = express.Router();
const engine = new TokenAllocationEngine();

router.post('/tokens/allocate', (req, res) => {
  try {
    const { patientId, patientName, doctorId, preferredSlotId, source } = req.body;

    if (!patientId || !patientName || !doctorId || !source) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = engine.allocateToken(patientId, patientName, doctorId, preferredSlotId, source);
    
    res.status(201).json({
      success: true,
      message: 'Token allocated successfully',
      data: token
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/tokens/:tokenId/reallocate', (req, res) => {
  try {
    const { tokenId } = req.params;
    const { newSlotId } = req.body;

    if (!newSlotId) {
      return res.status(400).json({ error: 'New slot ID required' });
    }

    const token = engine.reallocateToken(tokenId, newSlotId);
    
    res.json({
      success: true,
      message: 'Token reallocated successfully',
      data: token
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/tokens/:tokenId/cancel', (req, res) => {
  try {
    const { tokenId } = req.params;
    const token = engine.cancelToken(tokenId);
    
    res.json({
      success: true,
      message: 'Token cancelled successfully',
      data: token
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/tokens/:tokenId/noshow', (req, res) => {
  try {
    const { tokenId } = req.params;
    const token = engine.markNoShow(tokenId);
    
    res.json({
      success: true,
      message: 'Token marked as no-show',
      data: token
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/tokens/emergency', (req, res) => {
  try {
    const { patientId, patientName, doctorId } = req.body;

    if (!patientId || !patientName || !doctorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = engine.addEmergencyToken(patientId, patientName, doctorId);
    
    res.status(201).json({
      success: true,
      message: 'Emergency token allocated',
      data: token
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/tokens/:tokenId', (req, res) => {
  try {
    const { tokenId } = req.params;
    const tokenDetails = engine.getTokenDetails(tokenId);
    
    res.json({
      success: true,
      data: tokenDetails
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/slots/:slotId', (req, res) => {
  try {
    const { slotId } = req.params;
    const slotStatus = engine.getSlotStatus(slotId);
    
    res.json({
      success: true,
      data: slotStatus
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/doctors/:doctorId/schedule', (req, res) => {
  try {
    const { doctorId } = req.params;
    const schedule = engine.getDoctorSchedule(doctorId);
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/schedules', (req, res) => {
  try {
    const schedules = engine.getAllSchedules();
    
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = { router, engine };
