// Service d'envoi d'email d'invitation pour les freelances
export async function sendInvitationEmail(email: string, name: string, userId: string) {
  // TODO: Remplacer par l'intégration réelle (SendGrid, SMTP, etc.)
  // Exemple d'API d'envoi d'email
  const invitationLink = `${window.location.origin}/inscription?token=${userId}`;
  // Ici, on simule l'envoi
  console.log(`[EMAIL] Invitation envoyée à ${email} (${name}) avec le lien : ${invitationLink}`);
  // Retourne true pour le test
  return true;
}
