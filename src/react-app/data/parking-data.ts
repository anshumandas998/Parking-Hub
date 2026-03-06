// Stub data for parking hub

type PaymentMethod = "Cash" | "UPI" | "Card";

export interface MoneyRecord {
  id: string;
  vehicleNumber: string;
  amount: number;
  method: PaymentMethod;
  timestamp: number;
  notes?: string;
}

export interface ParkingSlot {
  id: string;
  type: 'two-wheeler' | 'four-wheeler';
  isOccupied: boolean;
  vehicleNumber?: string;
  vehicleModel?: string;
  entryTime?: string;
}

export interface ParkingStats {
  twoWheeler: {
    total: number;
    occupied: number;
    available: number;
  };
  fourWheeler: {
    total: number;
    occupied: number;
    available: number;
  };
}

// Stub parking slots
export const initialTwoWheelerSlots: ParkingSlot[] = [
  { id: 'TW-001', type: 'two-wheeler', isOccupied: true, vehicleNumber: 'MH-12-AB-1234', vehicleModel: 'Honda Activa', entryTime: '09:30 AM' },
  { id: 'TW-002', type: 'two-wheeler', isOccupied: true, vehicleNumber: 'MH-12-CD-5678', vehicleModel: 'TVS Jupiter', entryTime: '10:15 AM' },
  { id: 'TW-003', type: 'two-wheeler', isOccupied: false },
  { id: 'TW-004', type: 'two-wheeler', isOccupied: true, vehicleNumber: 'MH-14-EF-9012', vehicleModel: 'Royal Enfield', entryTime: '08:45 AM' },
  { id: 'TW-005', type: 'two-wheeler', isOccupied: false },
  { id: 'TW-006', type: 'two-wheeler', isOccupied: false },
  { id: 'TW-007', type: 'two-wheeler', isOccupied: true, vehicleNumber: 'MH-12-GH-3456', vehicleModel: 'Hero Splendor', entryTime: '11:00 AM' },
  { id: 'TW-008', type: 'two-wheeler', isOccupied: false },
  { id: 'TW-009', type: 'two-wheeler', isOccupied: true, vehicleNumber: 'MH-15-IJ-7890', vehicleModel: 'Bajaj Pulsar', entryTime: '09:00 AM' },
  { id: 'TW-010', type: 'two-wheeler', isOccupied: false },
];

export const initialFourWheelerSlots: ParkingSlot[] = [
  { id: 'FW-001', type: 'four-wheeler', isOccupied: true, vehicleNumber: 'MH-12-KL-1111', vehicleModel: 'Maruti Swift', entryTime: '08:30 AM' },
  { id: 'FW-002', type: 'four-wheeler', isOccupied: false },
  { id: 'FW-003', type: 'four-wheeler', isOccupied: true, vehicleNumber: 'MH-12-MN-2222', vehicleModel: 'Hyundai Creta', entryTime: '09:45 AM' },
  { id: 'FW-004', type: 'four-wheeler', isOccupied: true, vehicleNumber: 'MH-14-OP-3333', vehicleModel: 'Honda City', entryTime: '10:30 AM' },
  { id: 'FW-005', type: 'four-wheeler', isOccupied: false },
  { id: 'FW-006', type: 'four-wheeler', isOccupied: true, vehicleNumber: 'MH-12-QR-4444', vehicleModel: 'Tata Nexon', entryTime: '11:15 AM' },
  { id: 'FW-007', type: 'four-wheeler', isOccupied: false },
  { id: 'FW-008', type: 'four-wheeler', isOccupied: true, vehicleNumber: 'MH-15-ST-5555', vehicleModel: 'Toyota Fortuner', entryTime: '07:00 AM' },
];

export function calculateStats(twoWheelerSlots: ParkingSlot[], fourWheelerSlots: ParkingSlot[]): ParkingStats {
  const twoWheelerOccupied = twoWheelerSlots.filter(s => s.isOccupied).length;
  const fourWheelerOccupied = fourWheelerSlots.filter(s => s.isOccupied).length;

  return {
    twoWheeler: {
      total: twoWheelerSlots.length,
      occupied: twoWheelerOccupied,
      available: twoWheelerSlots.length - twoWheelerOccupied,
    },
    fourWheeler: {
      total: fourWheelerSlots.length,
      occupied: fourWheelerOccupied,
      available: fourWheelerSlots.length - fourWheelerOccupied,
    },
  };
}

const MONEY_STORAGE_KEY = "parkspot_money_records";

export function getPaymentRecords(): MoneyRecord[] {
  try {
    const raw = localStorage.getItem(MONEY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MoneyRecord[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    return [];
  }
  return [];
}

export function hasValidPayment(vehicleNumber: string): boolean {
  const records = getPaymentRecords();
  const normalizedInput = vehicleNumber.trim().toUpperCase();
  return records.some(record => record.vehicleNumber.toUpperCase() === normalizedInput);
}
