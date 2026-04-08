'use client';

import { useState, useEffect } from 'react';
import { Pill, Search, ShoppingCart, UploadCloud, Download, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';

export default function PharmacyPage() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'assets'>('inventory');

    const [inventory, setInventory] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Asset Management State
    const [medForm, setMedForm] = useState({ drugName: '', manufacturer: '', batchNo: '', expiryDate: '', stockQuantity: '', unitPrice: '' });
    // Cart state: array of { id, drugName, unitPrice, quantity, stockQuantity }
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/pharmacy/inventory', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setInventory(await res.json());
            else setInventory([]);
        } catch (err) { console.error(err); setInventory([]); }
    };

    const executeSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`http://localhost:5000/api/patient/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setPatients(await res.json());
            else setPatients([]);
        } catch (err) { console.error(err); setPatients([]); }
    };

    const addToCart = (drug: any) => {
        const existing = cart.find(c => c.id === drug.id);
        if (existing) {
            if (existing.quantity < drug.stockQuantity) {
                setCart(cart.map(c => c.id === drug.id ? { ...c, quantity: c.quantity + 1 } : c));
            } else {
                alert("Maximum stock reached for " + drug.drugName);
            }
        } else {
            if (drug.stockQuantity > 0) {
                setCart([...cart, { ...drug, quantity: 1 }]);
            } else {
                alert("Out of stock");
            }
        }
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty <= 0) {
            setCart(cart.filter(c => c.id !== id));
            return;
        }
        const drug = inventory.find(i => i.id === id);
        if (drug && qty <= drug.stockQuantity) {
            setCart(cart.map(c => c.id === id ? { ...c, quantity: qty } : c));
        }
    };

    const handleDispense = async () => {
        if (!selectedPatient || cart.length === 0) return;
        setLoading(true);

        const payload = {
            patientId: selectedPatient.id,
            medicines: cart.map(c => ({ drugId: c.id, quantity: c.quantity }))
        };

        try {
            const res = await fetch('http://localhost:5000/api/pharmacy/dispense', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                alert("Pharmacy Bill Generated: " + data.bill.billNo);
                setCart([]);
                setSelectedPatient(null);
                fetchInventory(); // refresh stock
            } else {
                alert(data.message);
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const handleAddMedicine = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/pharmacy/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(medForm)
            });
            if (res.ok) {
                alert("Medicine added successfully");
                setMedForm({ drugName: '', manufacturer: '', batchNo: '', expiryDate: '', stockQuantity: '', unitPrice: '' });
                fetchInventory();
            } else {
                alert("Failed to add medicine");
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);

            const medicines = lines.slice(1).map(line => {
                const parts = line.split(',');
                return {
                    drugName: parts[0]?.trim(),
                    manufacturer: parts[1]?.trim(),
                    batchNo: parts[2]?.trim(),
                    expiryDate: parts[3]?.trim(),
                    stockQuantity: parseInt(parts[4] || '0'),
                    unitPrice: parseFloat(parts[5] || '0')
                };
            }).filter(m => m.drugName);

            if (medicines.length === 0) {
                return alert("No valid medicines found in CSV. Please check formatting.");
            }

            setLoading(true);
            try {
                const res = await fetch('http://localhost:5000/api/pharmacy/inventory/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                    body: JSON.stringify({ medicines })
                });

                if (res.ok) {
                    alert(`Successfully imported ${medicines.length} medicines!`);
                    fetchInventory();
                } else {
                    alert("Failed to import CSV. Check console for details.");
                }
            } catch (err) {
                console.error(err);
                alert("Error importing CSV");
            }
            setLoading(false);
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const cartSubTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const cartGST = cartSubTotal * 0.12;
    const cartNet = cartSubTotal + cartGST;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-semibold text-gray-50 tracking-tight flex items-center gap-2">
                    <Pill className="text-blue-500" /> Pharmacy & Dispatch
                </h1>
            </div>

            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-[3px] ${activeTab === 'inventory' ? 'border-blue-600 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'}`}
                >
                    <ShoppingCart size={16} /> Inventory & Dispense
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-[3px] ${activeTab === 'assets' ? 'border-blue-600 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'}`}
                >
                    <Pill size={16} /> Asset Management
                </button>
            </div>

            <div className="pt-2">
                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* Left Side: Orders/Inventory Table */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white rounded-[16px] overflow-hidden border border-gray-200 h-full shadow-xl">
                                <div className="p-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="font-semibold text-gray-700 uppercase text-sm tracking-wider">Drug Inventory</h2>
                                    <Badge variant="neutral">{inventory.length} SKUs Listed</Badge>
                                </div>
                                <table className="w-full text-left text-[13px] text-gray-700">
                                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="font-medium px-4 py-3">Drug Name</th>
                                            <th className="font-medium px-4 py-3">Manufacturer</th>
                                            <th className="font-medium px-4 py-3">Stock Level</th>
                                            <th className="font-medium px-4 py-3 text-right">Price</th>
                                            <th className="font-medium px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium">
                                        {inventory.map((drug, idx) => (
                                            <tr key={drug.id} className="hover:bg-gray-50 transition cursor-pointer">
                                                <TableCell>
                                                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> {drug.drugName}
                                                    </div>
                                                    <div className="text-[12px] text-gray-400 mt-0.5 ml-3.5">Exp: {new Date(drug.expiryDate).toLocaleDateString()}</div>
                                                </TableCell>
                                                <TableCell className="text-gray-500">{drug.manufacturer}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-[6px] text-xs font-bold ${drug.stockQuantity > 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                                        {drug.stockQuantity} Units
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-right">₹{drug.unitPrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right py-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#1e293b] hover:bg-[#0f172a] text-white border-transparent h-8"
                                                        onClick={() => addToCart(drug)}
                                                        disabled={drug.stockQuantity === 0}
                                                    >
                                                        Add to Cart
                                                    </Button>
                                                </TableCell>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right Side: Quick Actions & Cart (Inventory Alert Replica) */}
                        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-0">

                            {/* QUICK ACTIONS Block */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-[13px] tracking-widest text-gray-50">QUICK ACTIONS</h3>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-gray-500"></div><div className="w-1 h-1 rounded-full bg-gray-500"></div><div className="w-1 h-1 rounded-full bg-gray-500"></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[16px] p-4 text-slate-800 shadow-xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                                            R
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">Pharmacist Access</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">Dispense Management active</div>
                                            <div className="text-[11px] text-gray-500">{new Date().toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CART / SELECTED PATIENT Block */}
                            <div className="flex-1">
                                <h3 className="font-bold text-[13px] tracking-widest text-gray-50 mb-4 uppercase">Dispense Cart</h3>

                                <div className="bg-white rounded-[16px] text-slate-800 h-full flex flex-col border border-gray-100 shadow-xl overflow-hidden pb-4">

                                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                                        <h4 className="text-[12px] font-semibold text-gray-500 mb-3 uppercase tracking-wider">Billing Patient</h4>
                                        {selectedPatient ? (
                                            <div className="flex justify-between items-center bg-white p-3 rounded-[8px] border border-gray-200 shadow-sm">
                                                <div>
                                                    <div className="font-semibold text-gray-800 text-sm">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                                                    <div className="text-[12px] text-gray-500 mt-0.5">{selectedPatient.uhid}</div>
                                                </div>
                                                <button onClick={() => setSelectedPatient(null)} className="text-red-500 hover:text-red-600 text-xs font-semibold">Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Search UHID..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && executeSearch()}
                                                    className="bg-white border-gray-300 text-gray-800 focus:ring-emerald-500"
                                                />
                                                <Button variant="secondary" onClick={executeSearch} className="px-4 bg-gray-200 text-gray-700 hover:bg-gray-300 border-transparent"><Search size={16} /></Button>
                                            </div>
                                        )}

                                        {!selectedPatient && patients.length > 0 && (
                                            <div className="mt-3 text-sm border border-gray-200 rounded-[8px] overflow-hidden bg-white max-h-32 overflow-y-auto shadow-inner">
                                                {patients.map(p => (
                                                    <div key={p.id} onClick={() => { setSelectedPatient(p); setPatients([]); setSearchQuery(''); }} className="p-3 border-b border-gray-100 last:border-0 hover:bg-emerald-50 cursor-pointer transition-colors">
                                                        <strong className="text-gray-800">{p.firstName} {p.lastName}</strong> <span className="text-gray-500 text-[12px]">({p.uhid})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cart Items */}
                                    <div className="flex-1 p-5 overflow-y-auto space-y-3">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3.5 rounded-[8px] text-sm">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-800">{item.drugName}</div>
                                                    <div className="text-gray-500 text-[12px] mt-0.5">₹{item.unitPrice} per unit</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-16 h-8 px-2 border border-gray-300 bg-white rounded-[6px] text-center text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                                                        min={0}
                                                        max={item.stockQuantity}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {cart.length === 0 && (
                                            <div className="h-24 flex flex-col items-center justify-center text-gray-400 gap-2">
                                                <ShoppingCart size={24} className="opacity-50" />
                                                <p className="text-xs font-medium">Cart is currently empty</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Subtotal & Submit */}
                                    <div className="px-5 pb-2">
                                        <div className="bg-gray-50 border border-gray-200 rounded-[8px] p-4 mb-4">
                                            <div className="flex justify-between text-[13px] text-gray-600 mb-2">
                                                <span>Subtotal</span>
                                                <span className="font-medium">₹{cartSubTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-[13px] text-gray-600 mb-2">
                                                <span>GST (12%)</span>
                                                <span className="font-medium">₹{cartGST.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3 mt-1">
                                                <span>Net Payable</span>
                                                <span className="text-emerald-600">₹{cartNet.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleDispense}
                                            disabled={loading || cart.length === 0 || !selectedPatient}
                                            className="w-full bg-[#1eab89] hover:bg-[#189173] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-[8px] transition shadow-md uppercase tracking-wider text-[13px]"
                                        >
                                            Dispense & Generate Bill
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl items-start">
                        {/* Bulk Upload Feature */}
                        <Card padding="lg">
                            <div className="flex flex-col mb-6 pb-4 border-b border-slate-800">
                                <h3 className="font-semibold text-gray-50 text-lg mb-1">Bulk Import Inventory</h3>
                                <div className="flex justify-between items-center w-full">
                                    <p className="text-[13px] text-gray-400">Upload a CSV file to automatically log medicines.</p>
                                    <a href={`data:text/csv;charset=utf-8,${encodeURIComponent("drugName,manufacturer,batchNo,expiryDate,stockQuantity,unitPrice\nParacetamol 500mg,Cipla,BT-1234,2025-12-31,500,2.50\nAspirin 75mg,Bayer,BY-999,2026-05-15,1000,1.25")}`} download="template_pharmacy.csv" className="flex items-center gap-1 text-[12px] text-blue-500 hover:text-blue-400 font-medium">
                                        <Download size={14} /> Download Template
                                    </a>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-slate-700 bg-slate-900 rounded-[12px] p-10 text-center hover:bg-slate-800 hover:border-slate-600 transition-colors cursor-pointer relative group">
                                <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                                <div className="flex flex-col items-center justify-center space-y-3 relative z-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-slate-700 group-hover:text-blue-400 transition-colors">
                                        <UploadCloud size={24} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-50">Click to upload CSV</p>
                                        <p className="text-[12px] text-gray-400 mt-0.5">or drag and drop here</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Manual Entry Form */}
                        <Card padding="lg">
                            <h3 className="font-semibold text-gray-50 text-md mb-6 border-b border-slate-800 pb-2">Manual Entry: Single Item</h3>
                            <form onSubmit={handleAddMedicine} className="space-y-4">
                                <Input required label="Drug Name *" placeholder="e.g. Paracetamol 500mg" value={medForm.drugName} onChange={e => setMedForm({ ...medForm, drugName: e.target.value })} />
                                <Input label="Manufacturer" placeholder="e.g. Cipla" value={medForm.manufacturer} onChange={e => setMedForm({ ...medForm, manufacturer: e.target.value })} />
                                <Input required label="Batch Number *" placeholder="e.g. BT-8492" value={medForm.batchNo} onChange={e => setMedForm({ ...medForm, batchNo: e.target.value })} />
                                <Input required type="date" label="Expiry Date *" value={medForm.expiryDate} onChange={e => setMedForm({ ...medForm, expiryDate: e.target.value })} />
                                <Input required type="number" min="1" label="Initial Stock Quantity *" value={medForm.stockQuantity} onChange={e => setMedForm({ ...medForm, stockQuantity: e.target.value })} />
                                <Input required type="number" step="0.01" min="0" label="Unit Price (₹) *" value={medForm.unitPrice} onChange={e => setMedForm({ ...medForm, unitPrice: e.target.value })} />

                                <div className="pt-2">
                                    <Button type="submit" disabled={loading} fullWidth>
                                        Submit Inventory Update
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
