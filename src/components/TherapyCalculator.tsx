'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEnterSubmit } from '@/hooks/useEnterSubmit';

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

interface PayerType {
    id: string;
    name: string;
}

interface GoalMetric {
    type: 'revenue' | 'visits' | 'blendedRate' | 'therapyHours' | 'adminHours' | 'totalHours';
    target: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const METRIC_LABELS = {
    revenue: 'Monthly Revenue',
    visits: 'Total Monthly Visits',
    blendedRate: 'Blended Rate (Per Visit)',
    therapyHours: 'Therapy Hours',
    adminHours: 'Admin Hours',
    totalHours: 'Total Hours'
} as const;

const formatMetricValue = (metric: keyof typeof METRIC_LABELS, value: number): string => {
    switch (metric) {
        case 'revenue':
            return `$${value.toLocaleString()}`;
        case 'visits':
            return `${value.toLocaleString()} visits`;
        case 'blendedRate':
            return `$${value.toFixed(2)}`;
        case 'therapyHours':
        case 'adminHours':
        case 'totalHours':
            return `${value.toFixed(1)} hours`;
        default:
            return value.toString();
    }
};

const TherapyCalculator = () => {
    const [rows, setRows] = useState<TherapyRow[]>([
        {
            id: 1,
            visitType: 'Individual 45',
            payer: 'Private Pay',
            sessionLength: 45,
            adminTime: 15,
            baseRate: 150,
            baseSessions: 10,
            adjustedRate: 150,
            adjustedSessions: 10
        },
        {
            id: 2,
            visitType: 'Individual 60',
            payer: 'Insurance',
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
        visitType: '',
        payer: '',
        sessionLength: 45,
        adminTime: 15,
        baseRate: 150,
        baseSessions: 10
    });

    const [activePieIndex, setActivePieIndex] = useState(-1);

    const [payers, setPayers] = useState<PayerType[]>([
        { id: 'private-pay', name: 'Private Pay' },
        { id: 'insurance', name: 'Insurance' },
        { id: 'sliding-scale', name: 'Sliding Scale' }
    ]);

    const [newPayer, setNewPayer] = useState('');

    const [userName, setUserName] = useState('');
    const [hasEnteredName, setHasEnteredName] = useState(false);
    const [planningGoal, setPlanningGoal] = useState('');
    const [isEditingWelcome, setIsEditingWelcome] = useState(true);
    const [goalMetrics, setGoalMetrics] = useState<GoalMetric[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<keyof typeof METRIC_LABELS | null>(null);
    const [targetValue, setTargetValue] = useState<string>('');
    const [editingMetricIndex, setEditingMetricIndex] = useState<number | null>(null);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [showCharts, setShowCharts] = useState(false);
    const [showGoalCard, setShowGoalCard] = useState(true);
    const [showWelcomeCard, setShowWelcomeCard] = useState(true);

    const handleAddPayer = () => {
        if (newPayer.trim()) {
            const id = newPayer.toLowerCase().replace(/\s+/g, '-');
            setPayers([...payers, { id, name: newPayer.trim() }]);
            setFormData({
                ...formData,
                payer: newPayer.trim()
            });
            setNewPayer('');
        }
    };

    const { handleKeyDown: handleNameKeyDown } = useEnterSubmit({
        onSubmit: () => setHasEnteredName(true),
        isEnabled: !!userName.trim()
    });

    const { handleKeyDown: handleGoalKeyDown } = useEnterSubmit({
        onSubmit: () => setIsEditingWelcome(false),
        isEnabled: !!planningGoal.trim()
    });

    const { handleKeyDown: handleNewPayerKeyDown } = useEnterSubmit({
        onSubmit: handleAddPayer,
        isEnabled: !!newPayer.trim()
    });

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
            visitType: '',
            payer: '',
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
        // Create an object with service types as properties
        const data = rows.reduce((acc, row) => {
            acc[row.visitType] = {
                actual: row.baseRate * row.baseSessions,
                planned: row.adjustedRate * row.adjustedSessions
            };
            return acc;
        }, {} as Record<string, { actual: number; planned: number }>);

        // Transform into the format needed for the chart
        return [
            {
                name: 'Actual',
                ...Object.fromEntries(
                    Object.entries(data).map(([service, values]) => [service, values.actual])
                )
            },
            {
                name: 'Planned',
                ...Object.fromEntries(
                    Object.entries(data).map(([service, values]) => [service, values.planned])
                )
            }
        ];
    };

    const prepareTimeData = (rows: TherapyRow[]) => {
        // Create an object to store actual and planned hours for each service
        const timeByService = rows.reduce((acc, row) => {
            const actualTherapy = (row.sessionLength / 60) * row.baseSessions;
            const actualAdmin = (row.adminTime / 60) * row.baseSessions;
            const plannedTherapy = (row.sessionLength / 60) * row.adjustedSessions;
            const plannedAdmin = (row.adminTime / 60) * row.adjustedSessions;

            return {
                Actual: {
                    ...acc.Actual,
                    [row.visitType]: (acc.Actual?.[row.visitType] || 0) + actualTherapy + actualAdmin
                },
                Planned: {
                    ...acc.Planned,
                    [row.visitType]: (acc.Planned?.[row.visitType] || 0) + plannedTherapy + plannedAdmin
                }
            };
        }, { Actual: {}, Planned: {} } as Record<string, Record<string, number>>);

        // Transform into the format needed for the chart
        return [
            {
                name: 'Actual',
                ...timeByService.Actual
            },
            {
                name: 'Planned',
                ...timeByService.Planned
            }
        ];
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

    const getCurrentMetricValue = (metric: keyof typeof METRIC_LABELS): number => {
        switch (metric) {
            case 'revenue':
                return calculateRevenue();
            case 'visits':
                return calculateTotalVisits(rows);
            case 'blendedRate':
                return calculateBlendedRate();
            case 'therapyHours':
                return calculateHours().therapy;
            case 'adminHours':
                return calculateHours().admin;
            case 'totalHours':
                return calculateHours().total;
            default:
                return 0;
        }
    };

    const handleMetricSelect = (metric: keyof typeof METRIC_LABELS, slotIndex: number) => {
        setSelectedMetric(metric);
        setActiveSlot(slotIndex);
        setTargetValue(getCurrentMetricValue(metric).toString());
    };

    const handleSaveMetric = () => {
        if (selectedMetric && targetValue && activeSlot !== null) {
            if (editingMetricIndex !== null) {
                // Editing existing metric
                setGoalMetrics(goalMetrics.map((metric, index) =>
                    index === editingMetricIndex
                        ? { type: selectedMetric, target: Number(targetValue) }
                        : metric
                ));
            } else {
                // Adding new metric
                const newMetrics = [...goalMetrics];
                newMetrics[activeSlot] = {
                    type: selectedMetric,
                    target: Number(targetValue)
                };
                setGoalMetrics(newMetrics);
            }
            setSelectedMetric(null);
            setTargetValue('');
            setEditingMetricIndex(null);
            setActiveSlot(null);
        }
    };

    const handleEditMetric = (index: number) => {
        const metric = goalMetrics[index];
        setSelectedMetric(metric.type);
        setTargetValue(metric.target.toString());
        setEditingMetricIndex(index);
        setActiveSlot(index);
    };

    const handleDeleteMetric = (index: number) => {
        setGoalMetrics(goalMetrics.filter((_, i) => i !== index));
        setSelectedMetric(null);
        setTargetValue('');
        setEditingMetricIndex(null);
        setActiveSlot(null);
    };

    const handleCancelEdit = () => {
        setSelectedMetric(null);
        setTargetValue('');
        setEditingMetricIndex(null);
        setActiveSlot(null);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <h2 className="font-medium text-lg">Welcome</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowWelcomeCard(!showWelcomeCard)}
                            className="flex items-center gap-1"
                        >
                            {showWelcomeCard ? (
                                <>
                                    Hide
                                    <ChevronUp size={16} />
                                </>
                            ) : (
                                <>
                                    Show
                                    <ChevronDown size={16} />
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                {showWelcomeCard && (
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-gray-700 space-y-2">
                                <p>Welcome to the Therapy Practice Calculator! This tool helps you plan and visualize your therapy practice's revenue, time allocation, and payer mix.</p>
                                <p>Once you enter your name and set your overarching goal, you should setup your current practice using the Practice Metrics Section.</p>
                                <p>Add your services and your current monthly session volume using the "Add Service" button, then adjust rates and session counts using the sliders to see how changes impact your practice metrics.</p>
                                <p>You can also set goals in the "Goal Tracking" section to help you track how your practice is trending towards your goals!</p>
                            </div>
                            {!hasEnteredName ? (
                                // Name Input Section
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Label>What's your name?</Label>
                                        <Input
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            className="w-40 inline-block"
                                            placeholder="Enter your name"
                                            onKeyDown={handleNameKeyDown}
                                        />
                                        <Button
                                            onClick={() => setHasEnteredName(true)}
                                            disabled={!userName.trim()}
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </div>
                            ) : isEditingWelcome ? (
                                // Planning Goal Section
                                <div className="space-y-4">
                                    <h2 className="font-medium text-lg">Hi {userName}!</h2>
                                    <p className="text-gray-700">
                                        {userName}, what's the <strong>one thing</strong> you want to plan for today?
                                    </p>
                                    <div className="space-y-2">
                                        <Input
                                            value={planningGoal}
                                            onChange={(e) => setPlanningGoal(e.target.value)}
                                            className="w-full"
                                            placeholder="e.g., Plan my practice revenue for next quarter"
                                            onKeyDown={handleGoalKeyDown}
                                        />
                                        <Button
                                            className="w-full"
                                            onClick={() => setIsEditingWelcome(false)}
                                            disabled={!planningGoal.trim()}
                                        >
                                            Let's Get Started
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Display Goal Section
                                <div className="space-y-4">
                                    <h2 className="font-medium text-lg">Hi {userName}!</h2>
                                    <div className="space-y-2">
                                        <p className="text-gray-700">Let's plan to help you meet your goal:</p>
                                        <p className="font-medium text-gray-900 pl-4 border-l-4 border-gray-500">
                                            "{planningGoal}"
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditingWelcome(true)}
                                            className="mt-2"
                                        >
                                            Edit Goal
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Practice Metrics</h3>
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
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Select
                                                value={formData.payer}
                                                onValueChange={(value) => setFormData({ ...formData, payer: value })}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select payer type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {payers.map(payer => (
                                                        <SelectItem key={payer.id} value={payer.name}>
                                                            {payer.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                                onClick={() => setNewPayer('New Payer')}
                                            >
                                                Add New
                                            </Button>
                                        </div>
                                    </div>
                                    {newPayer !== '' && (
                                        <div className="grid gap-2">
                                            <Label>New Payer Name</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newPayer}
                                                    onChange={(e) => setNewPayer(e.target.value)}
                                                    placeholder="Enter new payer type"
                                                    className="flex-1"
                                                    autoFocus
                                                    onFocus={(e) => e.target.select()}
                                                    onKeyDown={handleNewPayerKeyDown}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleAddPayer}
                                                    disabled={!newPayer.trim()}
                                                >
                                                    Add
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setNewPayer('')}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid sm:grid-cols-2 gap-4">
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
                                    <div className="grid sm:grid-cols-2 gap-4">
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
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Mobile view */}
                    <div className="md:hidden space-y-4">
                        {rows.map(row => (
                            <div key={row.id} className="bg-white p-4 rounded-lg border">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-medium">{row.visitType}</h3>
                                        <p className="text-sm text-gray-600">{row.payer}</p>
                                    </div>
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
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-600">Rate ($)</label>
                                        <Slider
                                            value={[row.adjustedRate]}
                                            min={0}
                                            max={400}
                                            step={5}
                                            onValueChange={(value) => handleRateChange(row.id, value)}
                                            className="my-2"
                                        />
                                        <div className="text-sm flex items-center gap-2">
                                            ${row.adjustedRate}
                                            {formatChange(row.adjustedRate, row.baseRate)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Sessions/Month</label>
                                        <Slider
                                            value={[row.adjustedSessions]}
                                            min={0}
                                            max={40}
                                            step={1}
                                            onValueChange={(value) => handleSessionChange(row.id, value)}
                                            className="my-2"
                                        />
                                        <div className="text-sm flex items-center gap-2">
                                            {row.adjustedSessions}
                                            {formatChange(row.adjustedSessions, row.baseSessions)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop view */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[600px]">
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
                                                    min={0}
                                                    max={400}
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
                                                    max={40}
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
                    </div>
                </CardContent>
            </Card>

            {hasEnteredName && !isEditingWelcome && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">Target Setting</h3>
                                {showGoalCard && goalMetrics.length < 3 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setActiveSlot(goalMetrics.length);
                                            setSelectedMetric(null);
                                            setTargetValue('');
                                        }}
                                    >
                                        Add Goal
                                    </Button>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowGoalCard(!showGoalCard)}
                                className="flex items-center gap-1"
                            >
                                {showGoalCard ? (
                                    <>
                                        Hide
                                        <ChevronUp size={16} />
                                    </>
                                ) : (
                                    <>
                                        Show
                                        <ChevronDown size={16} />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    {showGoalCard && (
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>Select up to 3 metrics to track</Label>
                                            {goalMetrics.length < 3 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setActiveSlot(goalMetrics.length);
                                                        setSelectedMetric(null);
                                                        setTargetValue('');
                                                    }}
                                                >
                                                    Add Goal
                                                </Button>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {goalMetrics.map((metric, index) => (
                                                <div key={index} className="w-full">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm text-gray-600">{METRIC_LABELS[metric.type]}:</div>
                                                            <div className="text-lg font-bold flex items-center gap-2">
                                                                {formatMetricValue(metric.type, metric.target)}
                                                                <span className={metric.target >= getCurrentMetricValue(metric.type) ? 'text-green-600' : 'text-red-600'}>
                                                                    {' '}({metric.target >= getCurrentMetricValue(metric.type) ? '+' : ''}{formatMetricValue(metric.type, metric.target - getCurrentMetricValue(metric.type))})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 sm:gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEditMetric(index)}
                                                                className="h-8 w-8 sm:h-9 sm:w-9"
                                                                title="Edit Goal"
                                                            >
                                                                <Edit2 size={14} className="sm:size-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteMetric(index)}
                                                                className="h-8 w-8 sm:h-9 sm:w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                title="Delete Goal"
                                                            >
                                                                <Trash2 size={14} className="sm:size-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {activeSlot !== null && (
                                                <div className="space-y-2">
                                                    <Select
                                                        value={selectedMetric || ''}
                                                        onValueChange={(value) => handleMetricSelect(value as keyof typeof METRIC_LABELS, activeSlot)}
                                                        disabled={editingMetricIndex !== null}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select metric" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(METRIC_LABELS)
                                                                .filter(([key]) => {
                                                                    // If editing, allow selecting the current metric
                                                                    if (editingMetricIndex !== null) {
                                                                        const currentMetric = goalMetrics[editingMetricIndex].type;
                                                                        return key === currentMetric || !goalMetrics.some(m => m.type === key);
                                                                    }
                                                                    // When adding new metric, filter out already selected metrics
                                                                    return !goalMetrics.some(m => m.type === key);
                                                                })
                                                                .map(([key, label]) => (
                                                                    <SelectItem key={key} value={key}>
                                                                        {label}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {selectedMetric && (
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="number"
                                                                value={targetValue}
                                                                onChange={(e) => setTargetValue(e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                onClick={handleSaveMetric}
                                                                disabled={!targetValue}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Monthly Summary</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCharts(!showCharts)}
                            className="flex items-center gap-2"
                        >
                            {showCharts ? (
                                <>
                                    Hide Charts
                                    <ChevronUp size={16} />
                                </>
                            ) : (
                                <>
                                    Show Charts
                                    <ChevronDown size={16} />
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Monthly Revenue
                                {goalMetrics.find(m => m.type === 'revenue') && (
                                    <span className={calculateRevenue() >= goalMetrics.find(m => m.type === 'revenue')!.target ? 'text-green-600' : 'text-red-600'}>
                                        {' '}(Goal: ${goalMetrics.find(m => m.type === 'revenue')!.target.toLocaleString()})
                                    </span>
                                )}</div>
                            <div className="text-xl font-bold flex items-center gap-2">
                                ${Math.round(calculateRevenue()).toLocaleString()}
                                {formatChange(calculateRevenue(), calculateRevenue(false))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Total Monthly Visits
                                {goalMetrics.find(m => m.type === 'visits') && (
                                    <span className={calculateTotalVisits(rows) >= goalMetrics.find(m => m.type === 'visits')!.target ? 'text-green-600' : 'text-red-600'}>
                                        {' '}(Goal: {goalMetrics.find(m => m.type === 'visits')!.target.toLocaleString()})
                                    </span>
                                )}
                            </div>
                            <div className="text-xl font-bold flex items-center gap-2">
                                {calculateTotalVisits(rows)}
                                {formatChange(
                                    calculateTotalVisits(rows),
                                    calculateTotalVisits(rows, false)
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Blended Rate
                                {goalMetrics.find(m => m.type === 'blendedRate') && (
                                    <span className={calculateBlendedRate() >= goalMetrics.find(m => m.type === 'blendedRate')!.target ? 'text-green-600' : 'text-red-600'}>
                                        {' '}(Goal: ${goalMetrics.find(m => m.type === 'blendedRate')!.target.toFixed(2)})
                                    </span>
                                )}
                            </div>
                            <div className="text-xl font-bold flex items-center gap-2">
                                ${calculateBlendedRate().toFixed(2).toLocaleString()}
                                {formatChange(
                                    calculateBlendedRate(),
                                    calculateBlendedRate(false)
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <div>
                            <div className="text-sm text-gray-600">Therapy Hours
                                {goalMetrics.find(m => m.type === 'therapyHours') && (
                                    <span className={calculateHours().therapy >= goalMetrics.find(m => m.type === 'therapyHours')!.target ? 'text-green-600' : 'text-red-600'}>
                                        {' '}(Goal: {goalMetrics.find(m => m.type === 'therapyHours')!.target.toFixed(1)})
                                    </span>
                                )}
                            </div>
                            <div className="text-xl font-bold flex items-center gap-2">
                                {calculateHours().therapy.toFixed(2)}
                                {formatChange(
                                    calculateHours().therapy,
                                    calculateHours(false).therapy
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Admin Hours
                                {goalMetrics.find(m => m.type === 'adminHours') && (
                                    <span className={calculateHours().admin >= goalMetrics.find(m => m.type === 'adminHours')!.target ? 'text-green-600' : 'text-red-600'}>
                                        {' '}(Goal: {goalMetrics.find(m => m.type === 'adminHours')!.target.toFixed(1)})
                                    </span>
                                )}
                            </div>
                            <div className="text-xl font-bold flex items-center gap-2">
                                {calculateHours().admin.toFixed(2)}
                                {formatChange(
                                    calculateHours().admin,
                                    calculateHours(false).admin
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Total Hours
                                {goalMetrics.find(m => m.type === 'totalHours') && (
                                    <span className={calculateHours().total >= goalMetrics.find(m => m.type === 'totalHours')!.target ? 'text-green-600' : 'text-red-600'}>
                                        {' '}(Goal: {goalMetrics.find(m => m.type === 'totalHours')!.target.toFixed(1)})
                                    </span>
                                )}
                            </div>
                            <div className="text-xl font-bold flex items-center gap-2">
                                {calculateHours().total.toFixed(2)}
                                {formatChange(
                                    calculateHours().total,
                                    calculateHours(false).total
                                )}
                            </div>
                        </div>
                    </div>

                    {showCharts && (
                        <div className="mt-6 space-y-6 border-t pt-6">
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Monthly Revenue Comparison</h4>
                                <div className="h-[300px] sm:h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={prepareRevenueData(rows)}>
                                            <XAxis dataKey="name" />
                                            <YAxis
                                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                                            />
                                            <Tooltip
                                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                                                labelFormatter={(label) => `${label} Revenue`}
                                            />
                                            <Legend />
                                            {rows.map((row, index) => (
                                                <Bar
                                                    key={row.visitType}
                                                    dataKey={row.visitType}
                                                    stackId="stack"
                                                    fill={COLORS[index % COLORS.length]}
                                                    name={row.visitType}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2">Time Allocation by Service</h4>
                                <div className="h-[300px] sm:h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={prepareTimeData(rows)}>
                                            <XAxis dataKey="name" />
                                            <YAxis tickFormatter={(value) => `${value.toFixed(1)}h`} />
                                            <Tooltip formatter={(value) => `${Number(value).toFixed(1)} hours`} />
                                            <Legend />
                                            {rows.map((row, index) => (
                                                <Bar
                                                    key={row.visitType}
                                                    dataKey={row.visitType}
                                                    stackId="stack"
                                                    fill={COLORS[index % COLORS.length]}
                                                    name={row.visitType}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Actual Payer Mix (Revenue)</h4>
                                    <div className="h-[300px]">
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
                                    <h4 className="text-sm font-semibold mb-2">Planned Payer Mix (Revenue)</h4>
                                    <div className="h-[300px]">
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TherapyCalculator;