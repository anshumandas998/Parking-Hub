import { useState } from 'react';
import { Car, Bike, LogOut } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/react-app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/react-app/components/ui/dialog';
import { Label } from '@/react-app/components/ui/label';
import type { ParkingSlot } from '@/react-app/data/parking-data';

type PaymentMethod = "Cash" | "UPI" | "Card";

const MONEY_STORAGE_KEY = "parkspot_money_records";

interface VehicleTableProps {
  slots: ParkingSlot[];
  onCheckout: (slotId: string) => void;
}

export function VehicleTable({ slots, onCheckout }: VehicleTableProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('Cash');

  const occupiedSlots = slots.filter((s) => s.isOccupied);

  // Calculate parking duration and amount
  const calculateAmount = (slot: ParkingSlot): number => {
    if (!slot.entryTime) return 0;
    
    const now = new Date();
    const [time, period] = slot.entryTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let entryHours = hours;
    if (period === 'PM' && hours !== 12) entryHours += 12;
    if (period === 'AM' && hours === 12) entryHours = 0;
    
    const entryDate = new Date();
    entryDate.setHours(entryHours, minutes, 0, 0);
    
    // If entry time is in future, assume it's from yesterday
    if (entryDate > now) {
      entryDate.setDate(entryDate.getDate() - 1);
    }
    
    const diffMs = now.getTime() - entryDate.getTime();
    const hoursParked = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60))); // Minimum 1 hour
    
    const ratePerHour = slot.type === 'two-wheeler' ? 30 : 40;
    return hoursParked * ratePerHour;
  };

  const handleExitClick = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedSlot) return;
    
    const amount = calculateAmount(selectedSlot);
    
    // Save payment
    const record = {
      id: crypto.randomUUID(),
      vehicleNumber: selectedSlot.vehicleNumber,
      amount,
      method,
      timestamp: Date.now(),
    };
    
    try {
      const raw = localStorage.getItem(MONEY_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem(MONEY_STORAGE_KEY, JSON.stringify([record, ...existing]));
    } catch {
      localStorage.setItem(MONEY_STORAGE_KEY, JSON.stringify([record]));
    }
    
    // Close dialog and checkout
    setPaymentDialogOpen(false);
    onCheckout(selectedSlot.id);
    setSelectedSlot(null);
    setMethod('Cash');
  };

  if (occupiedSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No vehicles currently parked
      </div>
    );
  }

  const amount = selectedSlot ? calculateAmount(selectedSlot) : 0;

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">Slot</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="hidden sm:table-cell">Model</TableHead>
              <TableHead className="hidden md:table-cell">Entry Time</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {occupiedSlots.map((slot) => (
              <TableRow key={slot.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {slot.type === 'two-wheeler' ? (
                      <Bike className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Car className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-mono text-sm">{slot.id}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{slot.vehicleNumber}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {slot.vehicleModel}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {slot.entryTime}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExitClick(slot)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Exit</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Payment Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="font-medium">{selectedSlot?.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{selectedSlot?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry Time:</span>
                <span className="font-medium">{selectedSlot?.entryTime}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">Parking Fee:</span>
                <span className="font-bold text-lg">₹{amount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <select
                id="method"
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
              </select>
            </div>

            <Button onClick={handlePaymentSubmit} className="w-full">
              Pay ₹{amount} & Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
