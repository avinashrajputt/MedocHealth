# OPD Token Allocation Engine

A production-ready token allocation system for hospital OPD (Outpatient Department) that supports elastic capacity management with dynamic reallocation.

## Overview

This system manages patient token allocation across multiple doctors and time slots, handling various patient sources (online bookings, walk-ins, priority patients, follow-ups) with intelligent prioritization and real-time capacity management.

## Features

- **Multi-source Token Allocation**: Online, walk-in, priority, and follow-up patients
- **Dynamic Slot Management**: Fixed time slots with configurable capacity
- **Smart Prioritization**: Automatic priority-based ordering
- **Real-time Reallocation**: Dynamic adjustment when slots change
- **Edge Case Handling**: Cancellations, no-shows, emergency insertions
- **RESTful API**: Complete API for integration
- **Simulation Tools**: Test scenarios with multiple doctors

## Installation

```bash
npm install
```

## Running the System

### Start the API Server
```bash
npm start
```
Server runs on `http://localhost:3000`

### Development Mode
```bash
npm run dev
```

### Run Simulation
```bash
npm run simulate
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Allocate Token
**POST** `/tokens/allocate`

Allocate a new token for a patient.

**Request Body:**
```json
{
  "patientId": "P001",
  "patientName": "John Doe",
  "doctorId": "DOC001",
  "preferredSlotId": "SLOT001",
  "source": "online"
}
```

**Sources:** `online`, `walkin`, `priority`, `followup`

**Response:**
```json
{
  "success": true,
  "message": "Token allocated successfully",
  "data": {
    "id": "uuid",
    "tokenNumber": 1,
    "patientId": "P001",
    "patientName": "John Doe",
    "doctorId": "DOC001",
    "slotId": "SLOT001",
    "source": "online",
    "priority": 50,
    "status": "allocated",
    "allocatedAt": "2026-01-29T10:00:00.000Z"
  }
}
```

#### 2. Reallocate Token
**POST** `/tokens/:tokenId/reallocate`

Move a token to a different slot.

**Request Body:**
```json
{
  "newSlotId": "SLOT002"
}
```

#### 3. Cancel Token
**POST** `/tokens/:tokenId/cancel`

Cancel a patient's token and free up capacity.

#### 4. Mark No-Show
**POST** `/tokens/:tokenId/noshow`

Mark a patient as no-show and free up capacity.

#### 5. Emergency Token
**POST** `/tokens/emergency`

Insert an emergency patient with highest priority.

**Request Body:**
```json
{
  "patientId": "P999",
  "patientName": "Emergency Patient",
  "doctorId": "DOC001"
}
```

#### 6. Get Token Details
**GET** `/tokens/:tokenId`

Retrieve complete token information including slot and doctor details.

#### 7. Get Slot Status
**GET** `/slots/:slotId`

View current status and all tokens for a specific slot.

#### 8. Get Doctor Schedule
**GET** `/doctors/:doctorId/schedule`

View complete schedule with all slots for a doctor.

#### 9. Get All Schedules
**GET** `/schedules`

View schedules for all doctors.

## Algorithm Design

### Priority System

The system uses a priority-based allocation strategy:

| Source | Priority Score | Description |
|--------|---------------|-------------|
| Emergency | 150 | Highest priority, can push other tokens |
| Priority (Paid) | 100 | Premium patients, high priority |
| Follow-up | 75 | Returning patients for continued care |
| Online | 50 | Pre-booked appointments |
| Walk-in | 25 | Same-day registrations |

### Allocation Logic

1. **Initial Allocation**
   - Check preferred slot availability
   - If unavailable, find best available slot (least occupied)
   - Assign token with priority-based ordering

2. **Dynamic Reallocation**
   - Triggered by cancellations or no-shows
   - Waiting tokens automatically promoted when capacity opens
   - Maintains priority order within slots

3. **Emergency Handling**
   - Emergency patients get highest priority (150)
   - If slot is full, pushes lowest priority patient to next slot
   - Automatically finds next available slot for pushed patients

4. **Capacity Enforcement**
   - Hard limits per slot strictly enforced
   - Exceeding capacity rejected with error
   - Real-time capacity tracking

### Edge Cases Handled

#### 1. **Cancellations**
- Immediately free slot capacity
- Trigger reallocation of waiting patients
- Update slot ordering

#### 2. **No-Shows**
- Mark token as no-show
- Free capacity for new allocations
- Maintain historical record

#### 3. **Emergency Insertions**
- Insert with highest priority
- Push lower priority patients if slot full
- Cascade reallocation to next available slots

#### 4. **Slot Overflow**
- Reject allocation with clear error
- Suggest alternative slots
- Maintain waiting list

#### 5. **Concurrent Requests**
- In-memory state management
- Atomic operations for capacity checks
- Consistent priority ordering

### Failure Handling

1. **Doctor Not Found**: Returns 400 with clear error message
2. **Slot Full**: Returns 400 indicating no available capacity
3. **Invalid Token**: Returns 404 for non-existent tokens
4. **Invalid Reallocation**: Validates new slot before moving
5. **Missing Required Fields**: Returns 400 with field validation

## Data Schema

### Doctor
```javascript
{
  id: String,
  name: String,
  specialization: String,
  slots: [Slot]
}
```

### Slot
```javascript
{
  id: String,
  doctorId: String,
  startTime: String,
  endTime: String,
  maxCapacity: Number,
  currentCapacity: Number,
  tokens: [Token],
  status: String
}
```

### Token
```javascript
{
  id: String (UUID),
  patientId: String,
  patientName: String,
  doctorId: String,
  slotId: String,
  source: String,
  tokenNumber: Number,
  priority: Number,
  status: String,
  allocatedAt: Date,
  updatedAt: Date
}
```

## Simulation

The simulation demonstrates a full OPD day with:
- 4 doctors across different specializations
- Multiple time slots per doctor
- Various patient types and scenarios
- Edge cases (cancellations, no-shows, emergencies)
- Capacity stress testing

**Run simulation:**
```bash
npm run simulate
```

## Trade-offs & Design Decisions

### 1. **In-Memory Storage**
- **Chosen**: In-memory Maps for fast access
- **Trade-off**: Data not persistent, resets on restart
- **Rationale**: Assignment focuses on algorithm; real implementation would use Redis/PostgreSQL

### 2. **Priority-Based Ordering**
- **Chosen**: Numeric priority with automatic sorting
- **Trade-off**: Fixed priority levels
- **Rationale**: Clear, predictable, and easy to extend

### 3. **Push-on-Emergency Strategy**
- **Chosen**: Push lowest priority to next slot
- **Trade-off**: May cascade delays
- **Rationale**: Realistic hospital behavior; emergencies take precedence

### 4. **Hard Capacity Limits**
- **Chosen**: Strict enforcement of maxCapacity
- **Trade-off**: May reject valid patients
- **Rationale**: Maintains service quality and realistic constraints

### 5. **Synchronous Operations**
- **Chosen**: Blocking operations for allocation
- **Trade-off**: Not suitable for high concurrency
- **Rationale**: Ensures consistency; production would use queues/locks

## Testing

Manual testing via API:

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P001",
    "patientName": "John Doe",
    "doctorId": "DOC001",
    "source": "online"
  }'
```

## Production Considerations

For production deployment, consider:

1. **Database**: PostgreSQL with transactions for consistency
2. **Caching**: Redis for real-time capacity tracking
3. **Queue System**: RabbitMQ for async operations
4. **Authentication**: JWT-based auth for API security
5. **Rate Limiting**: Prevent abuse and ensure fair access
6. **Monitoring**: Prometheus + Grafana for metrics
7. **Logging**: Structured logging with ELK stack
8. **WebSockets**: Real-time updates to OPD displays
9. **Load Balancing**: Horizontal scaling with session affinity
10. **Backup**: Regular snapshots of allocation state

## Architecture

```
src/
├── models/
│   ├── Doctor.js          # Doctor entity
│   ├── Slot.js            # Time slot management
│   └── Token.js           # Token entity with priority
├── services/
│   └── TokenAllocationEngine.js  # Core allocation logic
├── routes/
│   └── api.js             # REST API endpoints
├── server.js              # Express server setup
└── simulation.js          # OPD day simulation

```

## License

MIT