const PICKUP_PINCODE = '520001';

// Rate chart from NimbusPost billing portal for pickup pincode 520001 (0.50 kg slab)
const RATE_CHART = {
  'A': {
    couriers: [
      { name: 'Amazon Shipping', rate: 40.93, cod_flat: 27.12, cod_pct: 2.03, etd: 3 },
      { name: 'Shree-Maruti', rate: 24.92, cod_flat: 24.58, cod_pct: 1.53, etd: 2 },
      { name: 'Ekart', rate: 30.45, cod_flat: 31, cod_pct: 1.9, etd: 2 },
      { name: 'Xpressbees Surface', rate: 31.50, cod_flat: 30.5, cod_pct: 1.65, etd: 3 },
      { name: 'Delhivery Surface', rate: 34.65, cod_flat: 40, cod_pct: 1.85, etd: 3 },
      { name: 'Xpressbees Air', rate: 32.55, cod_flat: 38, cod_pct: 1.85, etd: 2 },
      { name: 'Shadowfax', rate: 39.58, cod_flat: 35.1, cod_pct: 1.7, etd: 3 },
    ]
  },
  'B': {
    couriers: [
      { name: 'Amazon Shipping', rate: 48.94, cod_flat: 27.12, cod_pct: 2.03, etd: 3 },
      { name: 'Shree-Maruti', rate: 32.03, cod_flat: 24.58, cod_pct: 1.53, etd: 2 },
      { name: 'Xpressbees Surface', rate: 35.70, cod_flat: 30.5, cod_pct: 1.65, etd: 3 },
      { name: 'Ekart', rate: 37.80, cod_flat: 31, cod_pct: 1.9, etd: 3 },
      { name: 'Delhivery Surface', rate: 42.00, cod_flat: 40, cod_pct: 1.85, etd: 4 },
      { name: 'Shadowfax', rate: 43.68, cod_flat: 35.1, cod_pct: 1.7, etd: 3 },
      { name: 'Delhivery Air', rate: 49.35, cod_flat: 42, cod_pct: 1.85, etd: 3 },
    ]
  },
  'C': {
    couriers: [
      { name: 'Amazon Shipping', rate: 53.39, cod_flat: 27.12, cod_pct: 2.03, etd: 3 },
      { name: 'Shree-Maruti', rate: 37.37, cod_flat: 24.58, cod_pct: 1.53, etd: 3 },
      { name: 'Xpressbees Surface', rate: 38.85, cod_flat: 30.5, cod_pct: 1.65, etd: 3 },
      { name: 'Ekart', rate: 44.10, cod_flat: 31, cod_pct: 1.9, etd: 4 },
      { name: 'Delhivery Surface', rate: 49.35, cod_flat: 40, cod_pct: 1.85, etd: 4 },
      { name: 'Shadowfax', rate: 51.86, cod_flat: 35.1, cod_pct: 1.7, etd: 4 },
      { name: 'Xpressbees Air', rate: 55.65, cod_flat: 38, cod_pct: 1.85, etd: 3 },
    ]
  },
  'D': {
    couriers: [
      { name: 'Amazon Shipping', rate: 57.84, cod_flat: 27.12, cod_pct: 2.03, etd: 3 },
      { name: 'Shree-Maruti', rate: 42.71, cod_flat: 24.58, cod_pct: 1.53, etd: 3 },
      { name: 'Xpressbees Surface', rate: 45.68, cod_flat: 30.5, cod_pct: 1.65, etd: 4 },
      { name: 'Delhivery Surface', rate: 50.40, cod_flat: 40, cod_pct: 1.85, etd: 5 },
      { name: 'Ekart', rate: 52.50, cod_flat: 31, cod_pct: 1.9, etd: 4 },
      { name: 'Shadowfax', rate: 55.96, cod_flat: 35.1, cod_pct: 1.7, etd: 4 },
      { name: 'Xpressbees Air', rate: 64.05, cod_flat: 38, cod_pct: 1.85, etd: 4 },
    ]
  },
  'E': {
    couriers: [
      { name: 'Amazon Shipping', rate: 72.97, cod_flat: 27.12, cod_pct: 2.03, etd: 3 },
      { name: 'Xpressbees Surface', rate: 57.75, cod_flat: 30.5, cod_pct: 1.65, etd: 5 },
      { name: 'Shree-Maruti', rate: 60.51, cod_flat: 24.58, cod_pct: 1.53, etd: 5 },
      { name: 'Delhivery Surface', rate: 77.70, cod_flat: 40, cod_pct: 1.85, etd: 6 },
      { name: 'Shadowfax', rate: 81.90, cod_flat: 35.1, cod_pct: 1.7, etd: 5 },
      { name: 'Delhivery Air', rate: 105.00, cod_flat: 42, cod_pct: 1.85, etd: 5 },
    ]
  }
};

function getZone(deliveryPincode) {
  const dp = deliveryPincode.toString().padStart(6, '0');
  const prefix3 = parseInt(dp.slice(0, 3), 10);

  // Zone A: Local area (Vijayawada + Guntur region: 520-522)
  if (prefix3 >= 520 && prefix3 <= 522) return 'A';

  // Metro pincode prefixes (Delhi, Mumbai, Kolkata, Chennai, Bangalore, Hyd, Pune, Ahmedabad)
  const metroPrefixes = ['110', '400', '700', '600', '560', '500', '411', '380'];
  if (metroPrefixes.some(m => dp.startsWith(m))) return 'C';

  // Zone B: Rest of Andhra Pradesh (516-519, 523, and 530-535)
  if ((prefix3 >= 516 && prefix3 <= 519) || prefix3 === 523 || (prefix3 >= 530 && prefix3 <= 535)) return 'B';

  // Zone E: Remote / ROI Far (NE states 78xxx-79xxx, J&K 18xxx-19xxx)
  const remotePrefixes = ['78', '79', '18', '19'];
  if (remotePrefixes.some(r => dp.startsWith(r))) return 'E';

  // Zone D: Rest of India (ROI Near)
  return 'D';
}

function getRatesForPincode(deliveryPincode) {
  const zone = getZone(deliveryPincode);
  const zoneData = RATE_CHART[zone];
  if (!zoneData) return { zone: 'D', couriers: RATE_CHART['D'].couriers };

  return {
    zone,
    couriers: zoneData.couriers.map(c => ({
      ...c,
      estimated_delivery_days: c.etd
    }))
  };
}

module.exports = { getZone, getRatesForPincode, RATE_CHART };
