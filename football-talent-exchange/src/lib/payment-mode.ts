/**
 * Paiements de démonstration (validés sans argent) : seulement en développement et dans les tests
 * automatiques (PAYMENTS_DEMO=1). Sur le vrai site, sans clés Stripe ou Flutterwave, les paiements sont
 * simplement « bientôt disponibles » : personne ne reçoit d'abonnement gratuit par erreur.
 */
export const demoPaymentsAllowed = () => process.env.NODE_ENV !== "production" || process.env.PAYMENTS_DEMO === "1";
