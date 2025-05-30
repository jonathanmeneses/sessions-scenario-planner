'use client';
import React, { useState, useEffect, ChangeEvent } from 'react';
import styles from './CalculatorWidget.module.css';
import Link from 'next/link';

interface ClientIncome {
  type: 'client';
  label: string;
  rate: number;
  sessionsPerMonth: number;
}
interface MiscIncome {
  type: 'misc';
  label: string;
  miscAmount: number;
  miscPeriod: 'week' | 'month' | 'year';
}
interface ConsultingIncome {
  type: 'consulting';
  label: string;
  consultingRate: number;
  consultingHours: number;
}
interface W2Income {
  type: 'w2';
  label: string;
  w2Amount: number;
  w2Start: 'all' | string;
}
type Income = ClientIncome | MiscIncome | ConsultingIncome | W2Income;

const INCOME_TYPES = [
  { value: 'client', label: 'Clients/Hourly Rates' },
  { value: 'misc', label: 'Periodic Income' },
] as const;

const defaultIncome: Income = {
  type: 'client',
  label: 'Client Session',
  rate: 150,
  sessionsPerMonth: 20,
} as ClientIncome;

const STORAGE_KEY = 'incomeCalculatorState';

function calculateAnnualIncome(incomes: Income[], weeksOff: number): number {
  const workingWeeks = 52 - weeksOff;
  let total = 0;
  incomes.forEach((income) => {
    switch (income.type) {
      case 'client': {
        const monthly = income.rate * income.sessionsPerMonth;
        const annual = monthly * 12 * (workingWeeks / 52);
        total += Math.round(annual);
        break;
      }
      case 'misc': {
        let annual = 0;
        if (income.miscPeriod === 'week')
          annual = income.miscAmount * workingWeeks;
        else if (income.miscPeriod === 'month') annual = income.miscAmount * 12;
        else if (income.miscPeriod === 'year') annual = income.miscAmount;
        total += Math.round(annual);
        break;
      }
      case 'consulting': {
        const monthly = income.consultingRate * income.consultingHours;
        const annual = monthly * 12 * (workingWeeks / 52);
        total += Math.round(annual);
        break;
      }
      case 'w2': {
        let annual = income.w2Amount;
        if (income.w2Start !== 'all') {
          const startMonth = parseInt(income.w2Start.split('-')[1], 10);
          const monthsWorked = 13 - startMonth;
          annual = income.w2Amount * (monthsWorked / 12);
        }
        total += Math.round(annual);
        break;
      }
      default:
        break;
    }
  });
  return total;
}

export default function CalculatorWidget() {
  const [weeksOff, setWeeksOff] = useState<number>(4);
  const [incomes, setIncomes] = useState<Income[]>([
    { ...defaultIncome, label: 'Client Session 1' } as ClientIncome,
  ]);
  const [incomeGoal, setIncomeGoal] = useState<number | null>(null);
  const [newType, setNewType] = useState<string>('client');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.weeksOff === 'number') setWeeksOff(parsed.weeksOff);
          if (Array.isArray(parsed.incomes))
            setIncomes(
              parsed.incomes.length > 0
                ? parsed.incomes
                : [{ ...defaultIncome, label: 'Client Session 1' }],
            );
        }
      } catch (e) {
        console.error('Failed to parse from localStorage', e);
        setIncomes([{ ...defaultIncome, label: 'Client Session 1' }]);
      }
    }
    const savedGoal = localStorage.getItem('incomeGoal');
    if (savedGoal) setIncomeGoal(Number(savedGoal));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ weeksOff, incomes }));
  }, [weeksOff, incomes]);

  useEffect(() => {
    if (incomeGoal !== null) {
      localStorage.setItem('incomeGoal', String(incomeGoal));
    } else {
      localStorage.removeItem('incomeGoal');
    }
  }, [incomeGoal]);

  const handleIncomeChange = (idx: number, field: string, value: any) => {
    setIncomes((currentIncomes) =>
      currentIncomes.map((inc, i) =>
        i === idx ? { ...inc, [field]: value } : inc,
      ),
    );
  };

  const handleTypeChange = (idx: number, type: string) => {
    setIncomes((currentIncomes) =>
      currentIncomes.map((inc, i) => {
        if (i === idx) {
          const baseLabel =
            INCOME_TYPES.find((t) => t.value === type)?.label || '';
          const newLabel =
            type === 'client'
              ? `${baseLabel} ${currentIncomes.filter((income) => income.type === 'client').length}`
              : baseLabel;
          if (type === 'client') {
            return { ...defaultIncome, type, label: newLabel } as ClientIncome;
          } else if (type === 'misc') {
            return {
              type: 'misc',
              label: baseLabel,
              miscAmount: 0,
              miscPeriod: 'month',
            } as MiscIncome;
          }
        }
        return inc;
      }),
    );
  };

  const handleAddIncome = () => {
    const clientIncomes = incomes.filter((i) => i.type === 'client');
    const label = `Client Session ${clientIncomes.length + 1}`;
    setIncomes([
      ...incomes,
      { ...defaultIncome, type: 'client', label } as ClientIncome,
    ]);
  };

  const handleRemoveIncome = (idx: number) => {
    setIncomes(incomes.filter((_, i) => i !== idx));
  };

  const handleClear = () => {
    const resetState = {
      weeksOff: 4,
      incomes: [{ ...defaultIncome, label: 'Client Session 1' }],
    };
    setWeeksOff(resetState.weeksOff);
    setIncomes(resetState.incomes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
  };

  const handleUpdateGoal = () => {
    setIncomeGoal(annualIncome);
  };

  const handleClearGoal = () => {
    setIncomeGoal(null);
  };

  const annualIncome = calculateAnnualIncome(incomes, weeksOff);
  const percent =
    incomeGoal && incomeGoal > 0
      ? Math.round(((annualIncome - incomeGoal) / incomeGoal) * 100)
      : null;

  return (
    <div className={styles['income-calculator-widget']}>
      {incomeGoal !== null && (
        <div className={styles['income-goal-card']}>
          <span>
            <strong>Income Goal:</strong> ${incomeGoal.toLocaleString()}
          </span>
          <button
            className={styles['clear-goal-btn']}
            onClick={handleClearGoal}
          >
            Clear Goal
          </button>
        </div>
      )}
      <div className={styles['header-row']}>
        <span className={styles['title']}>Income Calculator</span>
        <Link href="/" className={styles['advanced-link']}>
          Advanced Income Calculator{' '}
          <span className={styles['external-link-icon']}>↗</span>
        </Link>
      </div>
      <div className={`${styles['input-group']} ${styles['weeks-off-row']}`}>
        <label htmlFor="weeksOffInput">Weeks off per year</label>
        <div className={styles['input-slider-wrapper']}>
          <input
            id="weeksOffInput"
            type="number"
            min={0}
            max={52}
            value={weeksOff}
            onChange={(e) => setWeeksOff(Number(e.target.value))}
            className={styles['weeks-off-input']}
          />
          <input
            type="range"
            min={0}
            max={52}
            value={weeksOff}
            onChange={(e) => setWeeksOff(Number(e.target.value))}
            className={`${styles['weeks-off-slider']} ${styles['range-slider']}`}
          />
        </div>
      </div>
      <div className={styles['income-list']}>
        {incomes.map((income, idx) => (
          <div className={styles['income-item']} key={idx}>
            <div className={styles['income-header']}>
              <input
                className={styles['income-label-input']}
                value={income.label}
                onChange={(e) =>
                  handleIncomeChange(idx, 'label', e.target.value)
                }
                placeholder="Income Source Name"
              />
              <select
                value={income.type}
                onChange={(e) => handleTypeChange(idx, e.target.value)}
                className={styles['income-type-select']}
              >
                {INCOME_TYPES.map((typeOpt) => (
                  <option key={typeOpt.value} value={typeOpt.value}>
                    {typeOpt.label}
                  </option>
                ))}
              </select>
              <button
                className={styles['remove-btn']}
                onClick={() => handleRemoveIncome(idx)}
                title="Remove Income Source"
              >
                🗑️
              </button>
            </div>
            <div className={styles['income-fields']}>
              {income.type === 'client' && (
                <>
                  <div
                    className={`${styles['field']} ${styles['input-group']}`}
                  >
                    <label htmlFor={`rate-${idx}`}>Session rate</label>
                    <div className={styles['input-slider-wrapper']}>
                      <input
                        id={`rate-${idx}`}
                        type="number"
                        min={0}
                        step={5}
                        value={(income as ClientIncome).rate}
                        onChange={(e) =>
                          handleIncomeChange(
                            idx,
                            'rate',
                            Number(e.target.value),
                          )
                        }
                      />
                      <input
                        type="range"
                        min={0}
                        max={500}
                        step={5}
                        value={(income as ClientIncome).rate}
                        onChange={(e) =>
                          handleIncomeChange(
                            idx,
                            'rate',
                            Number(e.target.value),
                          )
                        }
                        className={styles['range-slider']}
                      />
                    </div>
                  </div>
                  <div
                    className={`${styles['field']} ${styles['input-group']}`}
                  >
                    <label htmlFor={`sessions-${idx}`}>
                      Sessions per month
                    </label>
                    <div className={styles['input-slider-wrapper']}>
                      <input
                        id={`sessions-${idx}`}
                        type="number"
                        min={0}
                        max={100}
                        value={(income as ClientIncome).sessionsPerMonth}
                        onChange={(e) =>
                          handleIncomeChange(
                            idx,
                            'sessionsPerMonth',
                            Number(e.target.value),
                          )
                        }
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={(income as ClientIncome).sessionsPerMonth}
                        onChange={(e) =>
                          handleIncomeChange(
                            idx,
                            'sessionsPerMonth',
                            Number(e.target.value),
                          )
                        }
                        className={styles['range-slider']}
                      />
                    </div>
                  </div>
                </>
              )}
              {income.type === 'misc' && (
                <>
                  <div
                    className={`${styles['field']} ${styles['input-group']}`}
                  >
                    <label htmlFor={`miscAmount-${idx}`}>Amount</label>
                    <input
                      id={`miscAmount-${idx}`}
                      type="number"
                      min={0}
                      value={(income as MiscIncome).miscAmount}
                      onChange={(e) =>
                        handleIncomeChange(
                          idx,
                          'miscAmount',
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div
                    className={`${styles['field']} ${styles['input-group']}`}
                  >
                    <label htmlFor={`miscPeriod-${idx}`}>Period</label>
                    <select
                      id={`miscPeriod-${idx}`}
                      value={(income as MiscIncome).miscPeriod}
                      onChange={(e) =>
                        handleIncomeChange(idx, 'miscPeriod', e.target.value)
                      }
                    >
                      <option value="week">per week</option>
                      <option value="month">per month</option>
                      <option value="year">per year</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {incomes.length === 0 && (
          <div className={styles['empty-state']}>
            Click "Add Income Stream" to begin.
          </div>
        )}
      </div>
      <div className={styles['add-income-row']}>
        <button
          className={`${styles['add-income-btn']} ${styles['action-button']}`}
          onClick={handleAddIncome}
        >
          + Add Income Stream
        </button>
      </div>
      <div className={styles['projected-income-box']}>
        <div className={styles['projected-label-row']}>
          <span className={styles['projected-income-title']}>
            Projected Annual Income
          </span>
          <span
            className={styles['info-icon']}
            title="This is an estimate based on the income streams and weeks off you provided."
          >
            ?
          </span>
        </div>
        <div className={styles['projected-income-value']}>
          <span className={styles['amount']}>
            {annualIncome ? `$${annualIncome.toLocaleString()}` : '$0'}
          </span>
          {incomeGoal && incomeGoal > 0 && percent !== 0 && percent !== null && (
            <span
              className={`${styles['percent-badge']} ${percent > 0 ? styles['positive'] : styles['negative']}`}
            >
              {percent > 0 ? '+' : ''} {percent}% vs. Goal
            </span>
          )}
        </div>
        <div className={`${styles['action-row']} ${styles['footer-actions']}`}>
          <button
            className={`${styles['clear-btn']} ${styles['action-button']} ${styles['secondary']}`}
            onClick={handleClear}
          >
            Clear Calculator
          </button>
          <button
            className={`${styles['update-goal-btn']} ${styles['action-button']} ${styles['primary']}`}
            onClick={handleUpdateGoal}
          >
            Save Income Goal
          </button>
        </div>
      </div>
    </div>
  );
}
