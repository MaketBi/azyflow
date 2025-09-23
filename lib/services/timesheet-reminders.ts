import { supabase } from '../supabase';
import { NotificationPreferencesService } from './notification-preferences';
import { NotificationService } from './notifications';

export interface TimesheetReminderData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  month: string;
  year: number;
  lastReminderDate?: string;
  reminderCount: number;
}

export class TimesheetReminderService {
  
  /**
   * Trouve tous les freelancers qui n'ont pas soumis leur CRA pour le mois en cours
   */
  static async findMissingTimesheets(targetMonth: string, targetYear: number): Promise<TimesheetReminderData[]> {
    try {
      // Récupérer tous les utilisateurs freelancers actifs avec leurs contrats
      const { data: freelancers, error: freelancersError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone,
          contracts!inner(
            id,
            client_id,
            company_id,
            start_date,
            end_date
          )
        `)
        .eq('role', 'freelancer')
        .eq('active', true);

      if (freelancersError) {
        console.error('Error fetching freelancers:', freelancersError);
        return [];
      }

      const missingTimesheets: TimesheetReminderData[] = [];

      for (const freelancer of freelancers || []) {
        // Vérifier s'il a des contrats actifs pour ce mois
        const hasActiveContract = freelancer.contracts?.some((contract: any) => {
          const startDate = new Date(contract.start_date);
          const endDate = contract.end_date ? new Date(contract.end_date) : null;
          const targetDate = new Date(targetYear, parseInt(targetMonth) - 1, 1);
          
          return startDate <= targetDate && (!endDate || endDate >= targetDate);
        });

        if (!hasActiveContract) continue;

        // Vérifier s'il a déjà soumis son CRA pour ce mois
        const { data: existingTimesheet, error: timesheetError } = await supabase
          .from('timesheets')
          .select('id, status')
          .eq('contract_id', freelancer.contracts[0].id) // Prendre le premier contrat actif
          .eq('month', targetMonth)
          .eq('year', targetYear)
          .maybeSingle();

        if (timesheetError) {
          console.error('Error checking existing timesheet:', timesheetError);
          continue;
        }

        // Si aucun CRA ou CRA en draft seulement, ajouter aux rappels
        if (!existingTimesheet || existingTimesheet.status === 'draft') {
          // Récupérer les infos de dernier rappel
          const { data: lastReminder } = await (supabase as any)
            .from('timesheet_reminders')
            .select('last_reminder_date, reminder_count')
            .eq('user_id', freelancer.id)
            .eq('month', targetMonth)
            .eq('year', targetYear)
            .maybeSingle();

          missingTimesheets.push({
            userId: freelancer.id,
            userName: freelancer.full_name,
            userEmail: freelancer.email,
            userPhone: freelancer.phone || undefined,
            month: targetMonth,
            year: targetYear,
            lastReminderDate: lastReminder?.last_reminder_date,
            reminderCount: lastReminder?.reminder_count || 0
          });
        }
      }

      return missingTimesheets;
    } catch (error) {
      console.error('Error finding missing timesheets:', error);
      return [];
    }
  }

  /**
   * Détermine si un rappel doit être envoyé
   */
  static shouldSendReminder(reminderData: TimesheetReminderData, currentDate: Date): boolean {
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Vérifier si on est dans la période de rappel (à partir du 20)
    if (currentDay < 20) return false;

    // Vérifier si c'est le bon mois/année
    if (currentMonth !== reminderData.year || currentMonth !== parseInt(reminderData.month)) {
      // Si on est au mois suivant, continuer les rappels
      const isNextMonth = (currentMonth === parseInt(reminderData.month) + 1) || 
                         (reminderData.month === '12' && currentMonth === 1 && currentYear === reminderData.year + 1);
      if (!isNextMonth) return false;
    }

    // Premier rappel : dès le 20 du mois
    if (reminderData.reminderCount === 0) return true;

    // Rappels suivants : tous les 2 jours
    if (reminderData.lastReminderDate) {
      const lastReminderDate = new Date(reminderData.lastReminderDate);
      const daysSinceLastReminder = Math.floor((currentDate.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastReminder >= 2;
    }

    return true;
  }

  /**
   * Envoie un rappel à un freelancer
   */
  static async sendReminder(reminderData: TimesheetReminderData): Promise<void> {
    try {
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      
      const monthName = monthNames[parseInt(reminderData.month) - 1];
      const isFirstReminder = reminderData.reminderCount === 0;
      const reminderType = isFirstReminder ? 'premier rappel' : `rappel n°${reminderData.reminderCount + 1}`;
      
      // Message personnalisé selon le nombre de rappels
      let urgencyLevel = '';
      if (reminderData.reminderCount >= 3) {
        urgencyLevel = ' ⚠️ URGENT - ';
      } else if (reminderData.reminderCount >= 1) {
        urgencyLevel = ' 🔔 ';
      }

      const emailSubject = `${urgencyLevel}Rappel CRA - ${monthName} ${reminderData.year}`;
      const message = isFirstReminder 
        ? `Bonjour ${reminderData.userName},\n\nNous vous rappelons qu'il est temps de soumettre votre CRA pour ${monthName} ${reminderData.year}.\n\nMerci de vous connecter à AzyFlow pour remplir et soumettre votre CRA.\n\nCordialement,\nL'équipe AzyFlow`
        : `Bonjour ${reminderData.userName},\n\n${reminderType.toUpperCase()} : Votre CRA pour ${monthName} ${reminderData.year} n'a toujours pas été soumis.\n\nMerci de vous connecter rapidement à AzyFlow pour régulariser votre situation.\n\nCordialement,\nL'équipe AzyFlow`;

      // Vérifier les préférences de notification
      const shouldSendEmail = await NotificationPreferencesService.shouldSendNotification(
        reminderData.userId, 
        'timesheet_submitted', 
        'email'
      );

      const shouldSendWhatsApp = await NotificationPreferencesService.shouldSendNotification(
        reminderData.userId, 
        'timesheet_submitted', 
        'whatsapp'
      );

      // Envoyer email si autorisé
      if (shouldSendEmail && reminderData.userEmail) {
        await NotificationService.sendEmail({
          to: reminderData.userEmail,
          subject: emailSubject,
          html: message.replace(/\n/g, '<br>')
        });
      }

      // Envoyer WhatsApp si autorisé et numéro disponible
      if (shouldSendWhatsApp && reminderData.userPhone) {
        await NotificationService.sendWhatsApp({
          to: reminderData.userPhone,
          message: message
        });
      }

      // Enregistrer le rappel en base
      await this.recordReminder(reminderData);

      console.log(`Rappel envoyé à ${reminderData.userName} pour CRA ${monthName} ${reminderData.year}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  /**
   * Enregistre qu'un rappel a été envoyé
   */
  static async recordReminder(reminderData: TimesheetReminderData): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const { error } = await (supabase as any)
        .from('timesheet_reminders')
        .upsert({
          user_id: reminderData.userId,
          month: reminderData.month,
          year: reminderData.year,
          last_reminder_date: now,
          reminder_count: reminderData.reminderCount + 1,
          updated_at: now
        }, {
          onConflict: 'user_id,month,year'
        });

      if (error) {
        console.error('Error recording reminder:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error recording reminder:', error);
      throw error;
    }
  }

  /**
   * Processus principal de rappels automatiques
   */
  static async processAutomaticReminders(targetDate?: Date): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    errors: number;
  }> {
    try {
      console.log('🚀 Appel de la fonction Edge pour les rappels automatiques...');
      
      // Appeler la fonction Edge qui fait tout le travail
      const { data, error } = await supabase.functions.invoke('timesheet-reminders', {
        body: {
          targetDate: targetDate?.toISOString(),
          manual: true
        }
      });

      if (error) {
        console.error('Erreur lors de l\'appel à la fonction Edge:', error);
        throw error;
      }

      console.log('✅ Fonction Edge exécutée avec succès:', data);
      
      return data.stats || { processed: 0, sent: 0, skipped: 0, errors: 1 };
    } catch (error) {
      console.error('Erreur lors du processus de rappels:', error);
      throw error;
    }
  }
}