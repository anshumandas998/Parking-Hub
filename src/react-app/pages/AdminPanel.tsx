import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Bike, 
  ParkingCircle, 
  DollarSign, 
  Clock, 
  Settings,
  Users,
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card';
import { Button } from '@/react-app/components/ui/button';
import { Input } from '@/react-app/components/ui/input';
import { Label } from '@/react-app/components/ui/label';
import { Badge } from '@/react-app/components/ui/badge';
import { Progress } from '@/react-app/components/ui/progress';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/react-app/components/ui/tabs';
import {
  initialTwoWheelerSlots,
  initialFourWheelerSlots,
  calculateStats,
  type ParkingSlot,
  type MoneyRecord,
} from '@/react-app/data/parking-data';

const PARKING_STORAGE_KEY = "parkspot_parking_slots";
const MONEY_STORAGE_KEY = "parkspot_money_records";
const RATES_STORAGE_KEY = "parkspot_parking_rates";

interface ParkingRates {
  twoWheelerHourly: number;
  fourWheelerHourly: number;
  twoWheelerDaily: number;
  fourWheelerDaily: number;
}

const USER_VEHICLES_KEY = "parkspot_user_vehicles";

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

function saveSlotsToStorage(twoWheeler: ParkingSlot[], fourWheeler: ParkingSlot[]) {
  try {
    localStorage.setItem(PARKING_STORAGE_KEY, JSON.stringify({ twoWheeler, fourWheeler }));
  } catch {
    // ignore
  }
}

function loadRates(): ParkingRates {
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    twoWheelerHourly: 20,
    fourWheelerHourly: 50,
    twoWheelerDaily: 150,
    fourWheelerDaily: 300,
  };
}

function saveRates(rates: ParkingRates) {
  try {
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates));
  } catch {
    // ignore
  }
}

export default function AdminPanel() {
  const [twoWheelerSlots, setTwoWheelerSlots] = useState<ParkingSlot[]>(() => {
    const saved = loadSlotsFromStorage();
    return saved?.twoWheeler || initialTwoWheelerSlots;
  });
  const [fourWheelerSlots, setFourWheelerSlots] = useState<ParkingSlot[]>(() => {
    const saved = loadSlotsFromStorage();
    return saved?.fourWheeler || initialFourWheelerSlots;
  });
  const [moneyRecords, setMoneyRecords] = useState<MoneyRecord[]>([]);
  const [parkingRates, setParkingRates] = useState<ParkingRates>(() => loadRates());
  
  // Dialog states
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [vehicleDetailDialogOpen, setVehicleDetailDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  
  // Form states
  const [newSlotType, setNewSlotType] = useState<'two-wheeler' | 'four-wheeler'>('two-wheeler');
  const [newSlotCount, setNewSlotCount] = useState(1);
  const [editingRates, setEditingRates] = useState<ParkingRates>(parkingRates);

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

    // Load parking slots
    const loadParkingSlots = () => {
      try {
        const raw = localStorage.getItem(PARKING_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.twoWheeler) && Array.isArray(parsed.fourWheeler)) {
            setTwoWheelerSlots(parsed.twoWheeler);
            setFourWheelerSlots(parsed.fourWheeler);
          }
        }
      } catch {
        // ignore
      }
    };

    loadParkingSlots();

    // Poll for storage changes
    const pollingInterval = setInterval(loadParkingSlots, 2000);
    return () => clearInterval(pollingInterval);
  }, []);

  // Save slots whenever they change
  useEffect(() => {
    saveSlotsToStorage(twoWheelerSlots, fourWheelerSlots);
  }, [twoWheelerSlots, fourWheelerSlots]);

  const totalSlots = stats.twoWheeler.total + stats.fourWheeler.total;
  const totalOccupied = stats.twoWheeler.occupied + stats.fourWheeler.occupied;
  const occupancyRate = totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0;

  const totalRevenue = moneyRecords.reduce((sum, r) => sum + r.amount, 0);
  
  const todayRevenue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return moneyRecords
      .filter(r => r.timestamp >= today.getTime())
      .reduce((sum, r) => sum + r.amount, 0);
  }, [moneyRecords]);

  const weeklyRevenue = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return moneyRecords
      .filter(r => r.timestamp >= weekAgo)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [moneyRecords]);

  const monthlyRevenue = useMemo(() => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return moneyRecords
      .filter(r => r.timestamp >= monthAgo)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [moneyRecords]);

  const recentTransactions = useMemo(
    () => [...moneyRecords].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10),
    [moneyRecords]
  );

  const parkedVehicles = useMemo(() => {
    const all = [...twoWheelerSlots, ...fourWheelerSlots];
    return all.filter(s => s.isOccupied);
  }, [twoWheelerSlots, fourWheelerSlots]);

  // Slot management functions
  const handleAddSlots = () => {
    const prefix = newSlotType === 'two-wheeler' ? 'TW' : 'FW';
    const existingSlots = newSlotType === 'two-wheeler' ? twoWheelerSlots : fourWheelerSlots;
    const nextNumber = existingSlots.length + 1;

    const newSlots: ParkingSlot[] = Array.from({ length: newSlotCount }, (_, i) => ({
      id: `${prefix}-${String(nextNumber + i).padStart(3, '0')}`,
      type: newSlotType,
      isOccupied: false,
    }));

    if (newSlotType === 'two-wheeler') {
      setTwoWheelerSlots([...twoWheelerSlots, ...newSlots]);
    } else {
      setFourWheelerSlots([...fourWheelerSlots, ...newSlots]);
    }

    setSlotDialogOpen(false);
    setNewSlotCount(1);
  };

  const handleRemoveSlot = (slotId: string) => {
    if (slotId.startsWith('TW')) {
      setTwoWheelerSlots(prev => prev.filter(s => s.id !== slotId));
    } else {
      setFourWheelerSlots(prev => prev.filter(s => s.id !== slotId));
    }
  };

  const handleSaveRates = () => {
    setParkingRates(editingRates);
    saveRates(editingRates);
    setRateDialogOpen(false);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.removeItem(PARKING_STORAGE_KEY);
      localStorage.removeItem(MONEY_STORAGE_KEY);
      localStorage.removeItem(USER_VEHICLES_KEY);
      localStorage.removeItem(RATES_STORAGE_KEY);
      setTwoWheelerSlots(initialTwoWheelerSlots);
      setFourWheelerSlots(initialFourWheelerSlots);
      setMoneyRecords([]);
      setParkingRates({
        twoWheelerHourly: 20,
        fourWheelerHourly: 50,
        twoWheelerDaily: 150,
        fourWheelerDaily: 300,
      });
    }
  };

  const getRevenueByMethod = () => {
    const methods: Record<string, number> = { Cash: 0, UPI: 0, Card: 0 };
    moneyRecords.forEach(r => {
      methods[r.method] = (methods[r.method] || 0) + r.amount;
    });
    return methods;
  };

  const revenueByMethod = getRevenueByMethod();

  const statCards = [
    {
      title: 'Total Slots',
      value: totalSlots,
      icon: ParkingCircle,
      color: 'bg-blue-500',
      subtitle: `${totalOccupied} occupied`,
    },
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      color: occupancyRate >= 80 ? 'bg-green-500' : occupancyRate >= 50 ? 'bg-yellow-500' : 'bg-red-500',
      subtitle: `${totalOccupied} of ${totalSlots} filled`,
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      subtitle: `${moneyRecords.length} transactions`,
    },
    {
      title: "Today's Revenue",
      value: `₹${todayRevenue.toLocaleString()}`,
      icon: Wallet,
      color: 'bg-purple-500',
      subtitle: 'From all payments',
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
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ParkSpot Admin</h1>
                <p className="text-xs text-muted-foreground">Administrative Dashboard</p>
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

        {/* Admin Actions */}
        <section className="flex flex-wrap gap-3">
          <Button onClick={() => setSlotDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Slots
          </Button>
          <Button variant="outline" onClick={() => setRateDialogOpen(true)} className="gap-2">
            <Settings className="w-4 h-4" />
            Configure Rates
          </Button>
          <Button variant="outline" onClick={handleResetData} className="gap-2 text-red-500 hover:text-red-500">
            <RefreshCw className="w-4 h-4" />
            Reset Data
          </Button>
        </section>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="slots">Slot Management</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parking Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5" />
                    Parking Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Two Wheeler */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Two-Wheeler</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.twoWheeler.occupied}/{stats.twoWheeler.total}
                      </span>
                    </div>
                    <Progress value={stats.twoWheeler.total > 0 ? (stats.twoWheeler.occupied / stats.twoWheeler.total) * 100 : 0} />
                  </div>
                  
                  {/* Four Wheeler */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Four-Wheeler</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.fourWheeler.occupied}/{stats.fourWheeler.total}
                      </span>
                    </div>
                    <Progress value={stats.fourWheeler.total > 0 ? (stats.fourWheeler.occupied / stats.fourWheeler.total) * 100 : 0} />
                  </div>

                  <div className="pt-4 border-t grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">{stats.twoWheeler.available}</p>
                      <p className="text-xs text-muted-foreground">Two-Wheeler Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">{stats.fourWheeler.available}</p>
                      <p className="text-xs text-muted-foreground">Four-Wheeler Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-green-50">
                      <p className="text-xl font-bold text-green-600">₹{todayRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-50">
                      <p className="text-xl font-bold text-blue-600">₹{weeklyRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">This Week</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-purple-50">
                      <p className="text-xl font-bold text-purple-600">₹{monthlyRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Revenue by Payment Method</p>
                    <div className="space-y-2">
                      {Object.entries(revenueByMethod).map(([method, amount]) => (
                        <div key={method} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{method}</span>
                          <span className="font-medium">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {recentTransactions.map((record, index) => (
                        <motion.div 
                          key={record.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className="font-medium">{record.vehicleNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {record.method} • {new Date(record.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-emerald-600">₹{record.amount.toLocaleString()}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Slot Management Tab */}
          <TabsContent value="slots" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Two Wheeler Slots */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bike className="w-5 h-5" />
                    Two-Wheeler Slots ({twoWheelerSlots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {twoWheelerSlots.map((slot, index) => (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                          slot.isOccupied 
                            ? 'bg-red-100 border border-red-300' 
                            : 'bg-green-100 border border-green-300'
                        }`}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setVehicleDetailDialogOpen(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <p className="text-xs font-medium">{slot.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.isOccupied ? 'Occupied' : 'Available'}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Four Wheeler Slots */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Four-Wheeler Slots ({fourWheelerSlots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {fourWheelerSlots.map((slot, index) => (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                          slot.isOccupied 
                            ? 'bg-red-100 border border-red-300' 
                            : 'bg-green-100 border border-green-300'
                        }`}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setVehicleDetailDialogOpen(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <p className="text-xs font-medium">{slot.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.isOccupied ? 'Occupied' : 'Available'}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Currently Parked Vehicles ({parkedVehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parkedVehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No vehicles currently parked</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {parkedVehicles.map((vehicle, index) => (
                        <motion.div 
                          key={vehicle.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-lg bg-muted/50 border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {vehicle.type === 'two-wheeler' ? (
                              <Bike className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Car className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-xs text-muted-foreground uppercase">
                              {vehicle.type}
                            </span>
                            <Badge variant={vehicle.vehicleNumber ? "default" : "secondary"}>
                              {vehicle.id}
                            </Badge>
                          </div>
                          <p className="font-bold">{vehicle.vehicleNumber || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.vehicleModel || 'N/A'}</p>
                          <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Entry: {vehicle.entryTime}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  All Transactions ({moneyRecords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moneyRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    <AnimatePresence>
                      {moneyRecords
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((record, index) => (
                        <motion.div 
                          key={record.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                              <p className="font-semibold">{record.vehicleNumber}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">{record.method}</Badge>
                                <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                                <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-emerald-600">
                              ₹{record.amount.toLocaleString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Slots Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Parking Slots</DialogTitle>
            <DialogDescription>
              Add new parking slots to the facility
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Slot Type</Label>
              <Select value={newSlotType} onValueChange={(v) => setNewSlotType(v as 'two-wheeler' | 'four-wheeler')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="two-wheeler">Two-Wheeler</SelectItem>
                  <SelectItem value="four-wheeler">Four-Wheeler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Number of Slots</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={newSlotCount}
                onChange={(e) => setNewSlotCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">Current Slots:</p>
              <p>Two-Wheeler: {twoWheelerSlots.length}</p>
              <p>Four-Wheeler: {fourWheelerSlots.length}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlots}>
              Add Slots
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Rates Dialog */}
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Configure Parking Rates</DialogTitle>
            <DialogDescription>
              Set hourly and daily rates for parking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Two-Wheeler Hourly (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingRates.twoWheelerHourly}
                  onChange={(e) => setEditingRates(prev => ({
                    ...prev,
                    twoWheelerHourly: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Four-Wheeler Hourly (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingRates.fourWheelerHourly}
                  onChange={(e) => setEditingRates(prev => ({
                    ...prev,
                    fourWheelerHourly: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Two-Wheeler Daily (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingRates.twoWheelerDaily}
                  onChange={(e) => setEditingRates(prev => ({
                    ...prev,
                    twoWheelerDaily: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Four-Wheeler Daily (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingRates.fourWheelerDaily}
                  onChange={(e) => setEditingRates(prev => ({
                    ...prev,
                    fourWheelerDaily: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRates}>
              Save Rates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Detail Dialog */}
      <Dialog open={vehicleDetailDialogOpen} onOpenChange={setVehicleDetailDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Slot Details</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg">Slot {selectedSlot.id}</span>
                  <Badge variant={selectedSlot.isOccupied ? "destructive" : "default"}>
                    {selectedSlot.isOccupied ? "Occupied" : "Available"}
                  </Badge>
                </div>
                
                {selectedSlot.isOccupied ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle Number</span>
                      <span className="font-medium">{selectedSlot.vehicleNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle Model</span>
                      <span className="font-medium">{selectedSlot.vehicleModel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry Time</span>
                      <span className="font-medium">{selectedSlot.entryTime || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-2">This slot is currently available</p>
                )}
              </div>

              {selectedSlot.isOccupied && (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    handleRemoveSlot(selectedSlot.id);
                    setVehicleDetailDialogOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Vehicle & Free Slot
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

