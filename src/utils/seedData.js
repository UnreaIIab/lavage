import { format, subDays } from 'date-fns';

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dayStr(daysAgo) {
  return format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
}

export const seedClients = [
  { id: 'c1', name: 'SARL Transport Algérie', phone: '+213 21 234 567', email: 'contact@transportdz.com', address: 'Zone Industrielle, Alger', createdAt: new Date(Date.now() - 30 * 864e5).toISOString() },
  { id: 'c2', name: 'Entreprise Boudjemâa BTP', phone: '+213 21 876 543', email: 'admin@boudjemaa.dz', address: 'Rue des Martyrs, Blida', createdAt: new Date(Date.now() - 60 * 864e5).toISOString() },
  { id: 'c3', name: 'Groupe Sonatrach Filiale', phone: '+213 21 999 100', email: 'fleet@sonatrach.dz', address: 'Hassi Messaoud, Ouargla', createdAt: new Date(Date.now() - 90 * 864e5).toISOString() },
];

export const seedRevenues = [
  { id: id(), clientType: 'Entreprise', clientName: 'SARL Transport Algérie', clientId: 'c1', carPlate: '16 1234 A', vehicleModel: 'Toyota Land Cruiser', washingType: 'Lavage complet', price: 2500, paymentMethod: 'Facture', date: dayStr(0), notes: '', createdAt: new Date().toISOString() },
  { id: id(), clientType: 'Particulier', clientName: 'Karim Mansouri', clientId: '', carPlate: '09 5678 B', vehicleModel: 'Renault Symbol', washingType: 'Lavage simple', price: 800, paymentMethod: 'Espèces', date: dayStr(0), notes: '', createdAt: new Date(Date.now() - 1e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'Entreprise Boudjemâa BTP', clientId: 'c2', carPlate: '09 4321 C', vehicleModel: 'Ford Transit', washingType: 'Lavage premium', price: 4000, paymentMethod: 'Carte', date: dayStr(1), notes: '', createdAt: new Date(Date.now() - 2e6).toISOString() },
  { id: id(), clientType: 'Particulier', clientName: 'Amira Benzekri', clientId: '', carPlate: '25 9876 D', vehicleModel: 'Peugeot 208', washingType: 'Lavage complet', price: 1500, paymentMethod: 'Espèces', date: dayStr(1), notes: '', createdAt: new Date(Date.now() - 3e6).toISOString() },
  { id: id(), clientType: 'Particulier', clientName: 'Mohamed Tizi', clientId: '', carPlate: '16 2222 E', vehicleModel: 'Dacia Logan', washingType: 'Lavage express', price: 600, paymentMethod: 'Espèces', date: dayStr(2), notes: '', createdAt: new Date(Date.now() - 4e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'Groupe Sonatrach Filiale', clientId: 'c3', carPlate: '31 7777 F', vehicleModel: 'Toyota Hilux', washingType: 'Détailing complet', price: 8000, paymentMethod: 'Virement bancaire', date: dayStr(2), notes: 'Service flotte complète', createdAt: new Date(Date.now() - 5e6).toISOString() },
  { id: id(), clientType: 'Particulier', clientName: 'Nassim Ouali', clientId: '', carPlate: '16 3333 G', vehicleModel: 'Volkswagen Golf', washingType: 'Nettoyage intérieur', price: 2000, paymentMethod: 'Carte', date: dayStr(3), notes: '', createdAt: new Date(Date.now() - 6e6).toISOString() },
  { id: id(), clientType: 'Particulier', clientName: 'Farida Khelil', clientId: '', carPlate: '09 4444 H', vehicleModel: 'Hyundai i10', washingType: 'Lavage simple', price: 800, paymentMethod: 'Espèces', date: dayStr(4), notes: '', createdAt: new Date(Date.now() - 7e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'SARL Transport Algérie', clientId: 'c1', carPlate: '16 5555 I', vehicleModel: 'Mercedes Sprinter', washingType: 'Lavage complet', price: 2500, paymentMethod: 'Facture', date: dayStr(5), notes: '', createdAt: new Date(Date.now() - 8e6).toISOString() },
  { id: id(), clientType: 'Particulier', clientName: 'Yacine Benali', clientId: '', carPlate: '16 6666 J', vehicleModel: 'Peugeot 301', washingType: 'Lavage à la main', price: 1200, paymentMethod: 'Espèces', date: dayStr(6), notes: '', createdAt: new Date(Date.now() - 9e6).toISOString() },
  { id: id(), clientType: 'Particulier', clientName: 'Sara Hadj', clientId: '', carPlate: '16 7777 K', vehicleModel: 'Renault Clio', washingType: 'Lavage complet', price: 1500, paymentMethod: 'Paiement mobile', date: dayStr(7), notes: '', createdAt: new Date(Date.now() - 10e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'Entreprise Boudjemâa BTP', clientId: 'c2', carPlate: '09 8888 L', vehicleModel: 'Peugeot Boxer', washingType: 'Lavage premium', price: 4000, paymentMethod: 'Facture', date: dayStr(8), notes: '', createdAt: new Date(Date.now() - 11e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'SARL Transport Algérie', clientId: 'c1', carPlate: '16 9010 M', vehicleModel: 'Toyota Corolla', washingType: 'Lavage simple', price: 800, paymentMethod: 'Facture', date: dayStr(9), notes: '', createdAt: new Date(Date.now() - 12e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'Groupe Sonatrach Filiale', clientId: 'c3', carPlate: '31 2233 N', vehicleModel: 'Mitsubishi Pajero', washingType: 'Détailing complet', price: 8000, paymentMethod: 'Virement bancaire', date: dayStr(10), notes: '', createdAt: new Date(Date.now() - 13e6).toISOString() },
  { id: id(), clientType: 'Particulier', clientName: 'Djamel Cherif', clientId: '', carPlate: '25 2345 O', vehicleModel: 'Audi A4', washingType: 'Détailing complet', price: 6000, paymentMethod: 'Carte', date: dayStr(11), notes: 'Détailing avant vente', createdAt: new Date(Date.now() - 14e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'Entreprise Boudjemâa BTP', clientId: 'c2', carPlate: '09 1122 P', vehicleModel: 'Renault Master', washingType: 'Lavage complet', price: 2500, paymentMethod: 'Facture', date: dayStr(12), notes: '', createdAt: new Date(Date.now() - 15e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'SARL Transport Algérie', clientId: 'c1', carPlate: '16 4455 Q', vehicleModel: 'Iveco Daily', washingType: 'Lavage complet', price: 2500, paymentMethod: 'Facture', date: dayStr(13), notes: '', createdAt: new Date(Date.now() - 16e6).toISOString() },
  { id: id(), clientType: 'Entreprise', clientName: 'Groupe Sonatrach Filiale', clientId: 'c3', carPlate: '31 6677 R', vehicleModel: 'Land Rover Defender', washingType: 'Lavage premium', price: 4000, paymentMethod: 'Facture', date: dayStr(14), notes: '', createdAt: new Date(Date.now() - 17e6).toISOString() },
];

export const seedExpenses = [
  { id: id(), category: 'Eau', amount: 3500, date: dayStr(0), notes: 'Facture eau mensuelle', createdAt: new Date().toISOString() },
  { id: id(), category: 'Électricité', amount: 5200, date: dayStr(1), notes: 'Facture électricité', createdAt: new Date(Date.now() - 1e6).toISOString() },
  { id: id(), category: 'Salaires', amount: 25000, date: dayStr(2), notes: 'Salaires du personnel', createdAt: new Date(Date.now() - 2e6).toISOString() },
  { id: id(), category: "Produits d'entretien", amount: 8000, date: dayStr(5), notes: 'Shampoing, cire, polish', createdAt: new Date(Date.now() - 3e6).toISOString() },
  { id: id(), category: 'Loyer', amount: 30000, date: dayStr(7), notes: 'Loyer mensuel', createdAt: new Date(Date.now() - 4e6).toISOString() },
  { id: id(), category: 'Maintenance', amount: 4500, date: dayStr(10), notes: 'Réparation compresseur', createdAt: new Date(Date.now() - 5e6).toISOString() },
];
