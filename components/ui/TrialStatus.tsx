import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, Crown } from 'lucide-react';
import { TrialService, TrialStatus } from '../../lib/services/trial';

interface TrialStatusBadgeProps {
  companyId: string;
  className?: string;
  showDetails?: boolean;
}

export const TrialStatusBadge: React.FC<TrialStatusBadgeProps> = ({
  companyId,
  className = "",
  showDetails = false
}) => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrialStatus = async () => {
      try {
        const status = await TrialService.getTrialStatus(companyId);
        setTrialStatus(status);
      } catch (error) {
        console.error('Error fetching trial status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchTrialStatus();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
        <span className="text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (!trialStatus) {
    return null;
  }

  // Compte non-trial (premium/payant)
  if (!trialStatus.isActive && !trialStatus.isExpired && trialStatus.daysRemaining === 0) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full text-xs font-medium ${className}`}>
        <Crown className="w-3 h-3" />
        <span>Premium</span>
      </div>
    );
  }

  // Compte expiré
  if (trialStatus.isExpired) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium ${className}`}>
        <AlertTriangle className="w-3 h-3" />
        <span>Expiré</span>
        {showDetails && (
          <div className="ml-2 text-xs text-red-600">
            Accès suspendu
          </div>
        )}
      </div>
    );
  }

  // Compte expire bientôt (alerte)
  if (trialStatus.isExpiringSoon) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium ${className}`}>
        <AlertTriangle className="w-3 h-3" />
        <span>⚠️ {TrialService.formatTimeRemaining(trialStatus.daysRemaining)}</span>
        {showDetails && (
          <div className="ml-2 text-xs text-orange-600">
            Expire bientôt
          </div>
        )}
      </div>
    );
  }

  // Compte d'essai actif
  if (trialStatus.isActive) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium ${className}`}>
        <Clock className="w-3 h-3" />
        <span>🆓 {TrialService.formatTimeRemaining(trialStatus.daysRemaining)}</span>
        {showDetails && (
          <div className="ml-2 text-xs text-blue-600">
            Période d'essai
          </div>
        )}
      </div>
    );
  }

  return null;
};

interface TrialExpirationWarningProps {
  companyId: string;
  onUpgrade?: () => void;
  onExtend?: () => void;
}

export const TrialExpirationWarning: React.FC<TrialExpirationWarningProps> = ({
  companyId,
  onUpgrade,
  onExtend
}) => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrialStatus = async () => {
      try {
        const status = await TrialService.getTrialStatus(companyId);
        setTrialStatus(status);
      } catch (error) {
        console.error('Error fetching trial status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialStatus();
  }, [companyId]);

  if (loading || !trialStatus || (!trialStatus.isExpiringSoon && !trialStatus.isExpired)) {
    return null;
  }

  const isExpired = trialStatus.isExpired;
  const daysRemaining = trialStatus.daysRemaining;

  return (
    <div className={`rounded-lg p-4 border-l-4 ${
      isExpired 
        ? 'bg-red-50 border-red-400' 
        : 'bg-yellow-50 border-yellow-400'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${
            isExpired ? 'text-red-400' : 'text-yellow-400'
          }`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${
            isExpired ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {isExpired 
              ? '🚫 Période d\'essai expirée' 
              : `⏰ Période d'essai expire dans ${TrialService.formatTimeRemaining(daysRemaining)}`
            }
          </h3>
          <div className={`mt-2 text-sm ${
            isExpired ? 'text-red-700' : 'text-yellow-700'
          }`}>
            <p>
              {isExpired 
                ? 'Votre accès à la plateforme a été suspendu. Upgradez vers un plan premium pour retrouver l\'accès.'
                : 'Votre période d\'essai gratuite touche à sa fin. Upgradez maintenant pour continuer à utiliser Azyflow sans interruption.'
              }
            </p>
          </div>
          {(onUpgrade || onExtend) && (
            <div className="mt-4 flex space-x-3">
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className={`text-sm font-medium px-3 py-1 rounded ${
                    isExpired
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  } transition-colors`}
                >
                  💎 Upgrader maintenant
                </button>
              )}
              {onExtend && !isExpired && (
                <button
                  onClick={onExtend}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  📞 Demander une extension
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};