import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/react-app/components/ui/table";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Button } from "@/react-app/components/ui/button";

type PaymentMethod = "Cash" | "UPI" | "Card";

interface MoneyRecord {
  id: string;
  vehicleNumber: string;
  amount: number;
  method: PaymentMethod;
  timestamp: number;
  notes?: string;
}

const STORAGE_KEY = "parkspot_money_records";

export default function MoneyPage() {
  const [records, setRecords] = useState<MoneyRecord[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MoneyRecord[];
        setRecords(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setRecords([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      /* noop */
    }
  }, [records]);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.timestamp - a.timestamp),
    [records]
  );

  const canSubmit = vehicleNumber.trim().length > 0 && Number(amount) > 0;

  const handleAddRecord = () => {
    if (!canSubmit) return;
    const record: MoneyRecord = {
      id: crypto.randomUUID(),
      vehicleNumber: vehicleNumber.trim(),
      amount: Number(amount),
      method,
      timestamp: Date.now(),
      notes: notes.trim() || undefined,
    };
    setRecords((prev: MoneyRecord[]) => [record, ...prev]);
    setVehicleNumber("");
    setAmount("");
    setMethod("Cash");
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Money Details</h1>
              <p className="text-xs text-muted-foreground">Store vehicle number and payment info</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Payment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Number</Label>
                <Input
                  id="vehicle"
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
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
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Optional"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleAddRecord} disabled={!canSubmit}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="hidden sm:table-cell">Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Method</TableHead>
                      <TableHead className="hidden lg:table-cell">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No payments recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedRecords.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.vehicleNumber}</TableCell>
                          <TableCell className="hidden sm:table-cell">₹ {r.amount.toFixed(2)}</TableCell>
                          <TableCell className="hidden md:table-cell">{r.method}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {new Date(r.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
