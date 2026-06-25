import { VitalThreshold } from './types';

export const defaultVitalSettings: VitalThreshold[] = [
  {
    id: 'bp',
    name: 'vitals.bp',
    unit: 'mmHg',
    minNormal: 110,
    maxNormal: 135,
    minDiastolic: 60,
    maxDiastolic: 85,
    highLabel: 'vitals.hypertension',
    lowLabel: 'vitals.hypotension'
  },
  {
    id: 'hr',
    name: 'vitals.hr',
    unit: 'bpm',
    minNormal: 60,
    maxNormal: 100,
    highLabel: 'vitals.tachycardia',
    lowLabel: 'vitals.bradycardia'
  },
  {
    id: 'temp',
    name: 'vitals.temp',
    unit: '°C',
    minNormal: 36.5,
    maxNormal: 37.5,
    highLabel: 'vitals.hyperthermia',
    lowLabel: 'vitals.hypothermia'
  },
  {
    id: 'spo2',
    name: 'vitals.spo2',
    unit: '%',
    minNormal: 95,
    maxNormal: 100,
    highLabel: 'vitals.normal',
    lowLabel: 'vitals.hypoxia'
  },
  {
    id: 'rr',
    name: 'vitals.rr',
    unit: '/min',
    minNormal: 12,
    maxNormal: 20,
    highLabel: 'vitals.tachypnea',
    lowLabel: 'vitals.bradypnea'
  },
  {
    id: 'glucose',
    name: 'vitals.glucose',
    unit: 'mg/dL',
    minNormal: 70,
    maxNormal: 130,
    highLabel: 'vitals.hyperglycemia',
    lowLabel: 'vitals.hypoglycemia'
  },
  {
    id: 'weight',
    name: 'vitals.weight',
    unit: 'kg',
    minNormal: 50,
    maxNormal: 90,
    highLabel: 'vitals.overweight',
    lowLabel: 'vitals.underweight'
  }
];
