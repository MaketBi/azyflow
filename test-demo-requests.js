// Script de test pour ajouter des demandes de démo d'exemple
// À exécuter dans la console du navigateur pour tester le système

async function addTestDemoRequests() {
  console.log('🧪 Ajout de demandes de démo de test...');

  const testRequests = [
    {
      companyName: "TechSoft Solutions",
      contactName: "Marie Dupont",
      email: "marie.dupont@techsoft.fr",
      phone: "01 23 45 67 89",
      freelancersCount: "10-50",
      message: "Nous cherchons une solution pour optimiser la gestion de nos 25 freelancers spécialisés en développement web."
    },
    {
      companyName: "Digital Experts",
      contactName: "Jean Martin",
      email: "jean.martin@digitalexperts.com",
      phone: "",
      freelancersCount: "1-10",
      message: "Petite ESN naissante avec 8 freelancers. Besoin d'une solution professionnelle."
    },
    {
      companyName: "Innov'IT Consulting",
      contactName: "Sophie Laurent",
      email: "s.laurent@innovit.fr",
      phone: "01 98 76 54 32",
      freelancersCount: "50+",
      message: ""
    }
  ];

  for (const request of testRequests) {
    try {
      // Utiliser le service de demande de démo
      const response = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      console.log(`✅ Demande ajoutée pour ${request.companyName}`);
    } catch (error) {
      console.error(`❌ Erreur pour ${request.companyName}:`, error);
    }
  }

  console.log('🎉 Test terminé ! Rechargez le dashboard Super Admin pour voir les demandes.');
}

// Instructions d'utilisation
console.log(`
📋 Script de test des demandes de démo

Pour tester le système :
1. Ouvrez la landing page: http://localhost:5174/
2. Remplissez le formulaire de demande de démo
3. Allez sur le dashboard Super Admin: http://localhost:5174/super-admin
4. Cliquez sur l'onglet "Demandes de Démo"

Ou exécutez addTestDemoRequests() pour ajouter des données de test automatiquement.
`);

// Export pour utilisation
window.addTestDemoRequests = addTestDemoRequests;