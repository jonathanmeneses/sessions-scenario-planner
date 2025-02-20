"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Add this interface near the top of the file, before the component
interface TherapyRow {
    id: number;
    visitType: string;
    payer: string;
    sessionLength: number;
    adminTime: number;
    baseRate: number;
    baseSessions: number;
    adjustedRate: number;
    adjustedSessions: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TherapyCalculator = () => {
    const [rows, setRows] = useState<TherapyRow[]>([
        {
            id: 1,
            visitType: "Individual 45",
            payer: "Private Pay",
            sessionLength: 45,
            adminTime: 15,
            baseRate: 150,
            baseSessions: 10,
            adjustedRate: 150,
            adjustedSessions: 10
        },
        {
            id: 2,
            visitType: "Individual 60",
            payer: "Insurance",
            sessionLength: 60,
            adminTime: 15,
            baseRate: 120,
            baseSessions: 15,
            adjustedRate: 120,
            adjustedSessions: 15
        }
    ]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<TherapyRow | null>(null);
    const [formData, setFormData] = useState({
        visitType: "",
        payer: "",
        sessionLength: 45,
        adminTime: 15,
        baseRate: 150,
        baseSessions: 10
    });

    const [activePieIndex, setActivePieIndex] = useState(-1);

    const handleEditClick = (row: TherapyRow) => {
        setEditingRow(row);
        setFormData({
            visitType: row.visitType,
            payer: row.payer,
            sessionLength: row.sessionLength,
            adminTime: row.adminTime,
            baseRate: row.baseRate,
            baseSessions: row.baseSessions
        });
        setIsDialogOpen(true);
    };

    const handleRateChange = (rowId: number, newRate: number[]) => {
        setRows(rows.map(row =>
            row.id === rowId ? { ...row, adjustedRate: newRate[0] } : row
        ));
    };

    const handleSessionChange = (rowId: number, newSessions: number[]) => {
        setRows(rows.map(row =>
            row.id === rowId ? { ...row, adjustedSessions: newSessions[0] } : row
        ));
    };

    const handleSaveRow = () => {
        if (editingRow) {
            // Editing existing row
            setRows(rows.map(row =>
                row.id === editingRow.id ? {
                    ...row,
                    ...formData,
                    adjustedRate: formData.baseRate,
                    adjustedSessions: formData.baseSessions
                } : row
            ));
        } else {
            // Adding new row
            const newId = Math.max(...rows.map(r => r.id), 0) + 1;
            const newRow = {
                ...formData,
                id: newId,
                adjustedRate: formData.baseRate,
                adjustedSessions: formData.baseSessions
            };
            setRows([...rows, newRow]);
        }

        setFormData({
            visitType: "",
            payer: "",
            sessionLength: 45,
            adminTime: 15,
            baseRate: 150,
            baseSessions: 10
        });
        setEditingRow(null);
        setIsDialogOpen(false);
    };

    const handleDeleteRow = (rowId: number) => {
        setRows(rows.filter(row => row.id !== rowId));
    };

    const calculateRevenue = (useAdjusted = true) => {
        return rows.reduce((sum, row) => {
            const rate = useAdjusted ? row.adjustedRate : row.baseRate;
            const sessions = useAdjusted ? row.adjustedSessions : row.baseSessions;
            return sum + (rate * sessions);
        }, 0);
    };

    const calculateHours = (useAdjusted = true) => {
        return rows.reduce((acc, row) => {
            const sessions = useAdjusted ? row.adjustedSessions : row.baseSessions;
            const therapyHours = (row.sessionLength / 60) * sessions;
            const adminHours = (row.adminTime / 60) * sessions;
            return {
                therapy: acc.therapy + therapyHours,
                admin: acc.admin + adminHours,
                total: acc.total + therapyHours + adminHours
            };
        }, { therapy: 0, admin: 0, total: 0 });
    };

    const calculateBlendedRate = (useAdjusted = true) => {
        const totalSessions = rows.reduce((sum, row) =>
            sum + (useAdjusted ? row.adjustedSessions : row.baseSessions), 0);
        return totalSessions === 0 ? 0 : calculateRevenue(useAdjusted) / totalSessions;
    };

    const formatChange = (value: number, baseValue: number) => {
        const diff = value - baseValue;
        if (diff === 0) return null;

        const className = diff > 0 ? 'text-green-600' : 'text-red-600';
        const sign = diff > 0 ? '+' : '';
        return <span className={className}>({sign}{diff.toLocaleString()})</span>;
    };

    const calculateTotalVisits = (rows: TherapyRow[], useAdjusted = true) => {
        return rows.reduce((sum, row) =>
            sum + (useAdjusted ? row.adjustedSessions : row.baseSessions), 0
        );
    };

    const prepareRevenueData = (rows: TherapyRow[]) => {
        // Transform data to have one entry per scenario
        const baseTotal = rows.reduce((acc, row) => {
            acc[row.visitType] = (acc[row.visitType] || 0) + (row.baseRate * row.baseSessions);
            return acc;
        }, {} as Record<string, number>);

        const adjustedTotal = rows.reduce((acc, row) => {
            acc[row.visitType] = (acc[row.visitType] || 0) + (row.adjustedRate * row.adjustedSessions);
            return acc;
        }, {} as Record<string, number>);

        // Create array with two entries: base and adjusted
        return [
            {
                name: 'Base',
                ...baseTotal
            },
            {
                name: 'Adjusted',
                ...adjustedTotal
            }
        ];
    };

    const prepareTimeData = (rows: TherapyRow[]) => {
        return rows.map(row => ({
            name: row.visitType,
            therapy: (row.sessionLength / 60) * row.adjustedSessions,
            admin: (row.adminTime / 60) * row.adjustedSessions,
        }));
    };

    const preparePayerData = (rows: TherapyRow[], useAdjusted = true) => {
        const payerGroups = rows.reduce((acc, row) => {
            const revenue = useAdjusted
                ? row.adjustedRate * row.adjustedSessions
                : row.baseRate * row.baseSessions;
            acc[row.payer] = (acc[row.payer] || 0) + revenue;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(payerGroups).map(([name, value]) => ({
            name,
            value
        }));
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Therapy Practice Calculator</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Plus size={16} /> Add Service
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingRow ? 'Edit Service' : 'Add New Service'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Visit Type</Label>
                                    <Input
                                        value={formData.visitType}
                                        onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                                        placeholder="e.g., Individual 45"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payer</Label>
                                    <Select
                                        value={formData.payer}
                                        onValueChange={(value) => setFormData({ ...formData, payer: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payer type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Private Pay">Private Pay</SelectItem>
                                            <SelectItem value="Insurance">Insurance</SelectItem>
                                            <SelectItem value="Sliding Scale">Sliding Scale</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Session Length (min)</Label>
                                        <Input
                                            type="number"
                                            value={formData.sessionLength}
                                            onChange={(e) => setFormData({ ...formData, sessionLength: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Admin Time (min)</Label>
                                        <Input
                                            type="number"
                                            value={formData.adminTime}
                                            onChange={(e) => setFormData({ ...formData, adminTime: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Base Rate ($)</Label>
                                        <Input
                                            type="number"
                                            value={formData.baseRate}
                                            onChange={(e) => setFormData({ ...formData, baseRate: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Base Sessions/Month</Label>
                                        <Input
                                            type="number"
                                            value={formData.baseSessions}
                                            onChange={(e) => setFormData({ ...formData, baseSessions: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleSaveRow}>
                                {editingRow ? 'Save Changes' : 'Add Service'}
                            </Button>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Visit Type</th>
                                    <th className="text-left p-2">Payer</th>
                                    <th className="text-left p-2">Rate ($)</th>
                                    <th className="text-left p-2">Sessions/Month</th>
                                    <th className="text-left p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => (
                                    <tr key={row.id} className="border-b">
                                        <td className="p-2">{row.visitType}</td>
                                        <td className="p-2">{row.payer}</td>
                                        <td className="p-2">
                                            <div className="w-32">
                                                <Slider
                                                    value={[row.adjustedRate]}
                                                    min={50}
                                                    max={300}
                                                    step={5}
                                                    onValueChange={(value) => handleRateChange(row.id, value)}
                                                />
                                                <div className="text-sm mt-1 flex items-center gap-2">
                                                    ${row.adjustedRate}
                                                    {formatChange(row.adjustedRate, row.baseRate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="w-32">
                                                <Slider
                                                    value={[row.adjustedSessions]}
                                                    min={0}
                                                    max={30}
                                                    step={1}
                                                    onValueChange={(value) => handleSessionChange(row.id, value)}
                                                />
                                                <div className="text-sm mt-1 flex items-center gap-2">
                                                    {row.adjustedSessions}
                                                    {formatChange(row.adjustedSessions, row.baseSessions)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(row)}
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteRow(row.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">Monthly Revenue</div>
                                    <div className="text-xl font-bold flex items-center gap-2">
                                        ${Math.round(calculateRevenue()).toLocaleString()}
                                        {formatChange(calculateRevenue(), calculateRevenue(false))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Total Monthly Visits</div>
                                    <div className="text-xl font-bold flex items-center gap-2">
                                        {calculateTotalVisits(rows)}
                                        {formatChange(
                                            calculateTotalVisits(rows),
                                            calculateTotalVisits(rows, false)
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Blended Rate</div>
                                    <div className="text-xl font-bold flex items-center gap-2">
                                        ${calculateBlendedRate().toFixed(2).toLocaleString()}
                                        {formatChange(
                                            calculateBlendedRate(),
                                            calculateBlendedRate(false)
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-gray-100 rounded">
                                <div className="text-sm text-gray-600 mb-2">Hours Breakdown</div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">Therapy Hours</div>
                                        <div className="text-xl font-bold flex items-center gap-2">
                                            {calculateHours().therapy.toFixed(2)}
                                            {formatChange(
                                                calculateHours().therapy,
                                                calculateHours(false).therapy
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Admin Hours</div>
                                        <div className="text-xl font-bold flex items-center gap-2">
                                            {calculateHours().admin.toFixed(2)}
                                            {formatChange(
                                                calculateHours().admin,
                                                calculateHours(false).admin
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Total Hours</div>
                                        <div className="text-xl font-bold flex items-center gap-2">
                                            {calculateHours().total.toFixed(2)}
                                            {formatChange(
                                                calculateHours().total,
                                                calculateHours(false).total
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Comparison Chart */}
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold mb-2">Revenue by Service Type</h4>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={prepareRevenueData(rows)}>
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                            <Legend />
                                            {rows.map(row => (
                                                <Bar
                                                    key={row.visitType}
                                                    dataKey={row.visitType}
                                                    stackId="stack"
                                                    fill={COLORS[rows.indexOf(row) % COLORS.length]}
                                                    name={row.visitType}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Time Breakdown Chart */}
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold mb-2">Time Allocation by Service</h4>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={prepareTimeData(rows)}>
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `${value.toFixed(1)} hours`} />
                                            <Legend />
                                            <Bar dataKey="therapy" stackId="time" fill="#22c55e" name="Therapy Hours" />
                                            <Bar dataKey="admin" stackId="time" fill="#eab308" name="Admin Hours" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Payer Mix Charts */}
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Base Payer Mix</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={preparePayerData(rows, false)}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {preparePayerData(rows, false).map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Adjusted Payer Mix</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={preparePayerData(rows, true)}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {preparePayerData(rows, true).map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TherapyCalculator;