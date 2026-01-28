const express = require('express');
const cors = require('cors');
const { router } = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'OPD Token Allocation Engine',
    version: '1.0.0',
    description: 'Hospital OPD token management system with elastic capacity',
    endpoints: {
      allocateToken: 'POST /api/tokens/allocate',
      reallocateToken: 'POST /api/tokens/:tokenId/reallocate',
      cancelToken: 'POST /api/tokens/:tokenId/cancel',
      markNoShow: 'POST /api/tokens/:tokenId/noshow',
      emergencyToken: 'POST /api/tokens/emergency',
      getToken: 'GET /api/tokens/:tokenId',
      getSlot: 'GET /api/slots/:slotId',
      getDoctorSchedule: 'GET /api/doctors/:doctorId/schedule',
      getAllSchedules: 'GET /api/schedules'
    }
  });
});

app.use('/api', router);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`OPD Token Allocation Engine running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
});

module.exports = app;
