import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, ParkingCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/react-app/components/ui/tabs';
import { AvailabilityCard } from '@/react-app/components/AvailabilityCard';
import { ParkingGrid } from '@/react-app/components/ParkingGrid';
import { VehicleTable } from '@/react-app/components/VehicleTable';
import { AddVehicleDialog } from '@/react-app/components/AddVehicleDialog';
import { Button } from '@/react-app/components/ui/button';
import { Link } from 'react-router';
import {
  initialTwoWheelerSlots,
  initialFourWheelerSlots,
  calculateStats,
  type ParkingSlot,
} from '@/react-app/data/parking-data';

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

function saveSlotsToStorage(twoWheeler: ParkingSlot[], fourWheeler: ParkingSlot[]) {
  try {
    localStorage.setItem(PARKING_STORAGE_KEY, JSON.stringify({ twoWheeler, fourWheeler }));
  } catch {
    // ignore
  }
}

export default function Home() {
  const [twoWheelerSlots, setTwoWheelerSlots] = useState<ParkingSlot[]>(() => {
    const saved = loadSlotsFromStorage();
    return saved?.twoWheeler || initialTwoWheelerSlots;
  });
  const [fourWheelerSlots, setFourWheelerSlots] = useState<ParkingSlot[]>(() => {
    const saved = loadSlotsFromStorage();
    return saved?.fourWheeler || initialFourWheelerSlots;
  });
  const [stats, setStats] = useState(() => calculateStats(twoWheelerSlots, fourWheelerSlots));

  useEffect(() => {
    setStats(calculateStats(twoWheelerSlots, fourWheelerSlots));
    saveSlotsToStorage(twoWheelerSlots, fourWheelerSlots);
  }, [twoWheelerSlots, fourWheelerSlots]);

  const allSlots = [...twoWheelerSlots, ...fourWheelerSlots];
  const availableSlots = allSlots.filter((s) => !s.isOccupied);

  const handleAddVehicle = (slotId: string, vehicleNumber: string, vehicleModel: string) => {
    const now = new Date();
    const entryTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (slotId.startsWith('TW')) {
      setTwoWheelerSlots((prev: ParkingSlot[]) =>
        prev.map((slot: ParkingSlot) =>
          slot.id === slotId
            ? { ...slot, isOccupied: true, vehicleNumber, vehicleModel, entryTime }
            : slot
        )
      );
    } else {
      setFourWheelerSlots((prev: ParkingSlot[]) =>
        prev.map((slot: ParkingSlot) =>
          slot.id === slotId
            ? { ...slot, isOccupied: true, vehicleNumber, vehicleModel, entryTime }
            : slot
        )
      );
    }
  };

  const handleCheckout = (slotId: string) => {
    if (slotId.startsWith('TW')) {
      setTwoWheelerSlots((prev: ParkingSlot[]) =>
        prev.map((slot: ParkingSlot) =>
          slot.id === slotId
            ? { ...slot, isOccupied: false, vehicleNumber: undefined, vehicleModel: undefined, entryTime: undefined }
            : slot
        )
      );
    } else {
      setFourWheelerSlots((prev: ParkingSlot[]) =>
        prev.map((slot: ParkingSlot) =>
          slot.id === slotId
            ? { ...slot, isOccupied: false, vehicleNumber: undefined, vehicleModel: undefined, entryTime: undefined }
            : slot
        )
      );
    }
  };

  const handleSlotClick = (slot: ParkingSlot) => {
    if (slot.isOccupied) {
      handleCheckout(slot.id);
    }
  };

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
                <h1 className="text-xl font-bold text-foreground">ParkSpot</h1>
                <p className="text-xs text-muted-foreground">Parking Management Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/">Home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <AddVehicleDialog availableSlots={availableSlots} occupiedSlots={allSlots.filter(s => s.isOccupied)} onAddVehicle={handleAddVehicle} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Availability Cards */}
        <section>
          <motion.h2 
            className="text-lg font-semibold mb-4 text-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Parking Availability
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AvailabilityCard
                type="two-wheeler"
                total={stats.twoWheeler.total}
                occupied={stats.twoWheeler.occupied}
                available={stats.twoWheeler.available}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AvailabilityCard
                type="four-wheeler"
                total={stats.fourWheeler.total}
                occupied={stats.fourWheeler.occupied}
                available={stats.fourWheeler.available}
              />
            </motion.div>
          </div>
        </section>

        {/* Parking Slots Grid */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parking Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="two-wheeler" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="two-wheeler" className="gap-2">
                      <Bike className="w-4 h-4" />
                      Two-Wheeler
                    </TabsTrigger>
                    <TabsTrigger value="four-wheeler" className="gap-2">
                      <Car className="w-4 h-4" />
                      Four-Wheeler
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="two-wheeler">
                    <ParkingGrid
                      slots={twoWheelerSlots}
                      type="two-wheeler"
                      onSlotClick={handleSlotClick}
                    />
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-success/30 border border-success/50"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-destructive/30 border border-destructive/50"></div>
                        <span>Occupied</span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="four-wheeler">
                    <ParkingGrid
                      slots={fourWheelerSlots}
                      type="four-wheeler"
                      onSlotClick={handleSlotClick}
                    />
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-success/30 border border-success/50"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-destructive/30 border border-destructive/50"></div>
                        <span>Occupied</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Parked Vehicles Table */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parked Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <VehicleTable slots={allSlots} onCheckout={handleCheckout} />
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
