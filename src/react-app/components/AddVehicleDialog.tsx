import { useState } from 'react';
import { Car, Bike, Plus } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/react-app/components/ui/dialog';
import { Input } from '@/react-app/components/ui/input';
import { Label } from '@/react-app/components/ui/label';
import type { ParkingSlot } from '@/react-app/data/parking-data';

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

interface AddVehicleDialogProps {
  availableSlots: ParkingSlot[];
  occupiedSlots: ParkingSlot[];
  onAddVehicle: (slotId: string, vehicleNumber: string, vehicleModel: string) => void;
}

// Indian vehicle number regex pattern: XX-00-XX-0000 format
// Examples: MH-12-AB-1234, DL-01-CA-5678, KA-19-EF-9999
const INDIAN_VEHICLE_NUMBER_REGEX = /^[A-Z]{2}-[0-9]{2}-[A-Z]{1,2}-[0-9]{4}$/;

export function AddVehicleDialog({ availableSlots, occupiedSlots, onAddVehicle }: AddVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState<'two-wheeler' | 'four-wheeler'>('four-wheeler');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');

  const filteredSlots = availableSlots.filter((s) => s.type === vehicleType);
  const selectedSlot = filteredSlots.length > 0 ? filteredSlots[0].id : '';

  const brands = vehicleType === 'four-wheeler' ? fourWheelerBrands : twoWheelerBrands;
  const selectedBrand = brands.find(b => b.id === brand);
  const models = selectedBrand?.models || [];

  const validateVehicleNumber = (value: string): boolean => {
    if (!value.trim()) {
      setVehicleNumberError('Vehicle number is required');
      return false;
    }
    const normalized = value.toUpperCase().replace(/\s/g, '');
    if (!INDIAN_VEHICLE_NUMBER_REGEX.test(normalized)) {
      setVehicleNumberError('Invalid format. Use: MH-12-AB-1234');
      return false;
    }
    // Check if vehicle is already parked
    if (isVehicleAlreadyParked(normalized)) {
      setVehicleNumberError('This vehicle is already parked');
      return false;
    }
    setVehicleNumberError('');
    return true;
  };

  // Check if vehicle number already exists in any occupied slot
  const isVehicleAlreadyParked = (vehicleNum: string): boolean => {
    const normalized = vehicleNum.toUpperCase().replace(/\s/g, '');
    return occupiedSlots.some(slot => 
      slot.vehicleNumber?.toUpperCase().replace(/\s/g, '') === normalized
    );
  };

  const formatVehicleNumber = (value: string): string => {
    // Remove all spaces and convert to uppercase
    let cleaned = value.toUpperCase().replace(/\s/g, '');
    // Only allow alphanumeric characters
    cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
    
    // Limit to maximum 10 characters (2 + 2 + 2 + 4 = 10)
    cleaned = cleaned.slice(0, 10);
    
    // Add dashes at appropriate positions
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i === 2 || i === 4 || i === 6) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }
    return formatted;
  };

  const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatVehicleNumber(e.target.value);
    setVehicleNumber(formatted);
    if (vehicleNumberError) {
      validateVehicleNumber(formatted);
    }
  };

  const handleVehicleNumberBlur = () => {
    validateVehicleNumber(vehicleNumber);
  };

  const handleTypeChange = (type: 'two-wheeler' | 'four-wheeler') => {
    setVehicleType(type);
    setBrand('');
    setModel('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateVehicleNumber(vehicleNumber)) {
      return;
    }

    if (!brand || !model) {
      return;
    }

    if (vehicleNumber.trim() && selectedSlot) {
      const selectedBrandName = brands.find(b => b.id === brand)?.name || '';
      const vehicleModel = `${selectedBrandName} ${model}`;
      onAddVehicle(selectedSlot, vehicleNumber.toUpperCase(), vehicleModel);
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setVehicleNumber('');
    setBrand('');
    setModel('');
    setVehicleNumberError('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Park New Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('two-wheeler')}
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
                onClick={() => handleTypeChange('four-wheeler')}
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
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setModel('');
              }}
            >
              <option value="">Select Brand</option>
              {brands.map((b) => (
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
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!brand}
            >
              <option value="">Select Model</option>
              {models.map((m) => (
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
              onChange={handleVehicleNumberChange}
              onBlur={handleVehicleNumberBlur}
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

          <Button
            type="submit"
            className="w-full"
            disabled={!vehicleNumber.trim() || !selectedSlot || !brand || !model || !!vehicleNumberError}
          >
            Park Vehicle
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

