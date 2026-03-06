import { Car, Bike, X } from 'lucide-react';
import type { ParkingSlot } from '@/react-app/data/parking-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/react-app/components/ui/tooltip';

interface ParkingGridProps {
  slots: ParkingSlot[];
  type: 'two-wheeler' | 'four-wheeler';
  onSlotClick: (slot: ParkingSlot) => void;
}

export function ParkingGrid({ slots, type, onSlotClick }: ParkingGridProps) {
  const isTwoWheeler = type === 'two-wheeler';

  return (
    <TooltipProvider>
      <div className={`grid gap-3 ${
        isTwoWheeler 
          ? 'grid-cols-5 sm:grid-cols-10' 
          : 'grid-cols-4 sm:grid-cols-8'
      }`}>
        {slots.map((slot) => (
          <Tooltip key={slot.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSlotClick(slot)}
                className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-105 ${
                  slot.isOccupied
                    ? 'bg-destructive/10 border-destructive/40 text-destructive'
                    : 'bg-success/10 border-success/40 text-success hover:bg-success/20'
                }`}
              >
                {isTwoWheeler ? (
                  <Bike className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Car className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                <span className="text-[10px] sm:text-xs font-medium mt-1 text-muted-foreground">
                  {slot.id.split('-')[1]}
                </span>
                {slot.isOccupied && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                    <X className="w-2 h-2 text-destructive-foreground" />
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              {slot.isOccupied ? (
                <div className="text-xs">
                  <p className="font-semibold">{slot.vehicleNumber}</p>
                  <p className="text-muted-foreground">{slot.vehicleModel}</p>
                  <p className="text-muted-foreground">Since {slot.entryTime}</p>
                </div>
              ) : (
                <p className="text-xs">Slot {slot.id} - Available</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
