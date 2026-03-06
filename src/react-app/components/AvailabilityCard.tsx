import { Car, Bike } from 'lucide-react';
import { Card, CardContent } from '@/react-app/components/ui/card';

interface AvailabilityCardProps {
  type: 'two-wheeler' | 'four-wheeler';
  total: number;
  occupied: number;
  available: number;
}

export function AvailabilityCard({ type, total, occupied, available }: AvailabilityCardProps) {
  const isTwoWheeler = type === 'two-wheeler';
  const percentage = Math.round((available / total) * 100);
  const isAvailable = available > 0;

  return (
    <Card className={`relative overflow-hidden border-2 transition-all ${
      isAvailable 
        ? 'border-success/30 bg-success/5' 
        : 'border-destructive/30 bg-destructive/5'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isTwoWheeler ? (
                <Bike className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Car className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {isTwoWheeler ? 'Two-Wheeler' : 'Four-Wheeler'}
              </span>
            </div>
            <div className="mt-3">
              <span className={`text-4xl font-bold ${
                isAvailable ? 'text-success' : 'text-destructive'
              }`}>
                {available}
              </span>
              <span className="text-lg text-muted-foreground ml-1">/ {total}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">spots available</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            isAvailable 
              ? 'bg-success text-success-foreground' 
              : 'bg-destructive text-destructive-foreground'
          }`}>
            {isAvailable ? 'AVAILABLE' : 'FULL'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isAvailable ? 'bg-success' : 'bg-destructive'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{occupied} occupied</span>
            <span>{percentage}% free</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
