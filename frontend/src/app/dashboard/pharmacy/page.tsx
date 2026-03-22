'use client';

import { useState, useEffect } from 'react';
import { Pill, Search, Stethoscope, ShoppingCart, CheckCircle2, UploadCloud, Download } from 'lucide-react';

export default function PharmacyPage() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'assets'>('inventory');

    const [inventory, setInventory] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Asset Management State
    const [medForm, setMedForm] = useState({ drugName: '', manufacturer: '', batchNo: '', expiryDate: '', stockQuantity: '', unitPrice: '' });        // Cart state: array of { id, drugName, unitPrice, quantity, stockQuantity }
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

            // Assume CSV header: drugName,manufacturer,batchNo,expiryDate,stockQuantity,unitPrice
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
            e.target.value = ''; // reset input file
        };
        reader.readAsText(file);
    };

    const cartSubTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const cartGST = cartSubTotal * 0.12;
    const cartNet = cartSubTotal + cartGST;

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Pill className="text-emerald-500" /> Pharmacy & Dispatch
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'inventory' ? 'border-emerald-500 justify-center text-emerald-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><ShoppingCart size={16} /> Inventory & Dispense</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'assets' ? 'border-emerald-500 justify-center text-emerald-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><Pill size={16} /> Asset Management</div>
                    </button>
                </div>
            </div>

            {activeTab === 'inventory' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Inventory Section */}
                    <div className="md:col-span-8 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="font-bold text-slate-800">Drug Inventory</h2>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">Drug Name</th>
                                            <th className="p-3">Manufacturer</th>
                                            <th className="p-3">Stock Limit</th>
                                            <th className="p-3">Price</th>
                                            <th className="p-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inventory.map(drug => (
                                            <tr key={drug.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-semibold text-slate-800">{drug.drugName} <br /><span className="text-xs text-slate-400 font-normal">Exp: {new Date(drug.expiryDate).toLocaleDateString()}</span></td>
                                                <td className="p-3">{drug.manufacturer}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${drug.stockQuantity > 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {drug.stockQuantity}
                                                    </span>
                                                </td>
                                                <td className="p-3">₹{drug.unitPrice.toFixed(2)}</td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={() => addToCart(drug)}
                                                        disabled={drug.stockQuantity === 0}
                                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded shadow-sm transition disabled:opacity-50"
                                                    >
                                                        Add to Cart
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Dispatch Billing Cart */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
                            <div className="p-4 bg-slate-800 text-white flex justify-between items-center rounded-t-xl">
                                <h2 className="font-bold flex items-center gap-2"><ShoppingCart size={18} /> Dispense Cart</h2>
                                <span className="bg-slate-700 px-2 py-1 rounded font-bold text-xs">{cart.length} items</span>
                            </div>

                            <div className="p-4 border-b border-slate-200">
                                <label className="block text-xs font-semibold text-slate-500 mb-2">Billing Patient</label>
                                {selectedPatient ? (
                                    <div className="flex justify-between items-center bg-sky-50 p-3 rounded border border-sky-100">
                                        <div>
                                            <div className="font-bold text-sky-900 text-sm">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                                            <div className="text-xs text-sky-600">{selectedPatient.uhid}</div>
                                        </div>
                                        <button onClick={() => setSelectedPatient(null)} className="text-rose-500 text-xs">Clear</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Search UHID..." className="flex-1 px-3 py-2 border rounded-lg text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeSearch()} />
                                        <button onClick={executeSearch} className="bg-slate-100 px-3 py-2 rounded-lg"><Search size={16} /></button>
                                    </div>
                                )}

                                {!selectedPatient && patients.length > 0 && (
                                    <div className="mt-2 text-sm border rounded-lg overflow-hidden border-slate-200 shadow-sm max-h-32 overflow-y-auto">
                                        {patients.map(p => (
                                            <div key={p.id} onClick={() => { setSelectedPatient(p); setPatients([]); setSearchQuery(''); }} className="p-2 border-b last:border-0 hover:bg-slate-50 cursor-pointer">
                                                <strong>{p.firstName} {p.lastName}</strong> ({p.uhid})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded shadow-sm text-sm">
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800">{item.drugName}</div>
                                            <div className="text-slate-500 text-xs">₹{item.unitPrice} per unit</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-16 p-1 border rounded text-center"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                                                min={0}
                                                max={item.stockQuantity}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {cart.length === 0 && <div className="text-center text-slate-400 mt-10">Cart is empty.</div>}
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl space-y-2">
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Subtotal</span>
                                    <span>₹{cartSubTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>GST (12%)</span>
                                    <span>₹{cartGST.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-300 pt-2 mt-2">
                                    <span>Net Payable</span>
                                    <span>₹{cartNet.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleDispense}
                                    disabled={loading || cart.length === 0 || !selectedPatient}
                                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md transition"
                                >
                                    Dispense & Generate Bill
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'assets' && (
                <div className="max-w-4xl mx-auto space-y-6 mt-4">

                    {/* Bulk Upload Feature */}
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Bulk Import Inventory</h3>
                                <p className="text-sm text-slate-500">Upload a CSV file to automatically log multiple medicines.</p>
                            </div>
                            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent("drugName,manufacturer,batchNo,expiryDate,stockQuantity,unitPrice\nParacetamol 500mg,Cipla,BT-1234,2025-12-31,500,2.50\nAspirin 75mg,Bayer,BY-999,2026-05-15,1000,1.25")}`} download="template_pharmacy.csv" className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800 font-medium">
                                <Download size={16} /> Download Template
                            </a>
                        </div>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer relative">
                            <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                            <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                            <p className="font-bold text-slate-700">Click to upload CSV</p>
                            <p className="text-xs text-slate-500 mt-1">or drag and drop here</p>
                        </div>
                    </div>

                    {/* Manual Entry Form */}
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                        <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Manual Entry: Add Single Medicine</h3>
                        <form onSubmit={handleAddMedicine} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Drug Name *</label>
                                    <input required type="text" className="w-full text-sm border-slate-300 rounded-lg p-2" placeholder="e.g. Paracetamol 500mg" value={medForm.drugName} onChange={e => setMedForm({ ...medForm, drugName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                                    <input type="text" className="w-full text-sm border-slate-300 rounded-lg p-2" placeholder="e.g. Cipla" value={medForm.manufacturer} onChange={e => setMedForm({ ...medForm, manufacturer: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number *</label>
                                    <input required type="text" className="w-full text-sm border-slate-300 rounded-lg p-2" placeholder="e.g. BT-8492" value={medForm.batchNo} onChange={e => setMedForm({ ...medForm, batchNo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date *</label>
                                    <input required type="date" className="w-full text-sm border-slate-300 rounded-lg p-2" value={medForm.expiryDate} onChange={e => setMedForm({ ...medForm, expiryDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock Quantity *</label>
                                    <input required type="number" min="1" className="w-full text-sm border-slate-300 rounded-lg p-2" value={medForm.stockQuantity} onChange={e => setMedForm({ ...medForm, stockQuantity: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (₹) *</label>
                                    <input required type="number" step="0.01" min="0" className="w-full text-sm border-slate-300 rounded-lg p-2" value={medForm.unitPrice} onChange={e => setMedForm({ ...medForm, unitPrice: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow transition mt-4">
                                Stock Medicine Update
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
