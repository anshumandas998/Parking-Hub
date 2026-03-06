import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Bike, 
  ParkingCircle, 
  Clock, 
  History,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card';
import { Button } from '@/react-app/components/ui/button';
import { Input } from '@/react-app/components/ui/input';
import { Label } from '@/react-app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/react-app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/react-app/components/ui/select';
import {
  initialTwoWheelerSlots,
  initialFourWheelerSlots,
  calculateStats,
  type ParkingSlot,
  type MoneyRecord,
} from '@/react-app/data/parking-data';

type PaymentMethod = "Cash" | "UPI" | "Card";

const PARKING_STORAGE_KEY = "parkspot_parking_slots";
const MONEY_STORAGE_KEY = "parkspot_money_records";
const USER_VEHICLES_KEY = "parkspot_user_vehicles";

interface UserVehicle {
  id: string;
  vehicleNumber: string;
  vehicleModel: string;
  type: 'two-wheeler' | 'four-wheeler';
  slotId: string;
  entryTime: string;
  timestamp: number;
  hasPaid: boolean;
  amount?: number;
}

// Brand and model data for two-wheelers
const twoWheelerBrands = [
  { id: 'hero', name: 'Hero', models: ['Hero Splendor', 'Hero Passion', 'Hero Glamour', 'Hero XPulse', 'Hero Destini'] },
  { id: 'honda', name: 'Honda', models: ['Honda Activa', 'Honda Dio', 'Honda Grazia', 'Honda Unicorn', 'Honda CB Shine'] },
  { id: 'tvs', name: 'TVS', models: ['TVS Jupiter', 'TVS Ntorq', 'TVS Apache RTR', 'TVS Raider', 'TVS iQube'] },
  { id: 'bajaj', name: 'Bajaj', models: ['Bajaj Pulsar', 'Bajaj Platina', 'Bajaj Avenger', 'Bajaj Dominar', 'Bajaj Chetak'] },
  { id: 'royal_enfield', name: 'Royal Enfield', models: ['Royal Enfield Classic', 'Royal Enfield Bullet', 'Royal Enfield Himalayan', 'Royal Enfield Meteor', 'Royal Enfield Hunter'] },
  { id: 'yamaha', name: 'Yamaha', models: ['Yamaha Fascino', 'Yamaha Ray ZR', 'Yamaha MT-15', 'Yamaha R15', 'Yamaha FZ'] },
  { id: 'suzuki', name: 'Suzuki', models: ['Suzuki Access', 'Suzuki Burgman', 'Suzuki Gixxer', 'Suzuki Hayabusa', 'Suzuki V-Strom'] },
  { id: 'ktm', name: 'KTM', models: ['KTM Duke', 'KTM RC', 'KTM 390 Adventure', 'KTM 250 Duke', 'KTM 125 Duke'] },
];

// Brand and model data for four-wheelers
const fourWheelerBrands = [
  { id: 'maruti', name: 'Maruti', models: ['Maruti Swift', 'Maruti Baleno', 'Maruti WagonR', 'Maruti Dzire', 'Maruti Vitara Brezza', 'Maruti Ertiga', 'Maruti Ciaz', 'Maruti Alto'] },
  { id: 'hyundai', name: 'Hyundai', models: ['Hyundai Creta', 'Hyundai Venue', 'Hyundai i20', 'Hyundai Verna', 'Hyundai Aura', 'Hyundai Exter', 'Hyundai Tucson', 'Hyundai Santa Fe'] },
  { id: 'honda', name: 'Honda', models: ['Honda City', 'Honda Amaze', 'Honda Civic', 'Honda WR-V', 'Honda CR-V', 'Honda BR-V'] },
  { id: 'toyota', name: 'Toyota', models: ['Toyota Innova', 'Toyota Fortuner', 'Toyota Glanza', 'Toyota Urban Cruiser', 'Toyota Camry', 'Toyota Land Cruiser'] },
  { id: 'tata', name: 'Tata', models: ['Tata Nexon', 'Tata Punch', 'Tata Harrier', 'Tata Safari', 'Tata Tiago', 'Tata Altroz', 'Tata Tigor', 'Tata Indigo'] },
  { id: 'mahindra', name: 'Mahindra', models: ['Mahindra XUV500', 'Mahindra XUV300', 'Mahindra Thar', 'Mahindra Scorpio', 'Mahindra Marazzo', 'Mahindra KUV100', 'Mahindra Bolero'] },
  { id: 'kia', name: 'Kia', models: ['Kia Seltos', 'Kia Sonet', 'Kia Carens', 'Kia EV6', 'Kia Carnival'] },
  { id: 'volkswagen', name: 'Volkswagen', models: ['Volkswagen Polo', 'Volkswagen Vento', 'Volkswagen Ameo', 'Volkswagen T-Roc', 'Volkswagen Tiguan'] },
  { id: 'ford', name: 'Ford', models: ['Ford EcoSport', 'Ford Endeavour', 'Ford Figo', 'Ford Aspire', 'Ford Freestyle'] },
];

// Indian vehicle number regex pattern: XX-00-XX-0000 format
const INDIAN_VEHICLE_NUMBER_REGEX = /^[A-Z]{2}-[0-9]{2}-[A-Z]{1,2}-[0-9]{4}$/;

// Format vehicle number with dashes
const formatVehicleNumber = (value: string): string => {
  let cleaned = value.toUpperCase().replace(/\s/g, '');
  cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
  cleaned = cleaned.slice(0, 10);
  
  let formatted = '';
  for (let i = 0; i < cleaned.length; i++) {
    if (i === 2 || i === 4 || i === 6) {
      formatted += '-';
    }
    formatted += cleaned[i];
  }
  return formatted;
};

// Validate vehicle number
const validateVehicleNumber = (value: string, occupiedSlots: ParkingSlot[]): string => {
  if (!value.trim()) {
    return 'Vehicle number is required';
  }
  const normalized = value.toUpperCase().replace(/\s/g, '');
  if (!INDIAN_VEHICLE_NUMBER_REGEX.test(normalized)) {
    return 'Invalid format. Use: MH-12-AB-1234';
  }
  // Check if vehicle is already parked
  const isAlreadyParked = occupiedSlots.some(slot => 
    slot.vehicleNumber?.toUpperCase().replace(/\s/g, '') === normalized
  );
  if (isAlreadyParked) {
    return 'This vehicle is already parked';
  }
  return '';
};

function loadSlotsFromStorage(): { twoWheeler: ParkingSlot[]; fourWheeler: ParkingSlot[] } | null {
  try {
    const raw = localStorage.getItem(PARKING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.twoWheeler) && Array.isArray(parsed.fourWheeler)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function loadUserVehicles(): UserVehicle[] {
  try {
    const raw = localStorage.getItem(USER_VEHICLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveUserVehicles(vehicles: UserVehicle[]) {
  try {
    localStorage.setItem(USER_VEHICLES_KEY, JSON.stringify(vehicles));
  } catch {
    // ignore
  }
}

export default function UserPanel() {
  const [twoWheelerSlots, setTwoWheelerSlots] = useState<ParkingSlot[]>(() => {
    const saved = loadSlotsFromStorage();
    return saved?.twoWheeler || initialTwoWheelerSlots;
  });
  const [fourWheelerSlots, setFourWheelerSlots] = useState<ParkingSlot[]>(() => {
    const saved = loadSlotsFromStorage();
    return saved?.fourWheeler || initialFourWheelerSlots;
  });
  const [userVehicles, setUserVehicles] = useState<UserVehicle[]>(() => loadUserVehicles());
  const [moneyRecords, setMoneyRecords] = useState<MoneyRecord[]>([]);
  
  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(null);
  
  // Form states
  const [vehicleType, setVehicleType] = useState<'two-wheeler' | 'four-wheeler'>('four-wheeler');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [searchVehicle, setSearchVehicle] = useState('');
  
  // Admin mode removed - UserPanel is now only for users

  const stats = useMemo(
    () => calculateStats(twoWheelerSlots, fourWheelerSlots),
    [twoWheelerSlots, fourWheelerSlots]
  );

  // Load money records
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MONEY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MoneyRecord[];
        setMoneyRecords(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setMoneyRecords([]);
    }
  }, []);

  const allSlots = [...twoWheelerSlots, ...fourWheelerSlots];
  const availableSlots = allSlots.filter((s) => !s.isOccupied);

  const filteredAvailableSlots = availableSlots.filter(s => 
    vehicleType === 'two-wheeler' ? s.type === 'two-wheeler' : s.type === 'four-wheeler'
  );

  // Find user's vehicle by search
  const foundVehicle = useMemo(() => {
    if (!searchVehicle.trim()) return null;
    const normalized = searchVehicle.trim().toUpperCase();
    return userVehicles.find(v => 
      v.vehicleNumber.toUpperCase().includes(normalized) && !v.hasPaid
    );
  }, [searchVehicle, userVehicles]);

  const userHistory = useMemo(() => {
    return [...userVehicles]
      .filter(v => v.hasPaid)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [userVehicles]);

  const handleRegisterVehicle = () => {
    // Validate vehicle number
    const error = validateVehicleNumber(vehicleNumber, allSlots);
    if (error) {
      setVehicleNumberError(error);
      return;
    }

    if (!selectedSlot || !vehicleNumber.trim() || !vehicleBrand || !vehicleModel.trim()) return;

    // Get brand name and create full model string
    const brands = vehicleType === 'four-wheeler' ? fourWheelerBrands : twoWheelerBrands;
    const selectedBrandName = brands.find(b => b.id === vehicleBrand)?.name || '';
    const fullVehicleModel = `${selectedBrandName} ${vehicleModel}`;

    const slot = allSlots.find(s => s.id === selectedSlot);
    if (!slot) return;

    const now = new Date();
    const entryTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });

    const newVehicle: UserVehicle = {
      id: crypto.randomUUID(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleModel: fullVehicleModel,
      type: vehicleType,
      slotId: selectedSlot,
      entryTime,
      timestamp: now.getTime(),
      hasPaid: false,
    };

    // Update slot occupancy
    if (selectedSlot.startsWith('TW')) {
      setTwoWheelerSlots(prev => 
        prev.map(s => s.id === selectedSlot ? { 
          ...s, 
          isOccupied: true, 
          vehicleNumber: newVehicle.vehicleNumber,
          vehicleModel: newVehicle.vehicleModel,
          entryTime 
        } : s)
      );
    } else {
      setFourWheelerSlots(prev => 
        prev.map(s => s.id === selectedSlot ? { 
          ...s, 
          isOccupied: true, 
          vehicleNumber: newVehicle.vehicleNumber,
          vehicleModel: newVehicle.vehicleModel,
          entryTime 
        } : s)
      );
    }

    // Save user vehicle
    const updatedVehicles = [...userVehicles, newVehicle];
    setUserVehicles(updatedVehicles);
    saveUserVehicles(updatedVehicles);

    // Close dialog and reset form
    setRegisterDialogOpen(false);
    setVehicleType('four-wheeler');
    setVehicleBrand('');
    setVehicleModel('');
    setVehicleNumber('');
    setVehicleNumberError('');
    setSelectedSlot('');
    setSelectedVehicle(newVehicle);
    setPaymentDialogOpen(true);
  };

  const handlePayment = () => {
    if (!selectedVehicle) return;

    const rate = selectedVehicle.type === 'two-wheeler' ? 20 : 50;
    const hours = Math.max(1, Math.ceil((Date.now() - selectedVehicle.timestamp) / (1000 * 60 * 60)));
    const amount = rate * hours;

    // Create payment record
    const paymentRecord: MoneyRecord = {
      id: crypto.randomUUID(),
      vehicleNumber: selectedVehicle.vehicleNumber,
      amount,
      method: paymentMethod,
      timestamp: Date.now(),
    };

    // Save to money records
    const updatedRecords = [...moneyRecords, paymentRecord];
    setMoneyRecords(updatedRecords);
    try {
      localStorage.setItem(MONEY_STORAGE_KEY, JSON.stringify(updatedRecords));
    } catch {
      // ignore
    }

    // Update user vehicle as paid
    const updatedVehicles = userVehicles.map(v => 
      v.id === selectedVehicle.id ? { ...v, hasPaid: true, amount } : v
    );
    setUserVehicles(updatedVehicles);
    saveUserVehicles(updatedVehicles);

    // Release the slot
    if (selectedVehicle.slotId.startsWith('TW')) {
      setTwoWheelerSlots(prev => 
        prev.map(s => s.id === selectedVehicle.slotId ? {
          ...s,
          isOccupied: false,
          vehicleNumber: undefined,
          vehicleModel: undefined,
          entryTime: undefined
        } : s)
      );
    } else {
      setFourWheelerSlots(prev => 
        prev.map(s => s.id === selectedVehicle.slotId ? {
          ...s,
          isOccupied: false,
          vehicleNumber: undefined,
          vehicleModel: undefined,
          entryTime: undefined
        } : s)
      );
    }

    setPaymentDialogOpen(false);
    setSelectedVehicle(null);
    setPaymentMethod('UPI');
  };

  const calculateParkingFee = (vehicle: UserVehicle) => {
    const rate = vehicle.type === 'two-wheeler' ? 20 : 50;
    const hours = Math.max(1, Math.ceil((Date.now() - vehicle.timestamp) / (1000 * 60 * 60)));
    return rate * hours;
  };

  const statCards = [
    {
      title: 'Total Slots',
      value: stats.twoWheeler.total + stats.fourWheeler.total,
      icon: ParkingCircle,
      color: 'bg-blue-500',
      subtitle: `${stats.twoWheeler.occupied + stats.fourWheeler.occupied} occupied`,
    },
    {
      title: 'Two-Wheeler',
      value: `${stats.twoWheeler.available}/${stats.twoWheeler.total}`,
      icon: Bike,
      color: 'bg-green-500',
      subtitle: 'available',
    },
    {
      title: 'Four-Wheeler',
      value: `${stats.fourWheeler.available}/${stats.fourWheeler.total}`,
      icon: Car,
      color: 'bg-purple-500',
      subtitle: 'available',
    },
    {
      title: 'My Vehicles',
      value: userVehicles.filter(v => !v.hasPaid).length,
      icon: User,
      color: 'bg-orange-500',
      subtitle: 'currently parked',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <ParkingCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ParkSpot User</h1>
                <p className="text-xs text-muted-foreground">
                  Parking Portal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/">Home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/parking">Parking</Link>
              </Button>
              <Button 
                variant="outline"
                className="text-red-500 hover:text-red-500 hover:bg-red-50"
                onClick={() => {
                  localStorage.removeItem('parkspot_user_role');
                  window.location.href = '/';
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <motion.p 
                          className="text-2xl font-bold mt-1"
                          key={stat.value}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                      </div>
                      <motion.div 
                        className={`p-3 rounded-lg ${stat.color}`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <stat.icon className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => setRegisterDialogOpen(true)}
            className="gap-2"
          >
            <Car className="w-5 h-5" />
            Register Vehicle
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => setHistoryDialogOpen(true)}
            className="gap-2"
          >
            <History className="w-5 h-5" />
            View History
          </Button>
        </section>

        {/* Find My Vehicle */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Find My Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter vehicle number (e.g., MH-12-AB-1234)"
                    value={searchVehicle}
                    onChange={(e) => setSearchVehicle(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                {searchVehicle && foundVehicle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-lg bg-green-50 border border-green-200"
                  >
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Vehicle Found!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Vehicle:</span>{' '}
                        <span className="font-medium">{foundVehicle.vehicleNumber}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model:</span>{' '}
                        <span className="font-medium">{foundVehicle.vehicleModel}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Slot:</span>{' '}
                        <span className="font-medium">{foundVehicle.slotId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Entry:</span>{' '}
                        <span className="font-medium">{foundVehicle.entryTime}</span>
                      </div>
                    </div>
                    {!foundVehicle.hasPaid && (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div>
                          <span className="text-sm text-muted-foreground">Parking Fee: </span>
                          <span className="text-lg font-bold text-green-700">
                            ₹{calculateParkingFee(foundVehicle)}
                          </span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedVehicle(foundVehicle);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          Pay Now
                        </Button>
                      </div>
                    )}
                    {foundVehicle.hasPaid && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          Paid - ₹{foundVehicle.amount}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {searchVehicle && !foundVehicle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-lg bg-yellow-50 border border-yellow-200"
                  >
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertCircle className="w-5 h-5" />
                      <span>No unpaid vehicle found with this number</span>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Parking Availability */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parking Availability</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Two Wheeler */}
                <div className="p-4 rounded-lg bg-blue-50 border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bike className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">Two-Wheeler</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.twoWheeler.available} / {stats.twoWheeler.total} available
                    </span>
                  </div>
                  <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.twoWheeler.total > 0 ? ((stats.twoWheeler.total - stats.twoWheeler.available) / stats.twoWheeler.total) * 100 : 0}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                {/* Four Wheeler */}
                <div className="p-4 rounded-lg bg-purple-50 border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold">Four-Wheeler</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.fourWheeler.available} / {stats.fourWheeler.total} available
                    </span>
                  </div>
                  <div className="h-3 bg-purple-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.fourWheeler.total > 0 ? ((stats.fourWheeler.total - stats.fourWheeler.available) / stats.fourWheeler.total) * 100 : 0}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </main>

      {/* Register Vehicle Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={(isOpen) => {
        setRegisterDialogOpen(isOpen);
        if (!isOpen) {
          setVehicleType('four-wheeler');
          setVehicleBrand('');
          setVehicleModel('');
          setVehicleNumber('');
          setVehicleNumberError('');
          setSelectedSlot('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register Vehicle</DialogTitle>
            <DialogDescription>
              Enter your vehicle details to park at our facility
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setVehicleType('two-wheeler');
                    setVehicleBrand('');
                    setVehicleModel('');
                    setSelectedSlot('');
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    vehicleType === 'two-wheeler'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Bike className="w-5 h-5" />
                  <span className="font-medium">Two-Wheeler</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVehicleType('four-wheeler');
                    setVehicleBrand('');
                    setVehicleModel('');
                    setSelectedSlot('');
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    vehicleType === 'four-wheeler'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Car className="w-5 h-5" />
                  <span className="font-medium">Four-Wheeler</span>
                </button>
              </div>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <select
                id="brand"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={vehicleBrand}
                onChange={(e) => {
                  setVehicleBrand(e.target.value);
                  setVehicleModel('');
                }}
              >
                <option value="">Select Brand</option>
                {(vehicleType === 'four-wheeler' ? fourWheelerBrands : twoWheelerBrands).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                disabled={!vehicleBrand}
              >
                <option value="">Select Model</option>
                {(vehicleType === 'four-wheeler' ? fourWheelerBrands : twoWheelerBrands)
                  .find(b => b.id === vehicleBrand)?.models
                  .map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
              </select>
            </div>
            
            {/* Vehicle Number */}
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                placeholder="MH-12-AB-1234"
                value={vehicleNumber}
                onChange={(e) => {
                  const formatted = formatVehicleNumber(e.target.value);
                  setVehicleNumber(formatted);
                }}
                onBlur={() => {
                  const error = validateVehicleNumber(vehicleNumber, allSlots);
                  setVehicleNumberError(error);
                }}
                className={`uppercase ${vehicleNumberError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                maxLength={13}
              />
              {vehicleNumberError && (
                <p className="text-xs text-destructive">{vehicleNumberError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: State-Code Numbers (e.g., MH-12-AB-1234)
              </p>
            </div>
            
            {/* Slot Selection */}
            <div className="space-y-2">
              <Label>Select Slot</Label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an available slot" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAvailableSlots.map(slot => (
                    <SelectItem key={slot.id} value={slot.id}>
                      Slot {slot.id} - {vehicleType === 'two-wheeler' ? 'Two-Wheeler' : 'Four-Wheeler'}
                    </SelectItem>
                  ))}
                  {filteredAvailableSlots.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No slots available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">Parking Rates:</p>
              <p>Two-Wheeler: ₹20/hour</p>
              <p>Four-Wheeler: ₹50/hour</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRegisterVehicle}
              disabled={!selectedSlot || !vehicleNumber.trim() || !vehicleBrand || !vehicleModel || !!vehicleNumberError}
            >
              <Plus className="w-4 h-4 mr-2" />
              Register & Park
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Complete payment to release your vehicle
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  {selectedVehicle.type === 'two-wheeler' ? (
                    <Bike className="w-5 h-5" />
                  ) : (
                    <Car className="w-5 h-5" />
                  )}
                  <span className="font-semibold">{selectedVehicle.vehicleNumber}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedVehicle.vehicleModel}</p>
                <p className="text-sm text-muted-foreground">Slot: {selectedVehicle.slotId}</p>
                <p className="text-sm text-muted-foreground">Entry: {selectedVehicle.entryTime}</p>
              </div>

              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground mb-1">Parking Fee</p>
                <p className="text-4xl font-bold">₹{calculateParkingFee(selectedVehicle)}</p>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} className="gap-2">
              <CreditCard className="w-4 h-4" />
              Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parking History</DialogTitle>
            <DialogDescription>
              Your past parking transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {userHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No parking history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {userHistory.map((record, index) => (
                    <motion.div 
                      key={record.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </motion.div>
                          <div>
                            <p className="font-semibold">{record.vehicleNumber}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{record.vehicleModel}</span>
                              <span>•</span>
                              <span>Slot {record.slotId}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(record.timestamp).toLocaleDateString()} {record.entryTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{record.amount}</p>
                          <p className="text-xs text-muted-foreground">Paid</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

