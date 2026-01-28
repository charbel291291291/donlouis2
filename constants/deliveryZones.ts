export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'zone_adonis', name: 'Adonis', fee: 1.00 },
  { id: 'zone_zouk_mosbeh', name: 'Zouk Mosbeh', fee: 2.00 },
  { id: 'zone_zouk_mikael', name: 'Zouk Mikael', fee: 2.50 },
  { id: 'zone_sarba', name: 'Sarba', fee: 3.00 },
  { id: 'zone_kaslik', name: 'Kaslik', fee: 3.00 },
  { id: 'zone_jounieh', name: 'Jounieh', fee: 3.50 },
  { id: 'zone_ballouneh', name: 'Ballouneh', fee: 4.00 },
  { id: 'zone_jeita', name: 'Jeita', fee: 4.50 },
  { id: 'zone_cornet_chehwan', name: 'Cornet Chehwan', fee: 5.00 },
];