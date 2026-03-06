import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Bike, 
  ParkingCircle, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Zap,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card';
import { Button } from '@/react-app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/react-app/components/ui/dialog';
import {
  initialTwoWheelerSlots,
  initialFourWheelerSlots,
  calculateStats,
  type ParkingSlot,
} from '@/react-app/data/parking-data';

type PaymentMethod = "Cash" | "UPI" | "Card";

interface MoneyRecord {
  id: string;
  vehicleNumber: string;
  amount: number;
  method: PaymentMethod;
  timestamp: number;
  notes?: string;
}

const MONEY_STORAGE_KEY = "parkspot_money_records";

const PARKING_STORAGE_KEY = "parkspot_parking_slots";

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

export default function Dashboard() {
  const [twoWheelerSlots, setTwoWheelerSlots] = useState<ParkingSlot[]>(() => {
    const saved = loadSlotsFromStorage();
    return saved?.twoWheeler || initialTwoWheelerSlots;
  });
  const [fourWheelerSlots, setFourWheelerSlots] = useState<ParkingSlot[]>(() => {
    const saved = loadSlotsFromStorage();
    return saved?.fourWheeler || initialFourWheelerSlots;
  });
  const [moneyRecords, setMoneyRecords] = useState<MoneyRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MoneyRecord | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const stats = useMemo(
    () => calculateStats(twoWheelerSlots, fourWheelerSlots),
    [twoWheelerSlots, fourWheelerSlots]
  );

  // Load initial data and listen for storage changes
  useEffect(() => {
    // Load money records
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

    // Poll for storage changes every 2 seconds (for same-tab updates)
    const pollingInterval = setInterval(loadParkingSlots, 2000);

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MONEY_STORAGE_KEY || e.key === PARKING_STORAGE_KEY) {
        if (e.key === MONEY_STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as MoneyRecord[];
            setMoneyRecords(Array.isArray(parsed) ? parsed : []);
          } catch {
            setMoneyRecords([]);
          }
        }
        if (e.key === PARKING_STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && Array.isArray(parsed.twoWheeler) && Array.isArray(parsed.fourWheeler)) {
              setTwoWheelerSlots(parsed.twoWheeler);
              setFourWheelerSlots(parsed.fourWheeler);
            }
          } catch {
            // ignore
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollingInterval);
    };
  }, []);

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

  const recentRecords = useMemo(
    () => [...moneyRecords].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5),
    [moneyRecords]
  );

  const handleShowReceipt = (record: MoneyRecord) => {
    setSelectedRecord(record);
    setReceiptDialogOpen(true);
  };

  const parkedVehicles = useMemo(() => {
    const all = [...twoWheelerSlots, ...fourWheelerSlots];
    return all.filter(s => s.isOccupied);
  }, [twoWheelerSlots, fourWheelerSlots]);

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
      icon: Zap,
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
                <ParkingCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ParkSpot Dashboard</h1>
                <p className="text-xs text-muted-foreground">Overview & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/">Home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/parking">Manage Parking</Link>
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

        {/* Two Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parking Overview */}
          <section>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-5 h-5" />
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
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.twoWheeler.total > 0 ? (stats.twoWheeler.occupied / stats.twoWheeler.total) * 100 : 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
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
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.fourWheeler.total > 0 ? (stats.fourWheeler.occupied / stats.fourWheeler.total) * 100 : 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        <p className="text-2xl font-bold text-blue-500">{stats.twoWheeler.available}</p>
                        <p className="text-xs text-muted-foreground">Two-Wheeler Available</p>
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: "spring" }}
                      >
                        <p className="text-2xl font-bold text-green-500">{stats.fourWheeler.available}</p>
                        <p className="text-xs text-muted-foreground">Four-Wheeler Available</p>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Recent Payments */}
          <section>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentRecords.length === 0 ? (
                    <motion.div 
                      className="text-center py-8 text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No payments recorded yet</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {recentRecords.map((record, index) => (
                          <motion.div 
                            key={record.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 cursor-pointer transition-colors"
                            onClick={() => handleShowReceipt(record)}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center gap-3">
                              <motion.div 
                                className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"
                                whileHover={{ scale: 1.1 }}
                              >
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                              </motion.div>
                              <div>
                                <p className="font-medium">{record.vehicleNumber}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{record.method}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.p 
                                className="font-bold text-emerald-600"
                                key={record.amount}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                              >
                                ₹{record.amount.toLocaleString()}
                              </motion.p>
                              <Receipt className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </div>

        {/* Currently Parked Vehicles */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Currently Parked ({parkedVehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parkedVehicles.length === 0 ? (
                  <motion.div 
                    className="text-center py-8 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No vehicles currently parked</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    <AnimatePresence>
                      {parkedVehicles.map((vehicle, index) => (
                        <motion.div 
                          key={vehicle.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-lg bg-muted/50 border hover:border-primary/50 transition-colors"
                          whileHover={{ scale: 1.03 }}
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
                          </div>
                          <motion.p 
                            className="font-bold"
                            key={vehicle.vehicleNumber}
                            initial={{ color: "#22c55e" }}
                          >
                            {vehicle.vehicleNumber}
                          </motion.p>
                          <p className="text-sm text-muted-foreground">{vehicle.vehicleModel}</p>
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
          </motion.div>
        </section>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/parking">
              Manage Parking <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </section>

        {/* Receipt Dialog */}
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Payment Receipt
              </DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4 mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-primary/10 p-4 text-center border-b">
                    <ParkingCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-bold text-lg">ParkSpot Parking Hub</h3>
                    <p className="text-xs text-muted-foreground">Parking Management System</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle Number</span>
                      <span className="font-medium">{selectedRecord.vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium">{selectedRecord.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {new Date(selectedRecord.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">
                        {new Date(selectedRecord.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-bold">Total Amount</span>
                      <span className="font-bold text-xl text-emerald-600">
                        ₹{selectedRecord.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <p>Thank you for using ParkSpot!</p>
                  <p>Transaction ID: {selectedRecord.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
