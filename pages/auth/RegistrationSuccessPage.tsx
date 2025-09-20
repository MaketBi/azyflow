import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const RegistrationSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Azyflow
          </h1>
        </div>

        {/* Contenu principal */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Icône de succès */}
          <motion.div
            className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>

          {/* Titre */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Compte créé avec succès ! 🎉
          </h2>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg text-left">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Email de confirmation envoyé
                </p>
                <p className="text-sm text-blue-700">
                  Vérifiez votre boîte mail et cliquez sur le lien pour activer votre compte.
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Étapes suivantes :</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-left">
                <li>Ouvrez votre boîte mail</li>
                <li>Cherchez l'email de confirmation d'Azyflow</li>
                <li>Cliquez sur le lien de confirmation</li>
                <li>Vous serez redirigé pour finaliser votre inscription</li>
              </ol>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
              size="lg"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Aller à la page de connexion
            </Button>
            
            <p className="text-xs text-gray-500">
              Vous n'avez pas reçu l'email ? Vérifiez vos spams ou{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 underline">
                essayez de vous reconnecter
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Aide */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Besoin d'aide ?{' '}
            <a href="mailto:support@azyflow.com" className="text-blue-600 hover:text-blue-800 underline">
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};